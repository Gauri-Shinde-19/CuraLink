// Doctor Appointments Management page script

let currentFilter = 'pending';
let currentEditingAppointmentId = null;

document.addEventListener('DOMContentLoaded', () => {
  if (!checkAuth()) return;

  if (localStorage.getItem('userType') !== 'doctor') {
    window.location.href = 'dashboard.html';
    return;
  }

  loadDoctorAppointments();
  setupTabButtons();
  setupModalHandlers();

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

function setupTabButtons() {
  const tabButtons = document.querySelectorAll('.tab-button');
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      button.classList.add('active');
      currentFilter = button.dataset.filter;
      loadDoctorAppointments();
    });
  });

  // Set first tab as active
  if (tabButtons.length > 0) {
    tabButtons[0].classList.add('active');
  }
}

function setupModalHandlers() {
  setupModalClosers('appointmentModal');
  setupModalClosers('prescriptionModal');

  const confirmBtn = document.getElementById('confirmBtn');
  const cancelBtn = document.getElementById('cancelBtn');
  const completeBtn = document.getElementById('completeBtn');
  const addPrescriptionBtn = document.getElementById('addPrescriptionBtn');

  if (confirmBtn) confirmBtn.addEventListener('click', confirmAppointment);
  if (cancelBtn) cancelBtn.addEventListener('click', cancelAppointment);
  if (completeBtn) completeBtn.addEventListener('click', completeAppointment);
  if (addPrescriptionBtn) addPrescriptionBtn.addEventListener('click', showPrescriptionModal);

  const prescriptionForm = document.getElementById('prescriptionForm');
  if (prescriptionForm) {
    prescriptionForm.addEventListener('submit', handleAddPrescription);
  }
}

function loadDoctorAppointments() {
  API.appointments.getDoctorAppointments()
    .then(response => {
      if (response.success) {
        const filtered = response.appointments.filter(apt => apt.status === currentFilter);
        displayAppointments(filtered);
      }
    })
    .catch(error => console.error('Error loading appointments:', error));
}

function displayAppointments(appointments) {
  const appointmentsList = document.getElementById('appointmentsList');

  if (appointments.length === 0) {
    appointmentsList.innerHTML = `<p class="empty-state">No ${currentFilter} appointments</p>`;
    return;
  }

  appointmentsList.innerHTML = appointments.map(apt => `
    <div class="appointment-item" onclick="openAppointmentModal(${apt.id}, '${apt.patient_name}', '${apt.appointment_date}', '${apt.appointment_time}', '${apt.reason_for_visit}', '${apt.status}', '${apt.phone}')">
      <div class="appointment-header">
        <div class="appointment-title">
          <h3>${apt.patient_name}</h3>
          <span class="status-badge ${getStatusClass(apt.status)}">${apt.status.toUpperCase()}</span>
        </div>
      </div>
      <div class="appointment-meta">
        <span>📅 ${formatDate(apt.appointment_date)}</span>
        <span>🕒 ${formatTime(apt.appointment_time)}</span>
        <span>📞 ${apt.phone}</span>
      </div>
      <p><strong>Reason:</strong> ${apt.reason_for_visit || 'Not specified'}</p>
    </div>
  `).join('');
}

function openAppointmentModal(appointmentId, patientName, date, time, reason, status, phone) {
  currentEditingAppointmentId = appointmentId;

  const modal = document.getElementById('appointmentModal');
  const modalContent = document.getElementById('modalContent');
  const confirmBtn = document.getElementById('confirmBtn');
  const completeBtn = document.getElementById('completeBtn');
  const addPrescriptionBtn = document.getElementById('addPrescriptionBtn');

  modalContent.innerHTML = `
    <div class="form-group">
      <label>Patient Name</label>
      <p>${patientName}</p>
    </div>
    <div class="form-group">
      <label>Phone</label>
      <p>${phone}</p>
    </div>
    <div class="form-group">
      <label>Date & Time</label>
      <p>${formatDate(date)} at ${formatTime(time)}</p>
    </div>
    <div class="form-group">
      <label>Reason for Visit</label>
      <p>${reason || 'Not specified'}</p>
    </div>
    <div class="form-group">
      <label>Notes</label>
      <textarea id="appointmentNotes" rows="4" placeholder="Add notes about the appointment..."></textarea>
    </div>
  `;

  // Show/hide buttons based on status
  confirmBtn.style.display = status === 'pending' ? 'block' : 'none';
  completeBtn.style.display = (status === 'confirmed' || status === 'pending') ? 'block' : 'none';
  addPrescriptionBtn.style.display = status !== 'completed' ? 'block' : 'none';

  modal.style.display = 'block';
}

function confirmAppointment() {
  const notes = document.getElementById('appointmentNotes').value;

  showLoading('Confirming appointment...');

  API.appointments.updateStatus(currentEditingAppointmentId, 'confirmed', notes)
    .then(response => {
      hideLoading();

      if (response.success) {
        showSuccess('Appointment confirmed!');
        closeModal('appointmentModal');
        loadDoctorAppointments();
      } else {
        showError('Failed to confirm appointment');
      }
    })
    .catch(error => {
      hideLoading();
      console.error('Error confirming appointment:', error);
      showError('An error occurred');
    });
}

function cancelAppointment() {
  if (!confirm('Are you sure you want to cancel this appointment?')) return;

  const notes = document.getElementById('appointmentNotes').value;

  showLoading('Cancelling appointment...');

  API.appointments.updateStatus(currentEditingAppointmentId, 'cancelled', notes)
    .then(response => {
      hideLoading();

      if (response.success) {
        showSuccess('Appointment cancelled!');
        closeModal('appointmentModal');
        loadDoctorAppointments();
      } else {
        showError('Failed to cancel appointment');
      }
    })
    .catch(error => {
      hideLoading();
      console.error('Error cancelling appointment:', error);
      showError('An error occurred');
    });
}

function completeAppointment() {
  const notes = document.getElementById('appointmentNotes').value;

  showLoading('Marking as complete...');

  API.appointments.updateStatus(currentEditingAppointmentId, 'completed', notes)
    .then(response => {
      hideLoading();

      if (response.success) {
        showSuccess('Appointment marked as complete!');
        closeModal('appointmentModal');
        loadDoctorAppointments();
      } else {
        showError('Failed to update appointment');
      }
    })
    .catch(error => {
      hideLoading();
      console.error('Error updating appointment:', error);
      showError('An error occurred');
    });
}

function showPrescriptionModal() {
  closeModal('appointmentModal');
  openModal('prescriptionModal');
}

function handleAddPrescription(e) {
  e.preventDefault();

  const medicationName = document.getElementById('medicationName').value;
  const dosage = document.getElementById('dosage').value;
  const frequency = document.getElementById('frequency').value;
  const duration = document.getElementById('duration').value;
  const instructions = document.getElementById('instructions').value;

  if (!medicationName || !dosage || !frequency || !duration) {
    showError('Please fill all required fields');
    return;
  }

  showLoading('Adding prescription...');

  API.appointments.addPrescription({
    appointmentId: currentEditingAppointmentId,
    medicationName,
    dosage,
    frequency,
    duration,
    instructions
  })
    .then(response => {
      hideLoading();

      if (response.success) {
        showSuccess('Prescription added successfully!');
        document.getElementById('prescriptionForm').reset();
        closeModal('prescriptionModal');
        loadDoctorAppointments();
      } else {
        showError('Failed to add prescription');
      }
    })
    .catch(error => {
      hideLoading();
      console.error('Error adding prescription:', error);
      showError('An error occurred');
    });
}