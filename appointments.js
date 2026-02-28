const express = require('express');
const db = require('../models/db');
const { verifyToken, verifyDoctor } = require('../middleware/auth');

const router = express.Router();

// Get all doctors
router.get('/doctors', verifyToken, (req, res) => {
  db.all(
    `SELECT id, full_name, specialization, phone FROM users WHERE user_type = 'doctor'`,
    (err, rows) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Error fetching doctors' });
      }

      res.json({
        success: true,
        doctors: rows || []
      });
    }
  );
});

// Get doctors by specialization
router.get('/doctors/:specialization', verifyToken, (req, res) => {
  const { specialization } = req.params;

  db.all(
    `SELECT id, full_name, specialization, phone FROM users 
     WHERE user_type = 'doctor' AND specialization LIKE ?`,
    [`%${specialization}%`],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Error fetching doctors' });
      }

      res.json({
        success: true,
        doctors: rows || []
      });
    }
  );
});

// Book appointment
router.post('/book', verifyToken, (req, res) => {
  const { doctorId, appointmentDate, appointmentTime, reasonForVisit } = req.body;
  const patientId = req.userId;

  if (!doctorId || !appointmentDate || !appointmentTime) {
    return res.status(400).json({ 
      success: false, 
      message: 'Doctor, date, and time are required' 
    });
  }

  // Check for double booking
  db.get(
    `SELECT id FROM appointments 
     WHERE doctor_id = ? AND appointment_date = ? AND appointment_time = ? AND status != 'cancelled'`,
    [doctorId, appointmentDate, appointmentTime],
    (err, row) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Database error' });
      }

      if (row) {
        return res.status(400).json({ 
          success: false, 
          message: 'This time slot is already booked' 
        });
      }

      // Book appointment
      db.run(
        `INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time, reason_for_visit, status)
         VALUES (?, ?, ?, ?, ?, 'pending')`,
        [patientId, doctorId, appointmentDate, appointmentTime, reasonForVisit],
        function(err) {
          if (err) {
            return res.status(500).json({ success: false, message: 'Error booking appointment' });
          }

          // Create notification for doctor
          db.run(
            `INSERT INTO notifications (user_id, title, message, type)
             VALUES (?, 'New Appointment Request', 'A new appointment has been requested', 'appointment')`,
            [doctorId]
          );

          res.status(201).json({
            success: true,
            message: 'Appointment booked successfully',
            appointmentId: this.lastID
          });
        }
      );
    }
  );
});

// Get patient appointments
router.get('/my-appointments', verifyToken, (req, res) => {
  const patientId = req.userId;

  db.all(
    `SELECT a.id, a.appointment_date, a.appointment_time, a.reason_for_visit, a.status, a.notes,
            u.full_name AS doctor_name, u.specialization, u.phone
     FROM appointments a
     JOIN users u ON a.doctor_id = u.id
     WHERE a.patient_id = ?
     ORDER BY a.appointment_date DESC`,
    [patientId],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Error fetching appointments' });
      }

      res.json({
        success: true,
        appointments: rows || []
      });
    }
  );
});

// Get doctor appointments
router.get('/doctor-appointments', verifyDoctor, (req, res) => {
  const doctorId = req.userId;

  db.all(
    `SELECT a.id, a.appointment_date, a.appointment_time, a.reason_for_visit, a.status, a.notes,
            u.full_name AS patient_name, u.phone, u.email
     FROM appointments a
     JOIN users u ON a.patient_id = u.id
     WHERE a.doctor_id = ?
     ORDER BY a.appointment_date DESC`,
    [doctorId],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Error fetching appointments' });
      }

      res.json({
        success: true,
        appointments: rows || []
      });
    }
  );
});

// Update appointment status (doctor)
router.patch('/update-status/:appointmentId', verifyDoctor, (req, res) => {
  const { appointmentId } = req.params;
  const { status, notes } = req.body;
  const doctorId = req.userId;

  db.run(
    `UPDATE appointments 
     SET status = ?, notes = ?
     WHERE id = ? AND doctor_id = ?`,
    [status, notes, appointmentId, doctorId],
    (err) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Error updating appointment' });
      }

      res.json({
        success: true,
        message: 'Appointment status updated'
      });
    }
  );
});

// Add prescription
router.post('/prescription', verifyDoctor, (req, res) => {
  const { appointmentId, medicationName, dosage, frequency, duration, instructions } = req.body;
  const doctorId = req.userId;

  if (!appointmentId || !medicationName || !dosage) {
    return res.status(400).json({ 
      success: false, 
      message: 'Required fields are missing' 
    });
  }

  db.run(
    `INSERT INTO prescriptions (appointment_id, doctor_id, medication_name, dosage, frequency, duration, instructions)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [appointmentId, doctorId, medicationName, dosage, frequency, duration, instructions],
    function(err) {
      if (err) {
        return res.status(500).json({ success: false, message: 'Error adding prescription' });
      }

      res.json({
        success: true,
        message: 'Prescription added successfully',
        prescriptionId: this.lastID
      });
    }
  );
});

// Get prescriptions
router.get('/prescriptions', verifyToken, (req, res) => {
  const userId = req.userId;

  db.all(
    `SELECT p.*, u.full_name AS doctor_name
     FROM prescriptions p
     JOIN appointments a ON p.appointment_id = a.id
     JOIN users u ON p.doctor_id = u.id
     WHERE a.patient_id = ?
     ORDER BY p.created_at DESC`,
    [userId],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Error fetching prescriptions' });
      }

      res.json({
        success: true,
        prescriptions: rows || []
      });
    }
  );
});

module.exports = router;