# ⬡ AI Log Analyzer

A beginner-friendly web app that uses **Google Gemini AI** (free, no credit card)
to analyze log files and give you error summaries, root cause analysis, and fixes.

![Python](https://img.shields.io/badge/Python-3.10+-blue)
![Flask](https://img.shields.io/badge/Flask-3.0-green)
![Gemini](https://img.shields.io/badge/Google-Gemini%20Free-orange)

---

## ✅ Truly Free — No Card Required

Uses the **Google Gemini free tier**:
- 15 requests/minute
- 1,500 requests/day
- Just sign in with your Google account at https://aistudio.google.com

---

## 🗂 Project Structure

```
ai-log-analyzer/
├── app.py                  # Flask server — routes and file handling
├── analyzer.py             # Gemini API integration (uses built-in urllib)
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

### Step 1 — Get Your Free Gemini API Key

1. Go to **https://aistudio.google.com**
2. Sign in with your Google account
3. Click **"Get API Key"** → **"Create API key"**
4. Copy the key (looks like: `AIzaSy...`)

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
GEMINI_API_KEY=AIzaSy-your-actual-key-here
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
Your Browser → Flask (Python) → Google Gemini API (free)
                                       ↓
              ← JSON analysis ← AI reads your logs
```

No database, no complexity — just upload a file and get instant AI analysis.

---

## 🛠 Troubleshooting

| Problem | Fix |
|---------|-----|
| `GEMINI_API_KEY not found` | Make sure `.env` file exists and key is set |
| `403 Invalid API key` | Re-copy your key from aistudio.google.com |
| `429 Rate limit` | Wait 1 minute (free tier: 15 req/min) |
| `ModuleNotFoundError` | Run `pip install -r requirements.txt` with venv active |
| Port 5000 in use | Change `port=5000` to `port=5001` in `app.py` |

---

## 📄 License

MIT — free to use, modify, and share.
