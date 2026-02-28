const express = require('express');
const db = require('../models/db');
const { verifyDoctor } = require('../middleware/auth');

const router = express.Router();

// Get doctor dashboard stats
router.get('/dashboard', verifyDoctor, (req, res) => {
  const doctorId = req.userId;

  // Get today's appointments
  db.all(
    `SELECT COUNT(*) as count FROM appointments 
     WHERE doctor_id = ? AND date(appointment_date) = date('now') AND status = 'confirmed'`,
    [doctorId],
    (err, todayAppointments) => {
      // Get total patients
      db.all(
        `SELECT COUNT(DISTINCT patient_id) as count FROM appointments WHERE doctor_id = ?`,
        [doctorId],
        (err, totalPatients) => {
          // Get pending requests
          db.all(
            `SELECT COUNT(*) as count FROM appointments WHERE doctor_id = ? AND status = 'pending'`,
            [doctorId],
            (err, pendingRequests) => {
              res.json({
                success: true,
                stats: {
                  todayAppointments: todayAppointments[0]?.count || 0,
                  totalPatients: totalPatients[0]?.count || 0,
                  pendingRequests: pendingRequests[0]?.count || 0
                }
              });
            }
          );
        }
      );
    }
  );
});

module.exports = router;