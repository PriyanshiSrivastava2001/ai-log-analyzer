/**
 * AI Log Analyzer — Frontend JavaScript
 * =======================================
 * This file handles all user interactions:
 * - File drag & drop
 * - Uploading to our Flask backend
 * - Rendering the AI analysis results
 *
 * No frameworks needed — plain JavaScript works great here!
 */

// ─── DOM Element References ───────────────────────────────────────────────────
// We grab all the elements we'll need once, up front
const dropZone      = document.getElementById('dropZone');
const fileInput     = document.getElementById('fileInput');
const filePreview   = document.getElementById('filePreview');
const fileName      = document.getElementById('fileName');
const fileSize      = document.getElementById('fileSize');
const removeFileBtn = document.getElementById('removeFile');
const analyzeBtn    = document.getElementById('analyzeBtn');

const uploadSection  = document.querySelector('.upload-section');
const loadingSection = document.getElementById('loadingSection');
const resultsSection = document.getElementById('resultsSection');
const errorBanner    = document.getElementById('errorBanner');
const errorText      = document.getElementById('errorText');
const errorClose     = document.getElementById('errorClose');

// The loading step elements (1–4)
const steps = [1, 2, 3, 4].map(n => document.getElementById(`step${n}`));

// ─── State ─────────────────────────────────────────────────────────────────
// This holds our selected file between user actions
let selectedFile = null;


// ═══════════════════════════════════════════════════════════════════════════════
// FILE SELECTION HANDLING
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Called whenever a file is chosen (via click or drag-and-drop).
 * Shows a preview and enables the Analyze button.
 */
function handleFileSelected(file) {
  if (!file) return;

  // Validate type client-side (server also validates)
  const ext = file.name.split('.').pop().toLowerCase();
  if (!['txt', 'log'].includes(ext)) {
    showError('Please upload a .txt or .log file.');
    return;
  }

  // Validate size (2 MB)
  if (file.size > 2 * 1024 * 1024) {
    showError('File is too large. Max size is 2 MB.');
    return;
  }

  selectedFile = file;

  // Update the UI to show file info
  fileName.textContent = file.name;
  fileSize.textContent = formatBytes(file.size);
  filePreview.style.display = 'flex';
  dropZone.style.display = 'none';

  // Enable the analyze button
  analyzeBtn.disabled = false;
}

// Clicking anywhere in the drop zone opens the file picker
dropZone.addEventListener('click', () => fileInput.click());

// When user selects a file via the picker
fileInput.addEventListener('change', (e) => {
  if (e.target.files[0]) handleFileSelected(e.target.files[0]);
});

// Remove selected file — reset back to drop zone
removeFileBtn.addEventListener('click', () => {
  selectedFile = null;
  fileInput.value = '';
  filePreview.style.display = 'none';
  dropZone.style.display = 'block';
  analyzeBtn.disabled = true;
});

// ── Drag and Drop Events ──────────────────────────────────────────────────────

dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();                           // Allow drop
  dropZone.classList.add('drag-over');          // Visual feedback
});

dropZone.addEventListener('dragleave', () => {
  dropZone.classList.remove('drag-over');
});

dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('drag-over');
  const file = e.dataTransfer.files[0];         // Get the dropped file
  if (file) handleFileSelected(file);
});


// ═══════════════════════════════════════════════════════════════════════════════
// SAMPLE LOG LOADING
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Sample buttons let users test without their own log files.
 * We fetch the sample from our Flask backend and create a fake File object.
 */
document.querySelectorAll('.sample-btn').forEach(btn => {
  btn.addEventListener('click', async () => {
    const sampleName = btn.dataset.sample;
    btn.textContent = 'Loading...';
    btn.disabled = true;

    try {
      const response = await fetch(`/sample/${sampleName}`);
      const data = await response.json();

      if (data.error) throw new Error(data.error);

      // Convert the text content into a File object (Blob with a name)
      const blob = new Blob([data.content], { type: 'text/plain' });
      const file = new File([blob], data.filename, { type: 'text/plain' });
      handleFileSelected(file);

    } catch (err) {
      showError(`Could not load sample: ${err.message}`);
    } finally {
      btn.textContent = btn.dataset.sample.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
      btn.disabled = false;
    }
  });
});


// ═══════════════════════════════════════════════════════════════════════════════
// ANALYZE BUTTON — MAIN FLOW
// ═══════════════════════════════════════════════════════════════════════════════

analyzeBtn.addEventListener('click', async () => {
  if (!selectedFile) return;

  // ── Step 1: Show loading, hide upload UI ──
  uploadSection.style.display = 'none';
  resultsSection.style.display = 'none';
  loadingSection.style.display = 'block';
  resetLoadingSteps();

  // Animate through the loading steps while we wait
  const stepTimer = animateLoadingSteps();

  // ── Step 2: Build the form data to send ──
  // FormData is how we send files to a server in JavaScript
  const formData = new FormData();
  formData.append('logfile', selectedFile);

  // ── Step 3: Send to our Flask backend ──
  try {
    const response = await fetch('/analyze', {
      method: 'POST',
      body: formData                            // No Content-Type header needed — browser sets it
    });

    // Stop the loading animation
    clearTimeout(stepTimer);
    markAllStepsDone();

    const result = await response.json();

    // Small delay so user sees the "done" state
    await sleep(600);

    // ── Step 4: Handle the response ──
    if (result.error) {
      showError(result.error);
      showUploadSection();
    } else {
      renderResults(result.analysis);
    }

  } catch (err) {
    clearTimeout(stepTimer);
    showError('Network error. Is the Flask server running?');
    showUploadSection();
  }
});


// ═══════════════════════════════════════════════════════════════════════════════
// RENDER RESULTS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Takes the analysis object from the AI and builds the results UI.
 * Each section is a separate function for clarity.
 */
function renderResults(analysis) {
  loadingSection.style.display = 'none';
  resultsSection.style.display = 'block';

  // ── Health Score Ring ──
  const score = analysis.health_score ?? 50;
  document.getElementById('scoreNumber').textContent = score;
  // Calculate how much of the circle to fill (circumference = 2πr = 201)
  const offset = 201 - (201 * score / 100);
  const ring = document.getElementById('scoreRing');
  ring.style.strokeDashoffset = offset;
  // Color-code the ring based on score
  ring.style.stroke = score >= 70 ? '#3ddc84' : score >= 40 ? '#f5a623' : '#ff5f5f';

  // ── Metadata ──
  const chars = analysis.chars_analyzed?.toLocaleString() ?? '?';
  const tokens = analysis.tokens_used ?? '?';
  document.getElementById('resultsMeta').textContent =
    `${chars} characters analyzed · ${tokens} tokens used`;

  // ── Summary ──
  document.getElementById('summaryText').textContent = analysis.summary ?? 'No summary available.';
  document.getElementById('errorCount').textContent   = analysis.error_count ?? 0;
  document.getElementById('warningCount').textContent = analysis.warning_count ?? 0;

  // Severity badge
  const badge = document.getElementById('severityBadge');
  const sev = (analysis.severity ?? 'low').toLowerCase();
  badge.textContent = sev.toUpperCase();
  badge.className = `severity-badge ${sev}`;

  // ── Critical Issues ──
  const issuesList = document.getElementById('criticalIssuesList');
  issuesList.innerHTML = '';
  const issues = analysis.critical_issues ?? [];
  if (issues.length === 0) {
    issuesList.innerHTML = '<p style="color:var(--green);font-size:14px;">✓ No critical issues found</p>';
  } else {
    issues.forEach(issue => {
      issuesList.innerHTML += `
        <div class="issue-item">
          <div class="issue-title">${escapeHtml(issue.title)}</div>
          <p class="issue-desc">${escapeHtml(issue.description)}</p>
          ${issue.line_example
            ? `<div class="issue-line" title="${escapeHtml(issue.line_example)}">${escapeHtml(issue.line_example)}</div>`
            : ''}
        </div>`;
    });
  }

  // ── Root Causes ──
  const causesList = document.getElementById('rootCausesList');
  causesList.innerHTML = '';
  const causes = analysis.root_causes ?? [];
  if (causes.length === 0) {
    causesList.innerHTML = '<p style="color:var(--text-dim);font-size:14px;">No root causes identified</p>';
  } else {
    causes.forEach(cause => {
      const conf = (cause.confidence ?? 'medium').toLowerCase();
      causesList.innerHTML += `
        <div class="cause-item">
          <div class="cause-header">
            <span class="cause-title">${escapeHtml(cause.cause)}</span>
            <span class="confidence-tag ${conf}">${conf}</span>
          </div>
          <p class="cause-explanation">${escapeHtml(cause.explanation)}</p>
        </div>`;
    });
  }

  // ── Suggested Fixes ──
  const fixesList = document.getElementById('fixesList');
  fixesList.innerHTML = '';
  const fixes = analysis.suggested_fixes ?? [];
  if (fixes.length === 0) {
    fixesList.innerHTML = '<p style="color:var(--text-dim);font-size:14px;">No fixes needed</p>';
  } else {
    fixes.forEach((fix, i) => {
      const priority = (fix.priority ?? 'optional').toLowerCase();
      const stepsHtml = (fix.steps ?? [])
        .map(s => `<li>${escapeHtml(s)}</li>`)
        .join('');
      fixesList.innerHTML += `
        <div class="fix-item">
          <div class="fix-header">
            <span class="fix-number">${i + 1}</span>
            <span class="fix-title">${escapeHtml(fix.fix)}</span>
            <span class="priority-tag ${priority}">${priority}</span>
          </div>
          <ul class="fix-steps">${stepsHtml}</ul>
        </div>`;
    });
  }

  // ── Patterns ──
  const patternsList = document.getElementById('patternsList');
  patternsList.innerHTML = '';
  const patterns = analysis.patterns ?? [];
  patterns.forEach(p => {
    patternsList.innerHTML += `<li>${escapeHtml(p)}</li>`;
  });
  if (patterns.length === 0) {
    patternsList.innerHTML = '<li>No notable patterns detected</li>';
  }
}


// ═══════════════════════════════════════════════════════════════════════════════
// "ANALYZE ANOTHER" BUTTON
// ═══════════════════════════════════════════════════════════════════════════════

document.getElementById('analyzeAgainBtn').addEventListener('click', () => {
  // Reset file selection
  selectedFile = null;
  fileInput.value = '';
  filePreview.style.display = 'none';
  dropZone.style.display = 'block';
  analyzeBtn.disabled = true;

  // Switch back to upload view
  resultsSection.style.display = 'none';
  showUploadSection();

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
});


// ═══════════════════════════════════════════════════════════════════════════════
// ERROR HANDLING
// ═══════════════════════════════════════════════════════════════════════════════

function showError(message) {
  errorText.textContent = message;
  errorBanner.style.display = 'flex';
  // Auto-dismiss after 8 seconds
  setTimeout(() => { errorBanner.style.display = 'none'; }, 8000);
}

errorClose.addEventListener('click', () => {
  errorBanner.style.display = 'none';
});


// ═══════════════════════════════════════════════════════════════════════════════
// LOADING ANIMATION HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

function resetLoadingSteps() {
  steps.forEach(s => s.classList.remove('active', 'done'));
  steps[0].classList.add('active');
}

/**
 * Progressively activates each loading step with a delay.
 * This gives users visual feedback that something is happening.
 */
function animateLoadingSteps() {
  const delays = [0, 800, 2000, 3500];          // ms delay for each step

  delays.forEach((delay, i) => {
    setTimeout(() => {
      if (i > 0) steps[i - 1].classList.replace('active', 'done');
      if (steps[i]) steps[i].classList.add('active');
    }, delay);
  });
}

function markAllStepsDone() {
  steps.forEach(s => {
    s.classList.remove('active');
    s.classList.add('done');
  });
}


// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

function showUploadSection() {
  uploadSection.style.display = 'block';
  loadingSection.style.display = 'none';
}

/** Convert bytes to a human-readable string like "42 KB" */
function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Wait for a number of milliseconds (used with async/await) */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Prevent XSS attacks by escaping HTML special characters.
 * ALWAYS do this when inserting user/AI-generated text into innerHTML!
 */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
