function EmployeeList() {
  const employees = [
    {
      id: 1,
      name: "Rahul Sharma",
      email: "rahul@gmail.com",
      department: "IT",
      skill: "React",
    },
    {
      id: 2,
      name: "Priya Patel",
      email: "priya@gmail.com",
      department: "HR",
      skill: "Recruitment",
    },
  ];

  return (
    <div>
      <h1>Employee List</h1>

      <table border="1" cellPadding="10">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Department</th>
            <th>Skill</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {employees.map((emp) => (
            <tr key={emp.id}>
              <td>{emp.id}</td>
              <td>{emp.name}</td>
              <td>{emp.email}</td>
              <td>{emp.department}</td>
              <td>{emp.skill}</td>
              <td>
                <button>Edit</button>
                <button>Delete</button>
                </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default EmployeeList;