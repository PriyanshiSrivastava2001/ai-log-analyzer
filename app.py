"""
AI Log Analyzer - Main Application
====================================
This is the entry point for our Flask web application.
Flask is a lightweight Python web framework — perfect for beginners.

HOW IT WORKS:
1. User visits the homepage and uploads a log file
2. Flask receives the file and reads its contents
3. We send the log content to OpenAI's API
4. OpenAI returns a structured analysis
5. We display the results back to the user
"""

import os                          # For reading environment variables
import json                        # For parsing JSON responses
from flask import (
    Flask,
    render_template,               # Renders our HTML templates
    request,                       # Handles incoming HTTP requests
    jsonify                        # Converts Python dicts to JSON responses
)
from dotenv import load_dotenv     # Loads variables from our .env file
from analyzer import analyze_logs  # Our custom log analysis module

# ─── App Setup ────────────────────────────────────────────────────────────────

# Load environment variables from .env file
# This keeps secrets (like API keys) out of our source code
load_dotenv()

# Create the Flask application instance
# __name__ tells Flask where to find templates and static files
app = Flask(__name__)

# Configure the upload folder and allowed file types
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 2 * 1024 * 1024  # 2 MB max file size
ALLOWED_EXTENSIONS = {'txt', 'log'}


# ─── Helper Functions ─────────────────────────────────────────────────────────

def allowed_file(filename):
    """
    Check if the uploaded file has an allowed extension.
    We only accept .txt and .log files for safety.
    """
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


# ─── Routes ───────────────────────────────────────────────────────────────────

@app.route('/')
def index():
    """
    The homepage route.
    When a user visits '/', Flask calls this function
    and returns the rendered HTML page.
    """
    return render_template('index.html')


@app.route('/analyze', methods=['POST'])
def analyze():
    """
    The analysis endpoint.
    This route receives the uploaded log file via POST request,
    processes it, and returns the AI analysis as JSON.

    POST is used (instead of GET) because we're sending data to the server.
    """

    # ── Step 1: Check if a file was actually included in the request ──
    if 'logfile' not in request.files:
        return jsonify({'error': 'No file uploaded. Please select a log file.'}), 400

    file = request.files['logfile']

    # ── Step 2: Make sure the user didn't submit an empty file field ──
    if file.filename == '':
        return jsonify({'error': 'No file selected. Please choose a file.'}), 400

    # ── Step 3: Validate the file extension ──
    if not allowed_file(file.filename):
        return jsonify({'error': 'Invalid file type. Please upload a .txt or .log file.'}), 400

    # ── Step 4: Read the file content ──
    # We read it directly into memory instead of saving to disk
    # This is simpler and fine for small log files
    try:
        log_content = file.read().decode('utf-8', errors='replace')
    except Exception as e:
        return jsonify({'error': f'Could not read file: {str(e)}'}), 500

    # ── Step 5: Make sure the file isn't empty ──
    if not log_content.strip():
        return jsonify({'error': 'The uploaded file is empty.'}), 400

    # ── Step 6: Send logs to OpenAI for analysis ──
    # This is where the magic happens — see analyzer.py
    result = analyze_logs(log_content)

    # ── Step 7: Return the result ──
    # jsonify() converts our Python dictionary into a JSON HTTP response
    return jsonify(result)


@app.route('/sample/<name>')
def get_sample(name):
    """
    Serves sample log files so users can test without their own logs.
    Files are stored in the sample_logs/ folder.
    """
    # Security: only allow alphanumeric names to prevent path traversal attacks
    safe_name = ''.join(c for c in name if c.isalnum() or c in ('_', '-'))
    filepath = os.path.join('sample_logs', f'{safe_name}.txt')

    if not os.path.exists(filepath):
        return jsonify({'error': 'Sample not found'}), 404

    with open(filepath, 'r') as f:
        content = f.read()

    return jsonify({'content': content, 'filename': f'{safe_name}.txt'})


# ─── Run the App ──────────────────────────────────────────────────────────────

if __name__ == '__main__':
    # debug=True means Flask will auto-reload when you save changes
    # NEVER use debug=True in production!
    print("🚀 Starting AI Log Analyzer...")
    print("📂 Open http://localhost:5000 in your browser")
    app.run(debug=True, port=5000)
