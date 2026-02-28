// Doctor Dashboard page script

document.addEventListener('DOMContentLoaded', () => {
  if (!checkAuth()) return;

  if (localStorage.getItem('userType') !== 'doctor') {
    window.location.href = 'dashboard.html';
    return;
  }

  loadDoctorDashboard();

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
});

function loadDoctorDashboard() {
  // Load doctor info
  API.auth.getCurrentUser()
    .then(response => {
      if (response.success) {
        document.getElementById('doctorName').textContent = response.user.full_name;
      }
    });

  // Load dashboard stats
  API.doctor.getDashboard()
    .then(response => {
      if (response.success) {
        const stats = response.stats;
        document.getElementById('totalPatients').textContent = stats.totalPatients;
        document.getElementById('todayAppointments').textContent = stats.todayAppointments;
        document.getElementById('pendingRequests').textContent = stats.pendingRequests;
      }
    })
    .catch(error => console.error('Error loading dashboard:', error));

  // Load today's appointments
  API.appointments.getDoctorAppointments()
    .then(response => {
      if (response.success) {
        const todayAppointments = response.appointments.filter(apt => {
          const aptDate = new Date(apt.appointment_date).toDateString();
          return aptDate === new Date().toDateString() && apt.status !== 'cancelled';
        });
        displayTodayAppointments(todayAppointments);
      }
    })
    .catch(error => console.error('Error loading appointments:', error));

  // Load home visit requests
  API.homeVisit.getRequests()
    .then(response => {
      if (response.success) {
        displayHomeVisitRequests(response.requests);
      }
    })
    .catch(error => console.error('Error loading home visit requests:', error));
}

function displayTodayAppointments(appointments) {
  const list = document.getElementById('todayAppointmentsList');

  if (appointments.length === 0) {
    list.innerHTML = '<p class="empty-state">No appointments today</p>';
    return;
  }

  list.innerHTML = appointments.map(apt => `
    <div class="appointment-item">
      <div class="appointment-header">
        <div class="appointment-title">
          <h3>${apt.patient_name}</h3>
          <span class="status-badge ${getStatusClass(apt.status)}">${apt.status.toUpperCase()}</span>
        </div>
      </div>
      <div class="appointment-meta">
        <span>🕒 ${formatTime(apt.appointment_time)}</span>
        <span>📞 ${apt.phone}</span>
      </div>
      <p><strong>Reason:</strong> ${apt.reason_for_visit || 'Not specified'}</p>
    </div>
  `).join('');
}

function displayHomeVisitRequests(requests) {
  const list = document.getElementById('homeVisitRequestsList');

  if (requests.length === 0) {
    list.innerHTML = '<p class="empty-state">No pending home visit requests</p>';
    return;
  }

  list.innerHTML = requests.map(request => `
    <div class="appointment-item">
      <div class="appointment-header">
        <div class="appointment-title">
          <h3>${request.patient_name}</h3>
          <span class="status-badge status-pending">PENDING</span>
        </div>
      </div>
      <div class="appointment-meta">
        <span>📍 ${request.address}</span>
        <span>📞 ${request.phone}</span>
      </div>
      <p><strong>Reason:</strong> ${request.reason}</p>
      <p><strong>Preferred:</strong> ${formatDate(request.preferred_date)} at ${formatTime(request.preferred_time)}</p>
    </div>
  `).join('');
}