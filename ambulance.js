const express = require('express');
const db = require('../models/db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Request ambulance
router.post('/request', verifyToken, (req, res) => {
  const { patientName, phone, location, latitude, longitude } = req.body;
  const userId = req.userId;

  if (!patientName || !phone || !location) {
    return res.status(400).json({ 
      success: false, 
      message: 'Patient name, phone, and location are required' 
    });
  }

  db.run(
    `INSERT INTO ambulance_requests (user_id, patient_name, phone, location, latitude, longitude, status)
     VALUES (?, ?, ?, ?, ?, ?, 'requested')`,
    [userId, patientName, phone, location, latitude, longitude],
    function(err) {
      if (err) {
        return res.status(500).json({ success: false, message: 'Error requesting ambulance' });
      }

      // Create notification
      db.run(
        `INSERT INTO notifications (user_id, title, message, type)
         VALUES (?, 'Ambulance Requested', 'Emergency ambulance has been requested', 'ambulance')`
      );

      res.status(201).json({
        success: true,
        message: 'Ambulance requested successfully',
        requestId: this.lastID,
        estimatedArrival: '10-15 minutes'
      });
    }
  );
});

// Get ambulance request details
router.get('/request/:requestId', verifyToken, (req, res) => {
  const { requestId } = req.params;

  db.get(
    `SELECT * FROM ambulance_requests WHERE id = ?`,
    [requestId],
    (err, row) => {
      if (err || !row) {
        return res.status(404).json({ success: false, message: 'Ambulance request not found' });
      }

      res.json({
        success: true,
        request: row
      });
    }
  );
});

// Update ambulance location (simulated)
router.patch('/update-location/:requestId', (req, res) => {
  const { requestId } = req.params;
  const { latitude, longitude, status } = req.body;

  db.run(
    `UPDATE ambulance_requests 
     SET latitude = ?, longitude = ?, status = ?
     WHERE id = ?`,
    [latitude, longitude, status, requestId],
    (err) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Error updating location' });
      }

      res.json({
        success: true,
        message: 'Location updated'
      });
    }
  );
});

module.exports = router;