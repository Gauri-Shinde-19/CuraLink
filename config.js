module.exports = {
  jwt: {
    secret: process.env.JWT_SECRET || 'curalink_secret_key_2026',
    expiresIn: '7d'
  },
  database: {
    filename: './curalink.db'
  },
  bcrypt: {
    rounds: 10
  }
};