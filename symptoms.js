const express = require('express');
const db = require('../models/db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Symptom analysis results database
const illnessDatabase = {
  'fever, cough, cold': {
    illness: 'Common Cold/Flu',
    description: 'A viral infection affecting the upper respiratory tract',
    severity: 'Mild to Moderate',
    recommendations: 'Rest, stay hydrated, take paracetamol, avoid close contact with others'
  },
  'chest pain, shortness of breath': {
    illness: 'Possible Cardiac Issue',
    description: 'Potential heart-related condition',
    severity: 'High - Seek immediate medical attention',
    recommendations: 'EMERGENCY: Call ambulance immediately, seek immediate medical care'
  },
  'headache, dizziness': {
    illness: 'Migraine/Tension Headache',
    description: 'Common headache disorder',
    severity: 'Mild to Moderate',
    recommendations: 'Rest in dark room, take pain relievers, stay hydrated'
  },
  'stomach pain, nausea': {
    illness: 'Gastroenteritis/Indigestion',
    description: 'Stomach inflammation or digestive issue',
    severity: 'Mild to Moderate',
    recommendations: 'Light diet, stay hydrated, avoid spicy food, consider antacids'
  },
  'sore throat, fever': {
    illness: 'Pharyngitis/Strep Throat',
    description: 'Throat infection',
    severity: 'Mild to Moderate',
    recommendations: 'Gargle salt water, use throat lozenges, take antibiotics if prescribed'
  },
  'skin rash, itching': {
    illness: 'Dermatitis/Allergy',
    description: 'Skin inflammation or allergic reaction',
    severity: 'Mild',
    recommendations: 'Apply moisturizer, avoid triggers, use antihistamines'
  },
  'joint pain, swelling': {
    illness: 'Arthritis/Joint Inflammation',
    description: 'Joint pain and inflammation',
    severity: 'Mild to Moderate',
    recommendations: 'Rest, ice therapy, pain relievers, physical therapy'
  },
  'persistent cough': {
    illness: 'Bronchitis/Asthma',
    description: 'Lung inflammation',
    severity: 'Moderate',
    recommendations: 'Cough suppressants, bronchodilators, avoid allergens'
  }
};

// Analyze symptoms
router.post('/analyze', verifyToken, (req, res) => {
  const { symptoms, analysisType = 'text' } = req.body;
  const userId = req.userId;

  if (!symptoms) {
    return res.status(400).json({ success: false, message: 'Symptoms are required' });
  }

  // Simple symptom matching algorithm
  let analysis = {
    illness: 'Unknown Condition',
    description: 'Unable to determine condition from provided symptoms',
    severity: 'Please consult a doctor',
    recommendations: 'Consult with a healthcare professional for accurate diagnosis',
    confidence_score: 0
  };

  const symptomsLower = symptoms.toLowerCase();

  // Try to find matching illness
  for (const [key, value] of Object.entries(illnessDatabase)) {
    const keywords = key.split(',').map(k => k.trim());
    let matches = 0;

    keywords.forEach(keyword => {
      if (symptomsLower.includes(keyword)) {
        matches++;
      }
    });

    if (matches > 0) {
      const confidence = (matches / keywords.length) * 100;
      if (confidence > analysis.confidence_score) {
        analysis = { ...value, confidence_score: Math.round(confidence) };
      }
    }
  }

  // Save to database
  db.run(
    `INSERT INTO symptom_analysis (user_id, symptoms, analysis_result, confidence_score, analysis_type)
     VALUES (?, ?, ?, ?, ?)`,
    [userId, symptoms, JSON.stringify(analysis), analysis.confidence_score, analysisType],
    function(err) {
      if (err) {
        return res.status(500).json({ success: false, message: 'Error saving analysis' });
      }

      res.json({
        success: true,
        message: 'Symptom analysis completed',
        analysisId: this.lastID,
        analysis
      });
    }
  );
});

// Get symptom history
router.get('/history', verifyToken, (req, res) => {
  const userId = req.userId;

  db.all(
    `SELECT id, symptoms, analysis_result, confidence_score, analysis_type, created_at 
     FROM symptom_analysis 
     WHERE user_id = ? 
     ORDER BY created_at DESC 
     LIMIT 10`,
    [userId],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Error fetching history' });
      }

      const history = rows.map(row => ({
        ...row,
        analysis_result: JSON.parse(row.analysis_result)
      }));

      res.json({
        success: true,
        history
      });
    }
  );
});

module.exports = router;