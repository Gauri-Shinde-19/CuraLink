// Symptom Checker page script

let voiceRecorder = null;
let recordedAudio = null;

document.addEventListener('DOMContentLoaded', () => {
  if (!checkAuth()) return;

  const analyzeBtn = document.getElementById('analyzeBtn');
  const recordBtn = document.getElementById('recordBtn');
  const stopBtn = document.getElementById('stopBtn');
  const newAnalysisBtn = document.getElementById('newAnalysisBtn');
  const bookAppointmentBtn = document.getElementById('bookAppointmentBtn');

  if (analyzeBtn) analyzeBtn.addEventListener('click', handleAnalyzeSymptoms);
  if (recordBtn) recordBtn.addEventListener('click', startRecording);
  if (stopBtn) stopBtn.addEventListener('click', stopRecording);
  if (newAnalysisBtn) newAnalysisBtn.addEventListener('click', resetAnalysis);
  if (bookAppointmentBtn) bookAppointmentBtn.addEventListener('click', goToBookAppointment);

  loadAnalysisHistory();

  // Setup logout
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      API.removeToken();
      localStorage.removeItem('userType');
      window.location.href = 'index.html';
    });
  }

  voiceRecorder = new VoiceRecorder();
});

function startRecording() {
  const recordBtn = document.getElementById('recordBtn');
  const stopBtn = document.getElementById('stopBtn');
  const recordingStatus = document.getElementById('recordingStatus');

  voiceRecorder.start().then(success => {
    if (success) {
      recordBtn.style.display = 'none';
      stopBtn.style.display = 'inline-block';
      recordingStatus.textContent = '🔴 Recording...';
      recordingStatus.classList.add('active');
    } else {
      showError('Failed to access microphone');
    }
  });
}

function stopRecording() {
  const recordBtn = document.getElementById('recordBtn');
  const stopBtn = document.getElementById('stopBtn');
  const recordingStatus = document.getElementById('recordingStatus');
  const audioPlayback = document.getElementById('audioPlayback');
  const submitAudioBtn = document.getElementById('submitAudioBtn');

  voiceRecorder.stop();
  recordedAudio = voiceRecorder.getAudioBlob();

  recordBtn.style.display = 'inline-block';
  stopBtn.style.display = 'none';
  recordingStatus.textContent = '';
  recordingStatus.classList.remove('active');

  audioPlayback.src = voiceRecorder.getAudioUrl();
  audioPlayback.style.display = 'block';
  submitAudioBtn.style.display = 'block';
}

function handleAnalyzeSymptoms() {
  const symptomsInput = document.getElementById('symptomsInput').value.trim();

  if (!symptomsInput) {
    showError('Please enter your symptoms');
    return;
  }

  showLoading('Analyzing symptoms...');

  API.symptoms.analyze(symptomsInput, 'text')
    .then(response => {
      hideLoading();

      if (response.success) {
        displayResults(response.analysis);
        loadAnalysisHistory();
      } else {
        showError('Failed to analyze symptoms');
      }
    })
    .catch(error => {
      hideLoading();
      console.error('Error analyzing symptoms:', error);
      showError('An error occurred during analysis');
    });
}

function displayResults(analysis) {
  const resultsSection = document.getElementById('resultsSection');
  const illnessName = document.getElementById('illnessName');
  const illnessDescription = document.getElementById('illnessDescription');
  const severityLevel = document.getElementById('severityLevel');
  const severityBadge = document.getElementById('severityBadge');
  const recommendations = document.getElementById('recommendations');
  const confidenceBar = document.getElementById('confidenceBar');
  const confidenceText = document.getElementById('confidenceText');

  illnessName.textContent = analysis.illness;
  illnessDescription.textContent = analysis.description;
  severityLevel.textContent = analysis.severity;
  recommendations.textContent = analysis.recommendations;

  // Set severity badge color
  const severity = analysis.severity.toLowerCase();
  severityBadge.className = 'severity-badge';
  if (severity.includes('high')) {
    severityBadge.style.backgroundColor = '#dc3545';
  } else if (severity.includes('moderate')) {
    severityBadge.style.backgroundColor = '#ffc107';
  } else {
    severityBadge.style.backgroundColor = '#28a745';
  }
  severityBadge.textContent = analysis.severity.split('-')[0].trim();

  // Update confidence bar
  const confidence = analysis.confidence_score || 0;
  confidenceBar.style.width = confidence + '%';
  confidenceText.textContent = confidence + '%';

  resultsSection.style.display = 'block';
}

function resetAnalysis() {
  document.getElementById('symptomsInput').value = '';
  document.getElementById('resultsSection').style.display = 'none';
  voiceRecorder = new VoiceRecorder();
}

function goToBookAppointment() {
  window.location.href = 'appointments.html';
}

function loadAnalysisHistory() {
  API.symptoms.getHistory()
    .then(response => {
      if (response.success) {
        displayHistory(response.history);
      }
    })
    .catch(error => console.error('Error loading history:', error));
}

function displayHistory(history) {
  const historyList = document.getElementById('historyList');

  if (history.length === 0) {
    historyList.innerHTML = '<p class="empty-state">No analysis history</p>';
    return;
  }

  historyList.innerHTML = history.map(item => createAnalysisCard(item)).join('');
}