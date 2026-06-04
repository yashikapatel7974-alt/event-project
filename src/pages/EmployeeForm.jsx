import { useState } from "react";

function EmployeeForm() {
  const [employee, setEmployee] = useState({
    name: "",
    email: "",
    department: "",
    skill: "",
  });

  const handleChange = (e) => {
    setEmployee({
      ...employee,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    alert("Employee Saved Successfully");

    console.log(employee);
  };

  return (
    <div>
      <h1>Create Employee</h1>

      <form onSubmit={handleSubmit}>
        <div>
          <label>Employee Name</label>
          <br />
          <input
            type="text"
            name="name"
            value={employee.name}
            onChange={handleChange}
          />
        </div>

        <br />

        <div>
          <label>Email</label>
          <br />
          <input
            type="email"
            name="email"
            value={employee.email}
            onChange={handleChange}
          />
        </div>

        <br />

        <div>
          <label>Department</label>
          <br />
          <select
            name="department"
            value={employee.department}
            onChange={handleChange}
          >
            <option value="">Select Department</option>
            <option value="IT">IT</option>
            <option value="HR">HR</option>
            <option value="Finance">Finance</option>
            <option value="Marketing">Marketing</option>
          </select>
        </div>

        <br />

        <div>
          <label>Skill</label>
          <br />
          <select
            name="skill"
            value={employee.skill}
            onChange={handleChange}
          >
            <option value="">Select Skill</option>
            <option value="React">React</option>
            <option value="JavaScript">JavaScript</option>
            <option value="Node.js">Node.js</option>
            <option value="SQL">SQL</option>
          </select>
        </div>

        <br />

        <button type="submit">Save Employee</button>
      </form>
    </div>
  );
}

export default EmployeeForm;