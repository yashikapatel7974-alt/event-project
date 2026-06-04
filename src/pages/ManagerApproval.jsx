function ManagerApproval() {
  const requests = [
    {
      id: 1,
      employee: "Aman Patel",
      type: "Sick Leave",
      dates: "2026-06-10 to 2026-06-12",
      status: "Pending",
    },
    {
      id: 2,
      employee: "Rahul Sharma",
      type: "Casual Leave",
      dates: "2026-06-15 to 2026-06-16",
      status: "Pending",
    },
  ];

  const handleAction = (name) => {
    alert(name + " action clicked");
  };

  return (
    <div>
      <h1>Manager Approval</h1>

      <table border="1" cellPadding="10">
        <thead>
          <tr>
            <th>ID</th>
            <th>Employee</th>
            <th>Leave Type</th>
            <th>Dates</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {requests.map((req) => (
            <tr key={req.id}>
              <td>{req.id}</td>
              <td>{req.employee}</td>
              <td>{req.type}</td>
              <td>{req.dates}</td>
              <td>{req.status}</td>
              <td>
                <button onClick={() => handleAction("Approve")}>Approve</button>
                <button onClick={() => handleAction("Reject")}>Reject</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ManagerApproval;