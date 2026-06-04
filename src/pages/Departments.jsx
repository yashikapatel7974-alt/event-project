function Departments() {
  const departments = [
    "IT",
    "HR",
    "Finance",
    "Marketing",
    "Admin",
  ];

  return (
    <div>
      <h1>Departments</h1>

      <ul>
        {departments.map((dept, index) => (
          <li key={index}>{dept}</li>
        ))}
      </ul>
    </div>
  );
}

export default Departments;