const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const { pool } = require('./db');

async function runSeed() {
  console.log('Starting Database Initialization and Seeding...');
  const client = await pool.connect();

  try {
    // 1. Read and run schema.sql
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    console.log('Executing Schema SQL...');
    await client.query(schemaSql);
    console.log('Schema execution completed successfully.');

    // Start seed transaction
    await client.query('BEGIN');

    // 2. Seed Departments
    console.log('Seeding Departments...');
    const deptResult = await client.query(`
      INSERT INTO departments (name, code) VALUES
      ('Engineering', 'ENG'),
      ('Human Resources', 'HR'),
      ('Operations', 'OPS'),
      ('Sales', 'SAL')
      RETURNING id, code
    `);
    const depts = deptResult.rows.reduce((acc, row) => {
      acc[row.code] = row.id;
      return acc;
    }, {});

    // 3. Seed Skills
    console.log('Seeding Skills...');
    const skillResult = await client.query(`
      INSERT INTO skills (name) VALUES
      ('JavaScript'), ('Node.js'), ('React'), ('SQL'), ('Project Management'), ('Communication')
      RETURNING id, name
    `);
    const skills = skillResult.rows;

    // 4. Seed Leave Types
    console.log('Seeding Leave Types...');
    const leaveTypesResult = await client.query(`
      INSERT INTO leave_types (name, days_allowed) VALUES
      ('Annual Leave', 20),
      ('Sick Leave', 10),
      ('Parental Leave', 40),
      ('Unpaid Leave', 90)
      RETURNING id, name, days_allowed
    `);
    const leaveTypes = leaveTypesResult.rows;

    // 5. Create Default Users (Admin, Manager, Employee)
    console.log('Seeding Users and Profiles...');
    const saltRounds = 10;
    const adminPasswordHash = await bcrypt.hash('admin123', saltRounds);
    const managerPasswordHash = await bcrypt.hash('manager123', saltRounds);
    const employeePasswordHash = await bcrypt.hash('employee123', saltRounds);

    // Set a session user ID for the audit trigger to track seed inserts
    // Let's create a temporary UUID for our "seed runner"
    await client.query("SET LOCAL app.current_user_id = ''");

    // Insert Admin
    const adminUserRes = await client.query(`
      INSERT INTO users (email, password_hash, role, department_id)
      VALUES ('admin@hrms.com', $1, 'Admin', $2)
      RETURNING id
    `, [adminPasswordHash, depts['HR']]);
    const adminId = adminUserRes.rows[0].id;

    await client.query(`
      INSERT INTO employee_profiles (user_id, first_name, last_name, phone, salary, hire_date)
      VALUES ($1, 'HR', 'Admin', '1234567890', 95000.00, '2024-01-01')
    `, [adminId]);

    // Insert Manager
    const managerUserRes = await client.query(`
      INSERT INTO users (email, password_hash, role, department_id)
      VALUES ('manager@hrms.com', $1, 'Manager', $2)
      RETURNING id
    `, [managerPasswordHash, depts['ENG']]);
    const managerId = managerUserRes.rows[0].id;

    await client.query(`
      INSERT INTO employee_profiles (user_id, first_name, last_name, phone, salary, hire_date)
      VALUES ($1, 'Sarah', 'Connor', '9876543210', 80000.00, '2024-02-15')
    `, [managerId]);

    // Insert Employee
    const employeeUserRes = await client.query(`
      INSERT INTO users (email, password_hash, role, department_id)
      VALUES ('employee@hrms.com', $1, 'Employee', $2)
      RETURNING id
    `, [employeePasswordHash, depts['ENG']]);
    const employeeId = employeeUserRes.rows[0].id;

    await client.query(`
      INSERT INTO employee_profiles (user_id, first_name, last_name, phone, salary, hire_date)
      VALUES ($1, 'John', 'Doe', '5551234567', 60000.00, '2024-03-01')
    `, [employeeId]);

    // 6. Initialize Leave Balances for all users
    console.log('Initializing Leave Balances...');
    const userIds = [adminId, managerId, employeeId];
    for (const userId of userIds) {
      for (const lt of leaveTypes) {
        await client.query(`
          INSERT INTO leave_balance (user_id, leave_type_id, allocated_days, used_days, pending_days)
          VALUES ($1, $2, $3, 0, 0)
        `, [userId, lt.id, lt.days_allowed]);
      }
    }

    // 7. Seed skills for users
    console.log('Assigning skills to employee...');
    // Give Employee Node.js and SQL
    await client.query(`
      INSERT INTO employee_skills (employee_id, skill_id) VALUES
      ($1, $2),
      ($1, $3)
    `, [employeeId, skills.find(s => s.name === 'Node.js').id, skills.find(s => s.name === 'SQL').id]);

    // Give Manager Project Management and Communication
    await client.query(`
      INSERT INTO employee_skills (employee_id, skill_id) VALUES
      ($1, $2),
      ($1, $3)
    `, [managerId, skills.find(s => s.name === 'Project Management').id, skills.find(s => s.name === 'Communication').id]);

    // 8. Seed some initial assets
    console.log('Seeding assets...');
    await client.query(`
      INSERT INTO assets (name, serial_number, type, status) VALUES
      ('MacBook Pro 16', 'SN-MBP16-2024', 'Laptop', 'Available'),
      ('Dell XPS 15', 'SN-XPS15-2023', 'Laptop', 'Available'),
      ('iPad Air', 'SN-IPADAIR-001', 'Tablet', 'Available'),
      ('ThinkPad X1 Carbon', 'SN-TPX1-2024', 'Laptop', 'Available')
    `);

    await client.query('COMMIT');
    console.log('Database Seeding completed successfully!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Database seeding failed:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  runSeed();
}

module.exports = runSeed;
