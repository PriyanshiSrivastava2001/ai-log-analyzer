# ⬡ AI Log Analyzer

A beginner-friendly web app that uses **Groq AI** (free, no credit card)
to analyze log files and give you error summaries, root cause analysis, and fixes.

![Python](https://img.shields.io/badge/Python-3.10+-blue)
![Flask](https://img.shields.io/badge/Flask-3.0-green)
![Groq](https://img.shields.io/badge/Groq-Free-orange)

---

## ✅ Truly Free — No Card Required

Uses the **Groq free tier**:
- 30 requests/minute
- 14,400 requests/day
- Just sign in with your Google/GitHub account at https://console.groq.com

---

## 🗂 Project Structure

```
ai-log-analyzer/
├── app.py                  # Flask server — routes and file handling
├── analyzer.py             # Groq API integration (uses built-in urllib)
├── templates/
│   └── index.html          # Single-page UI
├── static/
│   ├── css/style.css       # Dark terminal theme
│   └── js/main.js          # Drag-drop, fetch, render results
├── sample_logs/            # 3 test logs (Django, Nginx, PostgreSQL)
├── .env.example            # Template for your API key
├── requirements.txt        # Only 2 packages needed!
└── README.md
```

---

## 🚀 Setup — Step by Step

### Step 1 — Get Your Free Groq API Key

1. Go to **https://console.groq.com**
2. Sign in with your Google or GitHub account
3. Click **"API Keys"** → **"Create API Key"**
4. Copy the key

### Step 2 — Download & Unzip

```bash
unzip ai-log-analyzer.zip
cd ai-log-analyzer
```

### Step 3 — Create Virtual Environment

```bash
python -m venv venv

# Mac/Linux:
source venv/bin/activate

# Windows:
venv\Scripts\activate
```

### Step 4 — Install Dependencies (only 2!)

```bash
pip install -r requirements.txt
```

### Step 5 — Add Your API Key

```bash
cp .env.example .env
```

Open `.env` in any text editor and replace the placeholder:
```
GROQ_API_KEY=your_groq_key_here
```

### Step 6 — Run It!

```bash
python app.py
```

Open **http://localhost:5000** in your browser 🎉

Click any **sample button** to test instantly — no log file needed.

---

## 💡 How It Works

```
Your Browser → Flask (Python) → Groq API (free)
                                       ↓
              ← JSON analysis ← AI reads your logs
```

No database, no complexity — just upload a file and get instant AI analysis.

---

## 🛠 Troubleshooting

| Problem | Fix |
|---------|-----|
| `GROQ_API_KEY not found` | Make sure `.env` file exists and key is set |
| `401 Invalid API key` | Re-copy your key from console.groq.com |
| `429 Rate limit` | Wait 1 minute (free tier: 30 req/min) |
| `ModuleNotFoundError` | Run `pip install -r requirements.txt` with venv active |
| Port 5000 in use | Change `port=5000` to `port=5001` in `app.py` |

---

## 📄 License

MIT — free to use, modify, and share.
