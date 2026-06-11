import { Link } from "react-router-dom";

function Dashboard() {
  return (
  <div>
    <h1>Employee Management System Dashboard</h1>

    <h2>Modules</h2>

    <Link to="/employees"><button>Employee List</button></Link>
    <br /><br />

    <Link to="/employee-create"><button>Employee Form</button></Link>
    <br /><br />

    <Link to="/departments"><button>Departments</button></Link>
    <br /><br />

    <Link to="/skills"><button>Skills</button></Link>
    <br /><br />

    <Link to="/leave-application"><button>Leave Application</button></Link>
    <br /><br />

    <Link to="/leave-history"><button>Leave History</button></Link>
    <br /><br />

    <Link to="/manager-approval"><button>Manager Approval</button></Link>
    <br /><br />

    <Link to="/hr-approval"><button>HR Approval</button></Link>
    <br /><br />

    <Link to="/assets"><button>Asset Management</button></Link>
    <br /><br />

    <Link to="/notifications"><button>Notifications</button></Link>
    <br /><br />

    <Link to="/audit-logs"><button>Audit Logs</button></Link>
    <br /><br />

    <Link to="/reports"><button>Reports</button></Link>
    <br /><br />

    <Link to="/analytics"><button>Analytics</button></Link>
    <Link to="/search-filter">
  <button>Search & Filter</button>
</Link>

<br /><br />
<Link to="/error-logs">
  <button>Error Logs</button>
</Link>

<br /><br />
<Link to="/health-check">
  <button>Health Check</button>
</Link>

<br /><br />
<Link to="/testing-dashboard">
  <button>Testing Dashboard</button>
</Link>

<br /><br />
<Link to="/docker-setup">
  <button>Docker Setup</button>
</Link>

<br /><br />
  </div>
  
);
}

export default Dashboard;