const express = require('express');
const db = require('../models/db');
const { verifyToken, verifyDoctor } = require('../middleware/auth');

const router = express.Router();

// Request home visit
router.post('/request', verifyToken, (req, res) => {
  const { patientName, phone, address, reason, preferredDate, preferredTime, latitude, longitude } = req.body;
  const patientId = req.userId;

  if (!patientName || !phone || !address || !reason) {
    return res.status(400).json({ 
      success: false, 
      message: 'All fields are required' 
    });
  }

  db.run(
    `INSERT INTO home_visit_requests (patient_id, patient_name, phone, address, reason, preferred_date, preferred_time, latitude, longitude, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
    [patientId, patientName, phone, address, reason, preferredDate, preferredTime, latitude, longitude],
    function(err) {
      if (err) {
        return res.status(500).json({ success: false, message: 'Error requesting home visit' });
      }

      res.status(201).json({
        success: true,
        message: 'Home visit request submitted',
        requestId: this.lastID
      });
    }
  );
});

// Get home visit requests (doctor)
router.get('/requests', verifyDoctor, (req, res) => {
  const doctorId = req.userId;

  db.all(
    `SELECT * FROM home_visit_requests 
     WHERE status = 'pending'
     ORDER BY created_at DESC`,
    (err, rows) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Error fetching requests' });
      }

      res.json({
        success: true,
        requests: rows || []
      });
    }
  );
});

// Accept home visit request
router.patch('/accept/:requestId', verifyDoctor, (req, res) => {
  const { requestId } = req.params;
  const doctorId = req.userId;

  db.run(
    `UPDATE home_visit_requests 
     SET status = 'accepted', doctor_id = ?
     WHERE id = ?`,
    [doctorId, requestId],
    (err) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Error accepting request' });
      }

      res.json({
        success: true,
        message: 'Home visit request accepted'
      });
    }
  );
});

// Get user's home visit requests
router.get('/my-requests', verifyToken, (req, res) => {
  const patientId = req.userId;

  db.all(
    `SELECT hvr.*, u.full_name AS doctor_name 
     FROM home_visit_requests hvr
     LEFT JOIN users u ON hvr.doctor_id = u.id
     WHERE hvr.patient_id = ?
     ORDER BY hvr.created_at DESC`,
    [patientId],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Error fetching requests' });
      }

      res.json({
        success: true,
        requests: rows || []
      });
    }
  );
});

module.exports = router;