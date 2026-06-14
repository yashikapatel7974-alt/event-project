import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import FormTable from '../components/FormTable';
import FormInput from '../components/FormInput';
import FormSelect from '../components/FormSelect';
import { Laptop, Plus, UserCheck, RefreshCw, Eye, X } from 'lucide-react';

const Assets = () => {
  const { user, authFetch } = useAuth();
  const [assets, setAssets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [assetHistory, setAssetHistory] = useState([]);
  
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(5);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAllocateForm, setShowAllocateForm] = useState(false);
  const [allocatingAssetId, setAllocatingAssetId] = useState(null);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Asset Form States
  const [name, setName] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [type, setType] = useState('');
  
  // Allocate Form States
  const [targetUserId, setTargetUserId] = useState('');
  const [notes, setNotes] = useState('');

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const res = await authFetch(`/api/assets?page=${page}&limit=${limit}`);
      const resData = await res.json();
      if (res.ok && resData.status === 'success') {
        setAssets(resData.data.data);
        setTotal(resData.data.total);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await authFetch('/api/employees/directory?limit=100');
      const resData = await res.json();
      if (res.ok && resData.status === 'success') {
        setEmployees(resData.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAssets();
    if (['Admin', 'HR'].includes(user.role)) {
      fetchEmployees();
    }
  }, [page]);

  const handleAddAsset = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const res = await authFetch('/api/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, serial_number: serialNumber, type }),
      });
      const resData = await res.json();

      if (res.ok && resData.status === 'success') {
        setSuccess('Asset added to inventory successfully.');
        setName('');
        setSerialNumber('');
        setType('');
        setShowAddForm(false);
        fetchAssets();
      } else {
        setError(resData.message || 'Failed to add asset.');
      }
    } catch (err) {
      setError('An error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAllocate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const res = await authFetch(`/api/assets/${allocatingAssetId}/allocate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: targetUserId, notes }),
      });
      const resData = await res.json();

      if (res.ok && resData.status === 'success') {
        setSuccess('Asset allocated successfully.');
        setTargetUserId('');
        setNotes('');
        setShowAllocateForm(false);
        setAllocatingAssetId(null);
        fetchAssets();
      } else {
        setError(resData.message || 'Allocation failed.');
      }
    } catch (err) {
      setError('An error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReturn = async (assetId) => {
    const returnNotes = prompt('Enter return details notes (optional):');
    if (returnNotes === null) return;

    try {
      setError('');
      setSuccess('Returning asset...');
      const res = await authFetch(`/api/assets/${assetId}/return`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: returnNotes }),
      });
      const resData = await res.json();

      if (res.ok && resData.status === 'success') {
        setSuccess('Asset returned to inventory successfully.');
        fetchAssets();
      } else {
        setError(resData.message || 'Failed to return asset.');
      }
    } catch (err) {
      setError('An error occurred.');
    }
  };

  const viewAssetHistory = async (asset) => {
    try {
      setSelectedAsset(asset);
      const res = await authFetch(`/api/assets/${asset.id}`);
      const resData = await res.json();
      if (res.ok && resData.status === 'success') {
        setAssetHistory(resData.data.history);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const columns = [
    { header: 'Asset Name', key: 'name' },
    { header: 'Serial Number', key: 'serial_number' },
    { header: 'Type', key: 'type' },
    {
      header: 'Status',
      render: (row) => {
        let badgeType = 'badge-success';
        if (row.status === 'Allocated') badgeType = 'badge-info';
        if (row.status === 'Maintenance') badgeType = 'badge-warning';
        if (row.status === 'Retired') badgeType = 'badge-danger';
        return <span className={`badge ${badgeType}`}>{row.status}</span>;
      },
    },
    {
      header: 'Management Actions',
      render: (row) => {
        const isAdminOrHR = ['Admin', 'HR'].includes(user.role);
        return (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => viewAssetHistory(row)}
              className="btn btn-secondary"
              style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
              title="View Lifecycle History"
            >
              <Eye size={14} /> View
            </button>
            {isAdminOrHR && row.status === 'Available' && (
              <button
                onClick={() => {
                  setAllocatingAssetId(row.id);
                  setShowAllocateForm(true);
                }}
                className="btn btn-primary"
                style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
              >
                <UserCheck size={14} /> Allocate
              </button>
            )}
            {isAdminOrHR && row.status === 'Allocated' && (
              <button
                onClick={() => handleReturn(row.id)}
                className="btn btn-secondary"
                style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.2)' }}
              >
                <RefreshCw size={14} /> Return
              </button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>Asset Inventory Management</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Track hardware, laptop distributions, and corporate devices.</p>
        </div>
        {['Admin', 'HR'].includes(user.role) && (
          <button onClick={() => setShowAddForm(!showAddForm)} className="btn btn-primary">
            <Plus size={16} /> Add Asset
          </button>
        )}
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

      {/* Add Asset Form Overlay */}
      {showAddForm && (
        <form onSubmit={handleAddAsset} className="glass-panel" style={{ borderRadius: 'var(--border-radius-md)', padding: '2rem', marginBottom: '2rem', maxWidth: '600px' }}>
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Laptop size={18} /> Register New Asset</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <FormInput label="Asset Name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. MacBook Pro M3" />
            <FormInput label="Serial Number" value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} required placeholder="e.g. SN-9838-XYZ" />
          </div>
          <FormSelect
            label="Device Category / Type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            required
            placeholder="Select category"
            options={[
              { label: 'Laptop', value: 'Laptop' },
              { label: 'Tablet', value: 'Tablet' },
              { label: 'Phone', value: 'Phone' },
              { label: 'Monitor', value: 'Monitor' },
              { label: 'Peripherals', value: 'Peripherals' }
            ]}
          />
          <button type="submit" disabled={submitting} className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
            {submitting ? 'Registering Device...' : 'Register Asset'}
          </button>
        </form>
      )}

      {/* Allocate Asset Form Overlay */}
      {showAllocateForm && (
        <form onSubmit={handleAllocate} className="glass-panel" style={{ borderRadius: 'var(--border-radius-md)', padding: '2rem', marginBottom: '2rem', maxWidth: '600px' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>Assign Device to Employee</h3>
          <FormSelect
            label="Choose Employee"
            value={targetUserId}
            onChange={(e) => setTargetUserId(e.target.value)}
            required
            placeholder="Select Employee"
            options={employees.map(emp => ({
              label: `${emp.first_name} ${emp.last_name} (${emp.email})`,
              value: emp.user_id
            }))}
          />
          <div className="form-group">
            <label className="form-label">Allocation Notes</label>
            <textarea
              className="form-input"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Assigned for remote Engineering contract duties."
              style={{ minHeight: '80px', resize: 'vertical' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button type="submit" disabled={submitting} className="btn btn-primary" style={{ flexGrow: 1 }}>
              {submitting ? 'Allocating...' : 'Allocate Asset'}
            </button>
            <button type="button" onClick={() => {
              setShowAllocateForm(false);
              setAllocatingAssetId(null);
            }} className="btn btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Asset Lifecycle Log Modal */}
      {selectedAsset && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          backdropFilter: 'blur(4px)'
        }}>
          <div className="glass-panel" style={{
            width: '100%',
            maxWidth: '600px',
            borderRadius: 'var(--border-radius-md)',
            padding: '2rem',
            background: 'var(--bg-secondary)',
            maxHeight: '85vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontWeight: 600 }}>Device Lifecycle Logs: {selectedAsset.name}</h3>
              <X size={20} style={{ cursor: 'pointer' }} onClick={() => {
                setSelectedAsset(null);
                setAssetHistory([]);
              }} />
            </div>
            
            <div style={{ marginBottom: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
              <p><strong>Serial Number:</strong> {selectedAsset.serial_number}</p>
              <p><strong>Status:</strong> {selectedAsset.status}</p>
              <p><strong>Type:</strong> {selectedAsset.type}</p>
            </div>

            <h4 style={{ marginBottom: '1rem', fontWeight: 600 }}>Log Timeline</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {assetHistory.map((h) => (
                <div key={h.id} style={{ background: 'var(--bg-primary)', padding: '0.85rem 1.25rem', borderRadius: 'var(--border-radius-sm)', borderLeft: '3px solid var(--primary)', fontSize: '0.9rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', color: 'var(--text-secondary)' }}>
                    <strong>{h.action}</strong>
                    <span>{new Date(h.created_at).toLocaleString()}</span>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{h.details}</p>
                  {h.first_name && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Performed by: {h.first_name} {h.last_name}
                    </span>
                  )}
                </div>
              ))}
              {assetHistory.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No history records found.</p>}
            </div>
          </div>
        </div>
      )}

      {/* Inventory Table */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <FormTable
          columns={columns}
          data={assets}
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

export default Assets;
