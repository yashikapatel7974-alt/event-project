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

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;