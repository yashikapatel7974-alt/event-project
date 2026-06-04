function HRApproval() {
  const requests = [
    {
      id: 1,
      employee: "Aman Patel",
      type: "Sick Leave",
      managerStatus: "Approved",
      hrStatus: "Pending",
    },
    {
      id: 2,
      employee: "Rahul Sharma",
      type: "Casual Leave",
      managerStatus: "Approved",
      hrStatus: "Pending",
    },
  ];

  const handleHRAction = (action) => {
    alert("HR " + action + " clicked");
  };

  return (
    <div>
      <h1>HR Approval</h1>

      <table border="1" cellPadding="10">
        <thead>
          <tr>
            <th>ID</th>
            <th>Employee</th>
            <th>Leave Type</th>
            <th>Manager Status</th>
            <th>HR Status</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {requests.map((req) => (
            <tr key={req.id}>
              <td>{req.id}</td>
              <td>{req.employee}</td>
              <td>{req.type}</td>
              <td>{req.managerStatus}</td>
              <td>{req.hrStatus}</td>
              <td>
                <button onClick={() => handleHRAction("Approve")}>
                  Approve
                </button>
                <button onClick={() => handleHRAction("Reject")}>
                  Reject
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default HRApproval;