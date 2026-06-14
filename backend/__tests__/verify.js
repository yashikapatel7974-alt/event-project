const db = require('../config/db');
const authService = require('../services/authService');
const leaveService = require('../services/leaveService');
const assetService = require('../services/assetService');
const employeeService = require('../services/employeeService');

async function runVerification() {
  console.log('\n=======================================');
  console.log('🚀 ENTERPRISE HRMS INTEGRATION TESTING');
  console.log('=======================================\n');

  try {
    // 1. Check DB Connection
    console.log('1. Checking Database Connection pool...');
    const dbTest = await db.query('SELECT NOW()');
    console.log(`✅ Database connected: ${dbTest.rows[0].now}`);

    // 2. Check Database Schema Tables
    console.log('\n2. Verifying Table Schemas...');
    const tablesRes = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    const tablesList = tablesRes.rows.map(t => t.table_name);
    console.log(`Detected tables: ${tablesList.join(', ')}`);
    
    const requiredTables = ['users', 'employee_profiles', 'departments', 'leave_types', 'leave_balance', 'leave_applications', 'audit_logs'];
    const missing = requiredTables.filter(t => !tablesList.includes(t));
    if (missing.length > 0) {
      throw new Error(`Missing database tables: ${missing.join(', ')}`);
    }
    console.log('✅ All required tables verified.');

    // 3. Verify Seeded User Login
    console.log('\n3. Testing Seeding and Authentication (AuthService.login)...');
    const authResult = await authService.loginUser('admin@hrms.com', 'admin123');
    console.log(`✅ Login successful for admin@hrms.com`);
    console.log(`   Assigned JWT Role: ${authResult.user.role}`);
    console.log(`   Access Token preview: ${authResult.accessToken.substring(0, 30)}...`);

    // 4. Test User Registration workflow
    console.log('\n4. Testing Employee Creation and Profile Registration...');
    const randomSuffix = Math.floor(Math.random() * 1000);
    const email = `test_engineer_${randomSuffix}@company.com`;
    
    // Get Engineering department ID
    const depts = await employeeService.getDepartments();
    const engDept = depts.find(d => d.code === 'ENG');
    if (!engDept) throw new Error('Engineering department seed not found.');

    const newEmp = await authService.registerUser({
      email,
      password: 'employee123',
      role: 'Employee',
      departmentId: engDept.id,
      firstName: 'Integration',
      lastName: `Tester ${randomSuffix}`,
      phone: '555-0192',
      salary: 75000.00,
    });
    console.log(`✅ Created test user: ${newEmp.email} (ID: ${newEmp.id})`);

    // 5. Test Transactional Leave Request
    console.log('\n5. Testing Transactional Leave Application & Balance deductions...');
    const balancesBefore = await leaveService.getLeaveBalances(newEmp.id);
    const annualBalance = balancesBefore.find(b => b.leave_type_name === 'Annual Leave');
    if (!annualBalance) throw new Error('Annual Leave balance not initialized.');
    
    console.log(`   Allocated Annual Days: ${annualBalance.allocated_days}`);
    console.log(`   Used Annual Days: ${annualBalance.used_days}`);
    console.log(`   Pending Annual Days: ${annualBalance.pending_days}`);

    // Apply for 3 days of annual leave
    console.log('   Applying for 3 days of Annual Leave...');
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    const threeDaysLater = new Date();
    threeDaysLater.setDate(today.getDate() + 3);

    const leaveApp = await leaveService.applyLeave(newEmp.id, {
      leaveTypeId: annualBalance.leave_type_id,
      startDate: tomorrow.toISOString().split('T')[0],
      endDate: threeDaysLater.toISOString().split('T')[0],
      reason: 'Automated integration test workflow validation.',
    });
    console.log(`✅ Leave application created: status ${leaveApp.status} (ID: ${leaveApp.id})`);

    // Verify balance updated pending days
    const balancesMiddle = await leaveService.getLeaveBalances(newEmp.id);
    const annualBalanceMiddle = balancesMiddle.find(b => b.leave_type_name === 'Annual Leave');
    console.log(`   Pending days updated to: ${annualBalanceMiddle.pending_days} (expected: 3)`);
    if (annualBalanceMiddle.pending_days !== 3) {
      throw new Error('Leave balance pending days deduction failed.');
    }

    // 6. Test Transactional Leave Approval Workflow
    console.log('\n6. Testing Leave Processing (Approval) by Admin...');
    const adminUser = await authService.loginUser('admin@hrms.com', 'admin123');
    await leaveService.processLeaveApplication(leaveApp.id, adminUser.user.id, {
      action: 'Approved',
      comments: 'Integration test automated approval confirmation.',
    });
    console.log('✅ Leave request approved successfully.');

    // Verify final balances (pending should decrease, used should increase)
    const balancesAfter = await leaveService.getLeaveBalances(newEmp.id);
    const annualBalanceAfter = balancesAfter.find(b => b.leave_type_name === 'Annual Leave');
    console.log(`   Final used days: ${annualBalanceAfter.used_days} (expected: 3)`);
    console.log(`   Final pending days: ${annualBalanceAfter.pending_days} (expected: 0)`);
    if (annualBalanceAfter.used_days !== 3 || annualBalanceAfter.pending_days !== 0) {
      throw new Error('Leave balance final used/pending days transition failed.');
    }

    // 7. Test Audit Trail logging
    console.log('\n7. Verifying PostgreSQL Audit Trail logs (JSONB old_data/new_data)...');
    const auditRes = await db.query(
      `SELECT * FROM audit_logs 
       WHERE table_name = 'leave_applications' AND row_id = $1 
       ORDER BY changed_at DESC`,
      [leaveApp.id]
    );
    console.log(`✅ Found ${auditRes.rows.length} audit trail logs for leave_applications row.`);
    auditRes.rows.forEach((log, index) => {
      console.log(`   [Log #${index + 1}] Operation: ${log.action} | Row ID: ${log.row_id}`);
      console.log(`               Changed By User UUID: ${log.changed_by}`);
      console.log(`               New Data Action field: ${log.new_data?.status}`);
    });

    console.log('\n=======================================');
    console.log('🎉 ALL INTEGRATION WORKFLOW TESTS PASSED!');
    console.log('=======================================\n');

  } catch (error) {
    console.error('\n❌ INTEGRATION TESTING FAILED:', error);
    process.exit(1);
  } finally {
    await db.pool.end();
  }
}

// Run tests
runVerification();
