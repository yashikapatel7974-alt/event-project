import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import FormTable from '../components/FormTable';
import FormInput from '../components/FormInput';
import { Plus, Download, Search, ToggleLeft, ToggleRight, Building } from 'lucide-react';
import * as XLSX from 'xlsx';

const Admin = () => {
  const { authFetch } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(5);
  const [search, setSearch] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showDeptForm, setShowDeptForm] = useState(false);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Department Form States
  const [deptName, setDeptName] = useState('');
  const [deptCode, setDeptCode] = useState('');

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await authFetch(`/api/employees/directory?page=${page}&limit=${limit}&search=${search}`);
      const resData = await res.json();
      if (res.ok && resData.status === 'success') {
        setEmployees(resData.data.data);
        setTotal(resData.data.total);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [page, search]);

  const handleToggleStatus = async (employeeId, currentStatus) => {
    const nextStatus = !currentStatus;
    const confirmAction = window.confirm(`Are you sure you want to ${nextStatus ? 'activate' : 'deactivate'} this employee account?`);
    if (!confirmAction) return;

    try {
      setError('');
      setSuccess('Updating status...');
      const res = await authFetch(`/api/employees/${employeeId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: nextStatus }),
      });
      const resData = await res.json();

      if (res.ok && resData.status === 'success') {
        setSuccess(`User account status updated successfully.`);
        fetchEmployees();
      } else {
        setError(resData.message || 'Status toggle failed.');
      }
    } catch (err) {
      setError('An error occurred.');
    }
  };

  const handleCreateDept = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const res = await authFetch('/api/employees/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: deptName, code: deptCode }),
      });
      const resData = await res.json();

      if (res.ok && resData.status === 'success') {
        setSuccess(`Department '${deptName}' created successfully.`);
        setDeptName('');
        setDeptCode('');
        setShowDeptForm(false);
      } else {
        setError(resData.message || 'Failed to create department.');
      }
    } catch (err) {
      setError('An error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  const exportReport = async () => {
    try {
      setError('');
      setSuccess('Generating report...');
      // Fetch all employees without pagination limits
      const res = await authFetch('/api/employees/directory?limit=1000');
      const resData = await res.json();

      if (res.ok && resData.status === 'success') {
        const data = resData.data.data.map((emp) => ({
          'User ID': emp.user_id,
          'First Name': emp.first_name,
          'Last Name': emp.last_name,
          'Email Address': emp.email,
          'Phone': emp.phone,
          'Corporate Role': emp.role,
          'Department': emp.department_name,
          'Department Code': emp.department_code,
          'Salary (USD)': emp.salary,
          'Hire Date': new Date(emp.hire_date).toLocaleDateString(),
          'Status': emp.is_active ? 'Active' : 'Inactive',
        }));

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Employee Directory');
        
        // Export file
        XLSX.writeFile(workbook, `HR_Employee_Directory_Report_${Date.now()}.xlsx`);
        setSuccess('Excel report generated and downloaded successfully!');
      } else {
        setError('Failed to fetch full employee records.');
      }
    } catch (err) {
      setError('An error occurred during report export.');
    }
  };

  const columns = [
    {
      header: 'Profile Name',
      render: (row) => `${row.first_name} ${row.last_name}`,
    },
    { header: 'Email', key: 'email' },
    { header: 'Role', key: 'role' },
    { header: 'Department', key: 'department_name' },
    {
      header: 'Account Status',
      render: (row) => (
        <span className={`badge ${row.is_active ? 'badge-success' : 'badge-danger'}`}>
          {row.is_active ? 'Active' : 'Deactivated'}
        </span>
      ),
    },
    {
      header: 'Operations',
      render: (row) => (
        <button
          onClick={() => handleToggleStatus(row.user_id, row.is_active)}
          className="btn btn-secondary"
          style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', display: 'inline-flex', gap: '0.25rem' }}
          title={row.is_active ? 'Deactivate Account' : 'Activate Account'}
        >
          {row.is_active ? (
            <>
              <ToggleRight size={14} style={{ color: 'var(--success)' }} /> Deactivate
            </>
          ) : (
            <>
              <ToggleLeft size={14} style={{ color: 'var(--danger)' }} /> Activate
            </>
          )}
        </button>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>HR Administration Panel</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Manage department entities, toggle account privileges, and export reports.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={() => setShowDeptForm(!showDeptForm)} className="btn btn-secondary">
            <Building size={16} /> {showDeptForm ? 'Close Form' : 'New Department'}
          </button>
          <button onClick={exportReport} className="btn btn-primary">
            <Download size={16} /> Export Excel Directory
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '0.75rem 1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 'var(--border-radius-sm)', color: 'var(--danger)', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{ padding: '0.75rem 1rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: 'var(--border-radius-sm)', color: 'var(--success)', marginBottom: '1.5rem' }}>
          {success}
        </div>
      )}

      {/* New Department Creation Form */}
      {showDeptForm && (
        <form onSubmit={handleCreateDept} className="glass-panel" style={{ borderRadius: 'var(--border-radius-md)', padding: '2rem', marginBottom: '2rem', maxWidth: '600px' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>Create Corporate Department</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <FormInput label="Department Name" value={deptName} onChange={(e) => setDeptName(e.target.value)} required placeholder="e.g. Executive Support" />
            <FormInput label="Department Code" value={deptCode} onChange={(e) => setDeptCode(e.target.value)} required placeholder="e.g. EXEC" />
          </div>
          <button type="submit" disabled={submitting} className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
            {submitting ? 'Creating entity...' : 'Create Department'}
          </button>
        </form>
      )}

      {/* Search Filter Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ position: 'relative', flexGrow: 1, maxWidth: '400px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '36px' }}
            placeholder="Search by first name, last name or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1); // Reset page to 1
            }}
          />
        </div>
      </div>

      {/* Employee List Directory Table */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <FormTable
          columns={columns}
          data={employees}
          loading={loading}
          total={total}
          page={page}
          limit={limit}
          onPageChange={(p) => setPage(p)}
        />
      </div>
    </div>
  );
};

export default Admin;
