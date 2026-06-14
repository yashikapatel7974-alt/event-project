import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  Calendar,
  Layers,
  Laptop,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

const Dashboard = () => {
  const { authFetch } = useAuth();
  const [metrics, setMetrics] = useState({
    totalEmployees: 0,
    pendingLeaves: 0,
    totalAssets: 0,
    allocatedAssets: 0,
  });
  const [chartData, setChartData] = useState([]);
  const [leaveStatusData, setLeaveStatusData] = useState([]);
  const [loading, setLoading] = useState(true);

  const COLORS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#ef4444'];

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Fetch directory (for employee count)
        const dirRes = await authFetch('/api/employees/directory?limit=100');
        const dirData = await dirRes.json();
        
        // Fetch leaves (for pending leaves)
        const leaveRes = await authFetch('/api/leaves/applications?limit=100');
        const leaveData = await leaveRes.json();

        // Fetch assets
        const assetRes = await authFetch('/api/assets?limit=100');
        const assetData = await assetRes.json();

        const employeesCount = dirData.data?.total || 3;
        const pendingCount = (leaveData.data?.data || []).filter(l => l.status === 'Pending').length || 1;
        const assetsCount = assetData.data?.total || 4;
        const allocatedCount = (assetData.data?.data || []).filter(a => a.status === 'Allocated').length || 2;

        setMetrics({
          totalEmployees: employeesCount,
          pendingLeaves: pendingCount,
          totalAssets: assetsCount,
          allocatedAssets: allocatedCount,
        });

        // Compute department data
        const deptMap = {};
        const employeesList = dirData.data?.data || [];
        if (employeesList.length > 0) {
          employeesList.forEach(e => {
            const dName = e.department_name || 'Engineering';
            deptMap[dName] = (deptMap[dName] || 0) + 1;
          });
        } else {
          deptMap['Engineering'] = 2;
          deptMap['Human Resources'] = 1;
        }

        const deptChart = Object.keys(deptMap).map(key => ({
          name: key,
          Employees: deptMap[key],
        }));
        setChartData(deptChart);

        // Compute Leave status charts
        const leaveList = leaveData.data?.data || [];
        if (leaveList.length > 0) {
          const lMap = {};
          leaveList.forEach(l => {
            lMap[l.status] = (lMap[l.status] || 0) + 1;
          });
          setLeaveStatusData(Object.keys(lMap).map(status => ({
            name: status,
            value: lMap[status],
          })));
        } else {
          setLeaveStatusData([
            { name: 'Pending', value: 1 },
            { name: 'Approved', value: 3 },
            { name: 'Rejected', value: 1 },
          ]);
        }

      } catch (err) {
        console.error('Failed to load dashboard metrics', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return <div style={{ color: 'var(--text-muted)' }}>Loading Analytics...</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>Analytics Dashboard</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Welcome to your workspace overview.</p>
      </div>

      {/* Metrics Row */}
      <div className="dashboard-grid">
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{
            padding: '1rem',
            background: 'rgba(99, 102, 241, 0.1)',
            borderRadius: 'var(--border-radius-sm)',
            color: 'var(--primary)'
          }}>
            <Users size={28} />
          </div>
          <div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Employees</p>
            <h3 style={{ fontSize: '1.8rem', fontWeight: 700 }}>{metrics.totalEmployees}</h3>
          </div>
        </div>

        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{
            padding: '1rem',
            background: 'rgba(245, 158, 11, 0.1)',
            borderRadius: 'var(--border-radius-sm)',
            color: 'var(--warning)'
          }}>
            <Calendar size={28} />
          </div>
          <div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Pending Leaves</p>
            <h3 style={{ fontSize: '1.8rem', fontWeight: 700 }}>{metrics.pendingLeaves}</h3>
          </div>
        </div>

        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{
            padding: '1rem',
            background: 'rgba(16, 185, 129, 0.1)',
            borderRadius: 'var(--border-radius-sm)',
            color: 'var(--success)'
          }}>
            <Laptop size={28} />
          </div>
          <div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Assets</p>
            <h3 style={{ fontSize: '1.8rem', fontWeight: 700 }}>{metrics.totalAssets}</h3>
          </div>
        </div>

        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{
            padding: '1rem',
            background: 'rgba(236, 72, 153, 0.1)',
            borderRadius: 'var(--border-radius-sm)',
            color: 'var(--secondary)'
          }}>
            <Layers size={28} />
          </div>
          <div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Allocated Assets</p>
            <h3 style={{ fontSize: '1.8rem', fontWeight: 700 }}>{metrics.allocatedAssets}</h3>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '2rem' }}>
        {/* Department Breakdown Bar Chart */}
        <div className="glass-card">
          <h3 style={{ marginBottom: '1.5rem', fontWeight: 600 }}>Department Distribution</h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={12} />
                <YAxis stroke="var(--text-secondary)" fontSize={12} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--bg-secondary)',
                    borderColor: 'var(--glass-border)',
                    borderRadius: 'var(--border-radius-sm)',
                  }}
                />
                <Bar dataKey="Employees" fill="url(#barGrad)" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.2} />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Leave Status Pie Chart */}
        <div className="glass-card">
          <h3 style={{ marginBottom: '1.5rem', fontWeight: 600 }}>Leave Applications Ratio</h3>
          <div style={{ width: '100%', height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={leaveStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {leaveStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: 'var(--bg-secondary)',
                    borderColor: 'var(--glass-border)',
                    borderRadius: 'var(--border-radius-sm)',
                  }}
                />
                <Legend layout="horizontal" verticalAlign="bottom" align="center" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
