const NodeCache = require('node-cache');
const employeeRepository = require('../repositories/employeeRepository');
const userRepository = require('../repositories/userRepository');
const db = require('../config/db');

// Cache static data like departments for 1 hour (3600 seconds)
const myCache = new NodeCache({ stdTTL: 3600, checkperiod: 120 });

class EmployeeService {
  async getEmployeeDirectory(filters) {
    return employeeRepository.getDirectory(filters);
  }

  async getEmployeeProfile(userId) {
    const profile = await employeeRepository.getProfileByUserId(userId);
    if (!profile) {
      throw new Error('Employee profile not found.');
    }
    return profile;
  }

  async updateEmployeeProfile(userId, profileData, updaterId = null) {
    const updatedProfile = await employeeRepository.updateProfile(userId, profileData, updaterId);
    if (!updatedProfile) {
      throw new Error('Employee profile not found or could not be updated.');
    }

    if (profileData.skills) {
      await employeeRepository.updateSkills(userId, profileData.skills, updaterId);
    }

    return this.getEmployeeProfile(userId);
  }

  async getDepartments() {
    const cacheKey = 'departments_list';
    let departments = myCache.get(cacheKey);

    if (!departments) {
      console.log('Cache miss for departments. Querying database...');
      const res = await db.query('SELECT * FROM departments ORDER BY name ASC');
      departments = res.rows;
      myCache.set(cacheKey, departments);
    } else {
      console.log('Cache hit for departments.');
    }

    return departments;
  }

  async createDepartment(name, code, creatorId = null) {
    const res = await db.query(
      `INSERT INTO departments (name, code) VALUES ($1, $2) RETURNING *`,
      [name, code]
    );
    // Invalidate departments cache
    myCache.del('departments_list');
    return res.rows[0];
  }

  async getSkills() {
    const res = await db.query('SELECT * FROM skills ORDER BY name ASC');
    return res.rows;
  }

  async toggleEmployeeStatus(employeeId, isActive, updaterId = null) {
    const user = await userRepository.updateStatus(employeeId, isActive, updaterId);
    if (!user) {
      throw new Error('User not found.');
    }
    return user;
  }
}

module.exports = new EmployeeService();
