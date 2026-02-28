// Utility Functions

function showError(message) {
  const errorDiv = document.getElementById('errorMessage');
  if (errorDiv) {
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    setTimeout(() => {
      errorDiv.style.display = 'none';
    }, 5000);
  } else {
    alert(message);
  }
}

function showSuccess(message) {
  const successDiv = document.getElementById('successMessage');
  if (successDiv) {
    successDiv.textContent = message;
    successDiv.style.display = 'block';
    setTimeout(() => {
      successDiv.style.display = 'none';
    }, 5000);
  } else {
    alert(message);
  }
}

function showLoading(message = 'Loading...') {
  // You can create a loading indicator here
  console.log(message);
}

function hideLoading() {
  // Hide loading indicator
  console.log('Loading complete');
}

function formatDate(dateString) {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
}

function formatTime(timeString) {
  return new Date(`2000-01-01 ${timeString}`).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });
}

function getStatusColor(status) {
  const colors = {
    'pending': '#ffc107',
    'confirmed': '#28a745',
    'completed': '#17a2b8',
    'cancelled': '#dc3545'
  };
  return colors[status] || '#6c757d';
}

function getStatusClass(status) {
  return `status-${status}`;
}

function createAppointmentCard(appointment) {
  const statusClass = getStatusClass(appointment.status);
  
  return `
    <div class="appointment-item">
      <div class="appointment-header">
        <div class="appointment-title">
          <h3>${appointment.doctor_name || 'Doctor'}</h3>
          <span class="status-badge ${statusClass}">${appointment.status.toUpperCase()}</span>
        </div>
      </div>
      <div class="appointment-meta">
        <span>📅 ${formatDate(appointment.appointment_date)}</span>
        <span>🕒 ${formatTime(appointment.appointment_time)}</span>
        <span>🏥 ${appointment.specialization || 'General'}</span>
      </div>
      <p>${appointment.reason_for_visit || 'No reason provided'}</p>
      ${appointment.notes ? `<p><strong>Notes:</strong> ${appointment.notes}</p>` : ''}
    </div>
  `;
}

function createAnalysisCard(analysis) {
  const result = typeof analysis.analysis_result === 'string' 
    ? JSON.parse(analysis.analysis_result) 
    : analysis.analysis_result;

  return `
    <div class="analysis-item">
      <div class="history-item-header">
        <div>
          <div class="history-item-illness">${result.illness}</div>
          <div class="history-item-symptoms">Symptoms: ${analysis.symptoms}</div>
          <div class="history-item-date">${formatDate(analysis.created_at)}</div>
        </div>
        <span class="history-item-score">Score: ${result.confidence_score}%</span>
      </div>
    </div>
  `;
}

function getCurrentUserType() {
  return localStorage.getItem('userType') || 'patient';
}

function getUserId() {
  return localStorage.getItem('userId');
}

// Geolocation helper
function getCurrentLocation() {
  return new Promise((resolve, reject) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          reject(error);
        }
      );
    } else {
      reject(new Error('Geolocation is not supported'));
    }
  });
}

// Voice recording helper
class VoiceRecorder {
  constructor() {
    this.mediaRecorder = null;
    this.chunks = [];
    this.isRecording = false;
  }

  async start() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream);
      this.chunks = [];

      this.mediaRecorder.ondataavailable = (e) => {
        this.chunks.push(e.data);
      };

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.chunks, { type: 'audio/wav' });
        const url = URL.createObjectURL(blob);
        this.audioBlob = blob;
        this.audioUrl = url;
      };

      this.mediaRecorder.start();
      this.isRecording = true;
      return true;
    } catch (error) {
      console.error('Error accessing microphone:', error);
      return false;
    }
  }

  stop() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.isRecording = false;
      this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
      return true;
    }
    return false;
  }

  getAudioUrl() {
    return this.audioUrl;
  }

  getAudioBlob() {
    return this.audioBlob;
  }
}

// Modal helpers
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'block';
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'none';
  }
}

function setupModalClosers(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;

  const closeBtn = modal.querySelector('.close-modal');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => closeModal(modalId));
  }

  window.addEventListener('click', (event) => {
    if (event.target === modal) {
      closeModal(modalId);
    }
  });
}

// Token expiration checker
function checkTokenExpiration() {
  // This is a simple check - in production, use JWT decode library
  if (!API.getToken()) {
    window.location.href = 'login.html';
  }
}

setInterval(checkTokenExpiration, 5 * 60 * 1000); // Check every 5 minutes