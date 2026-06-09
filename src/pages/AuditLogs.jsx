function AuditLogs() {
  const logs = [
    {
      id: 1,
      action: "Employee Updated",
      oldValue: "IT",
      newValue: "HR",
      date: "2026-06-09",
    },
    {
      id: 2,
      action: "Asset Assigned",
      oldValue: "Not Assigned",
      newValue: "Laptop",
      date: "2026-06-09",
    },
  ];

  return (
    <div>
      <h1>Audit Logs</h1>

      <table border="1" cellPadding="10">
        <thead>
          <tr>
            <th>ID</th>
            <th>Action</th>
            <th>Old Value</th>
            <th>New Value</th>
            <th>Date</th>
          </tr>
        </thead>

        <tbody>
          {logs.map((log) => (
            <tr key={log.id}>
              <td>{log.id}</td>
              <td>{log.action}</td>
              <td>{log.oldValue}</td>
              <td>{log.newValue}</td>
              <td>{log.date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AuditLogs;