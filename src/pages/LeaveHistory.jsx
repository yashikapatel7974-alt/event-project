function LeaveHistory() {
  const leaves = [
    {
      id: 1,
      type: "Sick Leave",
      from: "2026-06-01",
      to: "2026-06-02",
      status: "Approved",
    },
    {
      id: 2,
      type: "Casual Leave",
      from: "2026-06-05",
      to: "2026-06-06",
      status: "Pending",
    },
  ];

  return (
    <div>
      <h1>Leave History</h1>

      <table border="1" cellPadding="10">
        <thead>
          <tr>
            <th>ID</th>
            <th>Leave Type</th>
            <th>From</th>
            <th>To</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          {leaves.map((leave) => (
            <tr key={leave.id}>
              <td>{leave.id}</td>
              <td>{leave.type}</td>
              <td>{leave.from}</td>
              <td>{leave.to}</td>
              <td>{leave.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default LeaveHistory;