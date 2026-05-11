"""
Log Analyzer Module
====================
This module handles all communication with the Google Gemini API.
Gemini has a FREE tier — no credit card needed, just a Google account.

HOW TO GET YOUR FREE API KEY:
1. Go to https://aistudio.google.com
2. Sign in with your Google account
3. Click "Get API Key" → "Create API key"
4. Copy and paste it into your .env file

KEY CONCEPTS FOR BEGINNERS:
- We send the log content to Gemini as a "prompt"
- We ask Gemini to respond in JSON format so we can easily parse it
- The free tier allows 15 requests per minute — more than enough
"""

import os
import json
import urllib.request   # Built-in Python library — no install needed
import urllib.error

# ─── Configuration ────────────────────────────────────────────────────────────

# Read the API key from the .env file (loaded by app.py via python-dotenv)
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Gemini API endpoint — we use the free gemini-1.5-flash model
GEMINI_URL = (
    "https://generativelanguage.googleapis.com/v1beta/models/"
    "gemini-2.0-flash:generateContent?key=" + (GEMINI_API_KEY or "")
)

# Maximum characters to send — keeps responses fast and within free limits
MAX_LOG_CHARS = 12000


# ─── Main Analysis Function ───────────────────────────────────────────────────

def analyze_logs(log_content: str) -> dict:
    """
    Send log content to Gemini and return structured analysis.

    Parameters:
        log_content (str): The raw text content of the uploaded log file

    Returns:
        dict: Either {'analysis': {...}} on success, or {'error': '...'} on failure
    """

    # ── Step 1: Check that the API key is set ──
    if not GEMINI_API_KEY:
        return {'error': 'GEMINI_API_KEY not found. Please add it to your .env file.'}

    # ── Step 2: Trim the log if it's too long ──
    # We take the LAST portion because recent logs are usually most relevant
    if len(log_content) > MAX_LOG_CHARS:
        log_content = log_content[-MAX_LOG_CHARS:]
        truncated = True
    else:
        truncated = False

    # ── Step 3: Build the prompt ──
    # We give Gemini clear instructions + the log content in one message
    prompt = f"""You are an expert DevOps engineer and log analysis specialist.
Analyze the application logs below and respond with ONLY a valid JSON object.
No extra text, no markdown fences, no explanation — just the raw JSON.

Return exactly this structure:
{{
  "summary": "2-3 sentence plain English overview of what happened",
  "severity": "critical|high|medium|low",
  "error_count": <number of ERROR lines>,
  "warning_count": <number of WARNING lines>,
  "critical_issues": [
    {{
      "title": "Short issue title",
      "description": "What happened and where",
      "line_example": "Relevant log line excerpt"
    }}
  ],
  "root_causes": [
    {{
      "cause": "What likely caused this issue",
      "confidence": "high|medium|low",
      "explanation": "Why you believe this is the cause"
    }}
  ],
  "suggested_fixes": [
    {{
      "fix": "Action title",
      "steps": ["Step 1", "Step 2", "Step 3"],
      "priority": "immediate|soon|optional"
    }}
  ],
  "patterns": ["Notable pattern or observation"],
  "health_score": <integer 0-100>
}}

Rules:
- critical_issues: up to 5 most important problems
- root_causes: 1-3 probable causes, most likely first
- suggested_fixes: up to 4 actionable fixes
- patterns: 2-4 observations
- Be specific and reference actual content from the logs
- If logs are healthy, say so and give a high health_score

--- LOG FILE START ---
{log_content}
--- LOG FILE END ---
{'(Note: Logs truncated to most recent 12,000 characters)' if truncated else ''}

Respond with ONLY the JSON object."""

    # ── Step 4: Build the request payload ──
    # Gemini expects a specific JSON structure
    payload = {
        "contents": [
            {
                "parts": [
                    {"text": prompt}
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0.3,        # Lower = more consistent/factual
            "maxOutputTokens": 2000    # Limit response length
        }
    }

    # ── Step 5: Send the HTTP request to Gemini ──
    # We use urllib (built into Python) so no extra library is needed
    try:
        payload_bytes = json.dumps(payload).encode('utf-8')

        req = urllib.request.Request(
            GEMINI_URL,
            data=payload_bytes,
            headers={"Content-Type": "application/json"},
            method="POST"
        )

        with urllib.request.urlopen(req, timeout=30) as response:
            response_data = json.loads(response.read().decode('utf-8'))

        # ── Step 6: Extract the text from Gemini's response ──
        # Gemini wraps the reply in a nested structure
        raw_text = response_data["candidates"][0]["content"]["parts"][0]["text"]

        # Clean up any accidental markdown fences Gemini might add
        raw_text = raw_text.strip()
        if raw_text.startswith("```"):
            # Remove opening fence (```json or ```)
            raw_text = raw_text.split("\n", 1)[1] if "\n" in raw_text else raw_text[3:]
            # Remove closing fence
            if raw_text.endswith("```"):
                raw_text = raw_text[:-3]

        # ── Step 7: Parse the JSON ──
        analysis = json.loads(raw_text.strip())

        # ── Step 8: Add metadata ──
        analysis['truncated'] = truncated
        analysis['chars_analyzed'] = len(log_content)
        # Gemini free tier doesn't always return token counts, so we estimate
        analysis['tokens_used'] = len(prompt.split()) * 2

        return {'analysis': analysis}

    except urllib.error.HTTPError as e:
        # Read the error body for a helpful message
        error_body = e.read().decode('utf-8', errors='replace')
        try:
            error_json = json.loads(error_body)
            message = error_json.get('error', {}).get('message', str(e))
        except Exception:
            message = str(e)

        if e.code == 400:
            return {'error': f'Bad request: {message}'}
        elif e.code == 403:
            return {'error': 'Invalid API key. Check your GEMINI_API_KEY in .env'}
        elif e.code == 429:
            return {'error': f'Quota/rate limit error: {message}'}  
        else:
            return {'error': f'Gemini API error {e.code}: {message}'}

    except json.JSONDecodeError as e:
        return {'error': 'AI returned unexpected format. Please try again.'}

    except Exception as e:
        return {'error': f'Analysis failed: {str(e)}'}
