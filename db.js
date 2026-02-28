const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const config = require('../config');

const dbPath = config.database.filename;
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('Connected to SQLite database');
  }
});

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON');

// Initialize database with schema
const initializeDatabase = () => {
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  const statements = schema.split(';').filter(stmt => stmt.trim());

  statements.forEach(statement => {
    if (statement.trim()) {
      db.run(statement + ';', (err) => {
        if (err) {
          console.error('Error creating table:', err);
        }
      });
    }
  });

  // Seed default doctors
  seedDefaultDoctors();
};

// Seed default doctors
const seedDefaultDoctors = () => {
  const bcrypt = require('bcryptjs');
  
  const doctors = [
    {
      email: 'dr.sharma@curalink.com',
      password: 'doctor123',
      full_name: 'Dr. Rajesh Sharma',
      phone: '9876543210',
      specialization: 'General Practitioner',
      license_number: 'DL001'
    },
    {
      email: 'dr.patel@curalink.com',
      password: 'doctor123',
      full_name: 'Dr. Priya Patel',
      phone: '9876543211',
      specialization: 'Cardiologist',
      license_number: 'DL002'
    },
    {
      email: 'dr.gupta@curalink.com',
      password: 'doctor123',
      full_name: 'Dr. Amit Gupta',
      phone: '9876543212',
      specialization: 'Dermatologist',
      license_number: 'DL003'
    },
    {
      email: 'dr.singh@curalink.com',
      password: 'doctor123',
      full_name: 'Dr. Amandeep Singh',
      phone: '9876543213',
      specialization: 'Orthopedist',
      license_number: 'DL004'
    },
    {
      email: 'dr.kumar@curalink.com',
      password: 'doctor123',
      full_name: 'Dr. Vikram Kumar',
      phone: '9876543214',
      specialization: 'Neurologist',
      license_number: 'DL005'
    }
  ];

  doctors.forEach(doctor => {
    db.get('SELECT id FROM users WHERE email = ?', [doctor.email], (err, row) => {
      if (!row) {
        const hashedPassword = bcrypt.hashSync(doctor.password, 10);
        db.run(
          `INSERT INTO users (email, password, full_name, phone, user_type, specialization, license_number)
           VALUES (?, ?, ?, ?, 'doctor', ?, ?)`,
          [doctor.email, hashedPassword, doctor.full_name, doctor.phone, doctor.specialization, doctor.license_number],
          (err) => {
            if (err) {
              console.error('Error seeding doctor:', err);
            } else {
              console.log(`Doctor ${doctor.full_name} seeded successfully`);
            }
          }
        );
      }
    });
  });
};

// Helper function to run database queries
db.run = function(sql, params, callback) {
  return sqlite3.Database.prototype.run.call(this, sql, params, callback);
};

db.get = function(sql, params, callback) {
  return sqlite3.Database.prototype.get.call(this, sql, params, callback);
};

db.all = function(sql, params, callback) {
  return sqlite3.Database.prototype.all.call(this, sql, params, callback);
};

db.initializeDatabase = initializeDatabase;

module.exports = db;