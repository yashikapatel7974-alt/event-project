import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import FormTable from '../components/FormTable';
import FormInput from '../components/FormInput';
import FormSelect from '../components/FormSelect';
import { Calendar, Plus, Check, X, ShieldAlert } from 'lucide-react';

const Leaves = () => {
  const { user, authFetch } = useAuth();
  const [balances, setBalances] = useState([]);
  const [applications, setApplications] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(5);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [leaveTypeId, setLeaveTypeId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  const fetchBalances = async () => {
    try {
      const res = await authFetch('/api/leaves/balances');
      const resData = await res.json();
      if (res.ok && resData.status === 'success') {
        setBalances(resData.data.balances);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const res = await authFetch(`/api/leaves/applications?page=${page}&limit=${limit}`);
      const resData = await res.json();
      if (res.ok && resData.status === 'success') {
        setApplications(resData.data.data);
        setTotal(resData.data.total);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaveTypes = async () => {
    try {
      const res = await authFetch('/api/leaves/types');
      const resData = await res.json();
      if (res.ok && resData.status === 'success') {
        setLeaveTypes(resData.data.leaveTypes);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchBalances();
    fetchLeaveTypes();
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [page]);

  const handleApply = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const res = await authFetch('/api/leaves/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leaveTypeId, startDate, endDate, reason }),
      });
      const resData = await res.json();

      if (res.ok && resData.status === 'success') {
        setSuccess('Leave request submitted successfully!');
        setShowApplyForm(false);
        setLeaveTypeId('');
        setStartDate('');
        setEndDate('');
        setReason('');
        // Reload balances and applications
        fetchBalances();
        fetchApplications();
      } else {
        setError(resData.message || 'Failed to submit leave.');
      }
    } catch (err) {
      setError('An error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleProcess = async (applicationId, action) => {
    const comments = prompt(`Add feedback comments for this ${action.toLowerCase()} leave request:`);
    if (comments === null) return; // Cancelled

    try {
      setError('');
      setSuccess('Processing leave application...');
      const res = await authFetch(`/api/leaves/applications/${applicationId}/process`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, comments }),
      });
      const resData = await res.json();

      if (res.ok && resData.status === 'success') {
        setSuccess(`Leave request has been ${action.toLowerCase()} successfully!`);
        fetchBalances();
        fetchApplications();
      } else {
        setError(resData.message || 'Failed to process leave request.');
      }
    } catch (err) {
      setError('An error occurred.');
    }
  };

  const columns = [
    {
      header: 'Employee',
      render: (row) => `${row.first_name} ${row.last_name}`,
    },
    { header: 'Department', key: 'department_name' },
    { header: 'Leave Category', key: 'leave_type_name' },
    {
      header: 'Start Date',
      render: (row) => new Date(row.start_date).toLocaleDateString(),
    },
    {
      header: 'End Date',
      render: (row) => new Date(row.end_date).toLocaleDateString(),
    },
    { header: 'Reason', key: 'reason' },
    {
      header: 'Status',
      render: (row) => {
        let badgeType = 'badge-warning';
        if (row.status === 'Approved') badgeType = 'badge-success';
        if (row.status === 'Rejected') badgeType = 'badge-danger';
        return <span className={`badge ${badgeType}`}>{row.status}</span>;
      },
    },
    {
      header: 'Action / History',
      render: (row) => {
        const isApprover = ['Admin', 'Manager', 'HR'].includes(user.role);
        if (row.status === 'Pending' && isApprover && row.user_id !== user.id) {
          return (
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <button
                onClick={() => handleProcess(row.leave_application_id, 'Approved')}
                className="btn btn-primary"
                style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', background: 'var(--success)' }}
                title="Approve Leave"
              >
                <Check size={14} />
              </button>
              <button
                onClick={() => handleProcess(row.leave_application_id, 'Rejected')}
                className="btn btn-primary"
                style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', background: 'var(--danger)' }}
                title="Reject Leave"
              >
                <X size={14} />
              </button>
            </div>
          );
        }
        
        if (row.approvals && row.approvals.length > 0 && row.approvals[0].approver_first_name) {
          const app = row.approvals[0];
          return (
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {app.action} by {app.approver_first_name} ({app.comments || 'No comment'})
            </span>
          );
        }

        return <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No history</span>;
      },
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>Leave Workspace</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Track leaf balances and request history.</p>
        </div>
        <button onClick={() => setShowApplyForm(!showApplyForm)} className="btn btn-primary">
          <Plus size={16} /> {showApplyForm ? 'Close Form' : 'Apply for Leave'}
        </button>
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

      {/* Leave Apply Form Overlay */}
      {showApplyForm && (
        <form onSubmit={handleApply} className="glass-panel" style={{ borderRadius: 'var(--border-radius-md)', padding: '2rem', marginBottom: '2rem', maxWidth: '600px' }}>
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Calendar size={18} /> Apply for New Leave</h3>
          <div className="form-group">
            <label className="form-label">Leave Type</label>
            <select
              className="form-input"
              value={leaveTypeId}
              onChange={(e) => setLeaveTypeId(e.target.value)}
              required
            >
              <option value="">Select Category</option>
              {leaveTypes.map((type) => (
                <option key={type.id} value={type.id}>{type.name}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <FormInput
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
            <FormInput
              label="End Date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Reason</label>
            <textarea
              className="form-input"
              style={{ minHeight: '80px', resize: 'vertical' }}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              placeholder="Provide a brief explanation for your leave request..."
            />
          </div>
          <button type="submit" disabled={submitting} className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
            {submitting ? 'Submitting request...' : 'Submit Leave Request'}
          </button>
        </form>
      )}

      {/* Balances Card Grid */}
      <h3 style={{ marginBottom: '1rem', fontWeight: 600 }}>Active Leave Balances</h3>
      <div className="dashboard-grid" style={{ marginBottom: '2.5rem' }}>
        {balances.map((bal) => {
          const available = bal.allocated_days - bal.used_days - bal.pending_days;
          return (
            <div key={bal.id} className="glass-card" style={{ borderLeft: '4px solid var(--primary)' }}>
              <h4 style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{bal.leave_type_name}</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '1rem' }}>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Available</span>
                  <p style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--success)' }}>{available}</p>
                </div>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Pending</span>
                  <p style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--warning)' }}>{bal.pending_days}</p>
                </div>
              </div>
              <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px solid var(--glass-border)', paddingTop: '0.5rem' }}>
                Used: {bal.used_days} / Total: {bal.allocated_days} days
              </div>
            </div>
          );
        })}
        {balances.length === 0 && (
          <div className="glass-card" style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-muted)' }}>
            No leave balances initialized.
          </div>
        )}
      </div>

      {/* Applications Table */}
      <h3 style={{ marginBottom: '1rem', fontWeight: 600 }}>Leave History & Workflow Approval Pipeline</h3>
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <FormTable
          columns={columns}
          data={applications}
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

export default Leaves;
