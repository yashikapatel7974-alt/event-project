import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Phone, Briefcase, Mail, Upload, Plus, X, Award } from 'lucide-react';

const Profile = () => {
  const { user, authFetch, accessToken } = useAuth();
  const [profile, setProfile] = useState(null);
  const [skills, setSkills] = useState([]);
  const [newSkill, setNewSkill] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [documents, setDocuments] = useState([]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await authFetch(`/api/employees/${user.id}`);
        const resData = await res.json();
        
        if (res.ok && resData.status === 'success') {
          const prof = resData.data.profile;
          setProfile(prof);
          setFirstName(prof.first_name || '');
          setLastName(prof.last_name || '');
          setPhone(prof.phone || '');
          setAvatarUrl(prof.avatar_url || '');
          setDocuments(prof.document_urls || []);
          setSkills(prof.skills ? prof.skills.map(s => s.name) : []);
        }
      } catch (err) {
        setError('Failed to fetch profile details.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user.id]);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      setError('');
      setSuccess('Uploading avatar...');
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        body: formData,
      });

      const resData = await res.json();
      if (res.ok && resData.status === 'success') {
        setAvatarUrl(resData.data.avatarUrl);
        setSuccess('Avatar uploaded successfully. Save profile to commit changes.');
      } else {
        setError(resData.message || 'Avatar upload failed.');
      }
    } catch (err) {
      setError('Avatar upload failed.');
    }
  };

  const handleDocumentUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const formData = new FormData();
    files.forEach((file) => formData.append('documents', file));

    try {
      setError('');
      setSuccess('Uploading documents...');
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        body: formData,
      });

      const resData = await res.json();
      if (res.ok && resData.status === 'success') {
        setDocuments((prev) => [...prev, ...resData.data.documentUrls]);
        setSuccess('Documents uploaded successfully. Save profile to commit changes.');
      } else {
        setError(resData.message || 'Documents upload failed.');
      }
    } catch (err) {
      setError('Documents upload failed.');
    }
  };

  const handleAddSkill = (e) => {
    e.preventDefault();
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const res = await authFetch(`/api/employees/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          phone,
          avatarUrl,
          documentUrls: documents,
          skills,
        }),
      });

      const resData = await res.json();
      if (res.ok && resData.status === 'success') {
        setSuccess('Profile updated successfully!');
      } else {
        setError(resData.message || 'Failed to update profile.');
      }
    } catch (err) {
      setError('An error occurred while saving profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ color: 'var(--text-muted)' }}>Loading Profile...</div>;
  }

  return (
    <div style={{ maxWidth: '800px' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>My Profile</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Manage your personal details, documents, and skill sets.</p>
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

      <form onSubmit={handleSave} className="glass-panel" style={{ borderRadius: 'var(--border-radius-md)', padding: '2rem' }}>
        
        {/* Avatar Upload Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '2.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1.5rem' }}>
          <div style={{ position: 'relative' }}>
            <img
              src={avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
              alt="Avatar"
              style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--primary)' }}
            />
            <label htmlFor="avatar-file" style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              background: 'var(--primary)',
              color: 'white',
              padding: '0.4rem',
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
            }}>
              <Upload size={14} />
              <input type="file" id="avatar-file" style={{ display: 'none' }} accept="image/*" onChange={handleAvatarUpload} />
            </label>
          </div>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{firstName} {lastName}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.25rem' }}>
              <Briefcase size={14} /> {profile?.role} &bull; {profile?.department_name || 'N/A'}
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.25rem' }}>
              <Mail size={14} /> {profile?.email}
            </p>
          </div>
        </div>

        {/* Inputs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
          <div className="form-group">
            <label className="form-label">First Name</label>
            <input type="text" className="form-input" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Last Name</label>
            <input type="text" className="form-input" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <input type="text" className="form-input" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Annual Salary (USD)</label>
            <input type="text" className="form-input" value={profile?.salary ? `$${profile.salary}` : 'N/A'} disabled />
          </div>
        </div>

        {/* Skills Tag Section */}
        <div style={{ marginBottom: '2rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1.5rem' }}>
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Award size={16} /> Skills Inventory
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', margin: '0.75rem 0' }}>
            {skills.map((skill, idx) => (
              <span key={idx} className="badge badge-info" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.4rem 0.8rem' }}>
                {skill}
                <X size={12} style={{ cursor: 'pointer' }} onClick={() => handleRemoveSkill(skill)} />
              </span>
            ))}
            {skills.length === 0 && <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No skills added.</span>}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', maxWidth: '300px' }}>
            <input
              type="text"
              placeholder="e.g. AWS Cloud"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              className="form-input"
              style={{ padding: '0.5rem 0.8rem' }}
            />
            <button type="button" onClick={handleAddSkill} className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }}>
              <Plus size={16} /> Add
            </button>
          </div>
        </div>

        {/* Document uploads */}
        <div style={{ marginBottom: '2rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1.5rem' }}>
          <label className="form-label">Corporate Documents & Certifications</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', margin: '0.75rem 0' }}>
            {documents.map((doc, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-tertiary)', padding: '0.6rem 1rem', borderRadius: 'var(--border-radius-sm)', fontSize: '0.9rem' }}>
                <a href={doc} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}>
                  Document #{idx + 1} ({doc.split('/').pop()})
                </a>
                <X size={16} style={{ cursor: 'pointer', color: 'var(--danger)' }} onClick={() => setDocuments(documents.filter((d) => d !== doc))} />
              </div>
            ))}
            {documents.length === 0 && <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No documents uploaded.</span>}
          </div>
          <label className="btn btn-secondary" style={{ display: 'inline-flex', gap: '0.5rem', cursor: 'pointer', maxWidth: '200px' }}>
            <Upload size={16} /> Upload Documents
            <input type="file" multiple style={{ display: 'none' }} onChange={handleDocumentUpload} accept=".pdf,.doc,.docx" />
          </label>
        </div>

        <button type="submit" disabled={saving} className="btn btn-primary" style={{ padding: '0.85rem 2rem', float: 'right' }}>
          {saving ? 'Saving Profile...' : 'Save Profile Changes'}
        </button>
        <div style={{ clear: 'both' }}></div>
      </form>
    </div>
  );
};

export default Profile;
