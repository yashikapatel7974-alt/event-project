import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

import EmployeeList from "./pages/EmployeeList";
import EmployeeForm from "./pages/EmployeeForm";
import Departments from "./pages/Departments";
import Skills from "./pages/Skills";

import LeaveApplication from "./pages/LeaveApplication";
import LeaveHistory from "./pages/LeaveHistory";
import ManagerApproval from "./pages/ManagerApproval";
import HRApproval from "./pages/HRApproval";
import AssetManagement from "./pages/AssetManagement";
import Notifications from "./pages/Notifications";
import AuditLogs from "./pages/AuditLogs";
import Reports from "./pages/Reports";
import Analytics from "./pages/Analytics";



function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />

        <Route path="/employees" element={<EmployeeList />} />
        <Route path="/employee-create" element={<EmployeeForm />} />
        <Route path="/departments" element={<Departments />} />
        <Route path="/skills" element={<Skills />} />
        <Route path="/leave-application" element={<LeaveApplication />} />
        <Route path="/leave-history" element={<LeaveHistory />} />
        <Route path="/manager-approval" element={<ManagerApproval />} />
        <Route path="/hr-approval" element={<HRApproval />} />
        <Route path="/assets" element={<AssetManagement />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/audit-logs" element={<AuditLogs />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/analytics" element={<Analytics />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;