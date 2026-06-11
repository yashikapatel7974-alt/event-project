function ErrorLogs() {
  const errors = [
    {
      id: 1,
      message: "Invalid Login Attempt",
      date: "2026-06-11",
    },
    {
      id: 2,
      message: "Employee Record Not Found",
      date: "2026-06-11",
    },
    {
      id: 3,
      message: "Leave Request Validation Failed",
      date: "2026-06-11",
    },
  ];

  return (
    <div>
      <h1>Error Logs</h1>

      <table border="1" cellPadding="10">
        <thead>
          <tr>
            <th>ID</th>
            <th>Error Message</th>
            <th>Date</th>
          </tr>
        </thead>

        <tbody>
          {errors.map((error) => (
            <tr key={error.id}>
              <td>{error.id}</td>
              <td>{error.message}</td>
              <td>{error.date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ErrorLogs;