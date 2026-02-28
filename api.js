// API Configuration and Helper Functions

const API_BASE_URL = 'http://localhost:5000/api';

// Store token in localStorage
const API = {
  setToken: (token) => {
    localStorage.setItem('authToken', token);
  },

  getToken: () => {
    return localStorage.getItem('authToken');
  },

  removeToken: () => {
    localStorage.removeItem('authToken');
  },

  getAuthHeader: () => {
    const token = API.getToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    };
  },

  // Auth Endpoints
  auth: {
    register: (data) => {
      return fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).then(r => r.json());
    },

    login: (email, password) => {
      return fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      }).then(r => r.json());
    },

    getCurrentUser: () => {
      return fetch(`${API_BASE_URL}/auth/me`, {
        headers: API.getAuthHeader()
      }).then(r => r.json());
    }
  },

  // Symptoms Endpoints
  symptoms: {
    analyze: (symptoms, analysisType = 'text') => {
      return fetch(`${API_BASE_URL}/symptoms/analyze`, {
        method: 'POST',
        headers: API.getAuthHeader(),
        body: JSON.stringify({ symptoms, analysisType })
      }).then(r => r.json());
    },

    getHistory: () => {
      return fetch(`${API_BASE_URL}/symptoms/history`, {
        headers: API.getAuthHeader()
      }).then(r => r.json());
    }
  },

  // Appointments Endpoints
  appointments: {
    getDoctors: () => {
      return fetch(`${API_BASE_URL}/appointments/doctors`, {
        headers: API.getAuthHeader()
      }).then(r => r.json());
    },

    getDoctorsBySpecialization: (specialization) => {
      return fetch(`${API_BASE_URL}/appointments/doctors/${specialization}`, {
        headers: API.getAuthHeader()
      }).then(r => r.json());
    },

    book: (data) => {
      return fetch(`${API_BASE_URL}/appointments/book`, {
        method: 'POST',
        headers: API.getAuthHeader(),
        body: JSON.stringify(data)
      }).then(r => r.json());
    },

    getMyAppointments: () => {
      return fetch(`${API_BASE_URL}/appointments/my-appointments`, {
        headers: API.getAuthHeader()
      }).then(r => r.json());
    },

    getDoctorAppointments: () => {
      return fetch(`${API_BASE_URL}/appointments/doctor-appointments`, {
        headers: API.getAuthHeader()
      }).then(r => r.json());
    },

    updateStatus: (appointmentId, status, notes = '') => {
      return fetch(`${API_BASE_URL}/appointments/update-status/${appointmentId}`, {
        method: 'PATCH',
        headers: API.getAuthHeader(),
        body: JSON.stringify({ status, notes })
      }).then(r => r.json());
    },

    getPrescriptions: () => {
      return fetch(`${API_BASE_URL}/appointments/prescriptions`, {
        headers: API.getAuthHeader()
      }).then(r => r.json());
    },

    addPrescription: (data) => {
      return fetch(`${API_BASE_URL}/appointments/prescription`, {
        method: 'POST',
        headers: API.getAuthHeader(),
        body: JSON.stringify(data)
      }).then(r => r.json());
    }
  },

  // Ambulance Endpoints
  ambulance: {
    request: (data) => {
      return fetch(`${API_BASE_URL}/ambulance/request`, {
        method: 'POST',
        headers: API.getAuthHeader(),
        body: JSON.stringify(data)
      }).then(r => r.json());
    },

    getRequest: (requestId) => {
      return fetch(`${API_BASE_URL}/ambulance/request/${requestId}`, {
        headers: API.getAuthHeader()
      }).then(r => r.json());
    },

    updateLocation: (requestId, data) => {
      return fetch(`${API_BASE_URL}/ambulance/update-location/${requestId}`, {
        method: 'PATCH',
        headers: API.getAuthHeader(),
        body: JSON.stringify(data)
      }).then(r => r.json());
    }
  },

  // Home Visit Endpoints
  homeVisit: {
    request: (data) => {
      return fetch(`${API_BASE_URL}/home-visit/request`, {
        method: 'POST',
        headers: API.getAuthHeader(),
        body: JSON.stringify(data)
      }).then(r => r.json());
    },

    getRequests: () => {
      return fetch(`${API_BASE_URL}/home-visit/requests`, {
        headers: API.getAuthHeader()
      }).then(r => r.json());
    },

    getMyRequests: () => {
      return fetch(`${API_BASE_URL}/home-visit/my-requests`, {
        headers: API.getAuthHeader()
      }).then(r => r.json());
    },

    accept: (requestId) => {
      return fetch(`${API_BASE_URL}/home-visit/accept/${requestId}`, {
        method: 'PATCH',
        headers: API.getAuthHeader()
      }).then(r => r.json());
    }
  },

  // Doctor Endpoints
  doctor: {
    getDashboard: () => {
      return fetch(`${API_BASE_URL}/doctor/dashboard`, {
        headers: API.getAuthHeader()
      }).then(r => r.json());
    }
  }
};