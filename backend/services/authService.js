const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const userRepository = require('../repositories/userRepository');
const employeeRepository = require('../repositories/employeeRepository');
const db = require('../config/db');

class AuthService {
  constructor() {
    this.accessTokenSecret = process.env.JWT_ACCESS_SECRET || 'default_access_secret';
    this.refreshTokenSecret = process.env.JWT_REFRESH_SECRET || 'default_refresh_secret';
    this.accessTokenExpiry = process.env.JWT_ACCESS_EXPIRY || '15m';
    this.refreshTokenExpiry = process.env.JWT_REFRESH_EXPIRY || '7d';
  }

  generateTokens(user) {
    const payload = { id: user.id, email: user.email, role: user.role };
    const accessToken = jwt.sign(payload, this.accessTokenSecret, { expiresIn: this.accessTokenExpiry });
    const refreshToken = jwt.sign(payload, this.refreshTokenSecret, { expiresIn: this.refreshTokenExpiry });
    return { accessToken, refreshToken };
  }

  async registerUser({ email, password, role, departmentId, firstName, lastName, phone, salary, hireDate }) {
    const existing = await userRepository.findByEmail(email);
    if (existing) {
      throw new Error('Email is already registered.');
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Create User
      const userRes = await client.query(
        `INSERT INTO users (email, password_hash, role, department_id)
         VALUES ($1, $2, $3, $4)
         RETURNING id, email, role, department_id, is_active, created_at`,
        [email, passwordHash, role || 'Employee', departmentId]
      );
      const user = userRes.rows[0];

      // 2. Create Employee Profile
      await client.query(
        `INSERT INTO employee_profiles (user_id, first_name, last_name, phone, salary, hire_date)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [user.id, firstName, lastName, phone, salary || 0.00, hireDate || new Date()]
      );

      // 3. Populate default Leave Balances for new user
      const leaveTypesRes = await client.query('SELECT * FROM leave_types');
      for (const lt of leaveTypesRes.rows) {
        await client.query(
          `INSERT INTO leave_balance (user_id, leave_type_id, allocated_days)
           VALUES ($1, $2, $3)`,
          [user.id, lt.id, lt.days_allowed]
        );
      }

      await client.query('COMMIT');
      return user;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async loginUser(email, password) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new Error('Invalid email or password.');
    }
    if (!user.is_active) {
      throw new Error('This account has been deactivated.');
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      throw new Error('Invalid email or password.');
    }

    const tokens = this.generateTokens(user);
    const profile = await employeeRepository.getProfileByUserId(user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        departmentId: user.department_id,
        firstName: profile?.first_name || '',
        lastName: profile?.last_name || '',
        avatarUrl: profile?.avatar_url || '',
      },
      ...tokens,
    };
  }

  async verifyRefreshToken(token) {
    try {
      const decoded = jwt.verify(token, this.refreshTokenSecret);
      const user = await userRepository.findById(decoded.id);
      if (!user || !user.is_active) {
        throw new Error('User inactive or not found.');
      }
      return this.generateTokens(user);
    } catch (err) {
      throw new Error('Invalid or expired refresh token.');
    }
  }
}

module.exports = new AuthService();
