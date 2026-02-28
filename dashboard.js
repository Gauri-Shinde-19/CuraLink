// Dashboard page script

document.addEventListener('DOMContentLoaded', () => {
  if (!checkAuth()) return;

  loadDashboard();
  setupLogout();
});

function setupLogout() {
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      API.removeToken();
      localStorage.removeItem('userType');
      window.location.href = 'index.html';
    });
  }
}

function loadDashboard() {
  // Load user data
  API.auth.getCurrentUser()
    .then(response => {
      if (response.success) {
        const user = response.user;
        document.getElementById('welcomeMessage').textContent = `Welcome, ${user.full_name}!`;
        document.getElementById('userName').textContent = user.full_name;
        localStorage.setItem('userId', user.id);
      }
    });

  // Load appointments
  API.appointments.getMyAppointments()
    .then(response => {
      if (response.success) {
        displayAppointments(response.appointments);
        document.getElementById('upcomingCount').textContent = response.appointments.filter(
          a => a.status === 'confirmed' || a.status === 'pending'
        ).length;
      }
    })
    .catch(error => console.error('Error loading appointments:', error));

  // Load symptom analysis history
  API.symptoms.getHistory()
    .then(response => {
      if (response.success) {
        displayAnalysis(response.history);
        document.getElementById('analysisCount').textContent = response.history.length;
      }
    })
    .catch(error => console.error('Error loading analysis:', error));

  // Load prescriptions
  API.appointments.getPrescriptions()
    .then(response => {
      if (response.success) {
        document.getElementById('prescriptionCount').textContent = response.prescriptions.length;
      }
    })
    .catch(error => console.error('Error loading prescriptions:', error));
}

function displayAppointments(appointments) {
  const appointmentsList = document.getElementById('appointmentsList');
  
  if (appointments.length === 0) {
    appointmentsList.innerHTML = '<p class="empty-state">No upcoming appointments</p>';
    return;
  }

  appointmentsList.innerHTML = appointments
    .slice(0, 3) // Show only latest 3
    .map(apt => createAppointmentCard(apt))
    .join('');
}

function displayAnalysis(analyses) {
  const analysisList = document.getElementById('analysisList');
  
  if (analyses.length === 0) {
    analysisList.innerHTML = '<p class="empty-state">No analysis history</p>';
    return;
  }

  analysisList.innerHTML = analyses
    .slice(0, 3) // Show only latest 3
    .map(analysis => createAnalysisCard(analysis))
    .join('');
}