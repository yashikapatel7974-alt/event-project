import { useState } from "react";

function SearchFilter() {
  const employees = [
    { id: 1, name: "Aman Patel", department: "IT" },
    { id: 2, name: "Rahul Sharma", department: "HR" },
    { id: 3, name: "Priya Singh", department: "Finance" },
    { id: 4, name: "Neha Verma", department: "IT" },
  ];

  const [search, setSearch] = useState("");

  const filteredEmployees = employees.filter((employee) =>
    employee.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <h1>Search & Filter Employees</h1>

      <input
        type="text"
        placeholder="Search employee..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <br /><br />

      <table border="1" cellPadding="10">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Department</th>
          </tr>
        </thead>

        <tbody>
          {filteredEmployees.map((employee) => (
            <tr key={employee.id}>
              <td>{employee.id}</td>
              <td>{employee.name}</td>
              <td>{employee.department}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default SearchFilter;