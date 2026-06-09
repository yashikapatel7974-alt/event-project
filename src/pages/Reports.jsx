function Reports() {
  const reports = [
    { id: 1, name: "Employee Report" },
    { id: 2, name: "Leave Report" },
    { id: 3, name: "Asset Report" },
  ];

  return (
    <div>
      <h1>Reports</h1>

      <table border="1" cellPadding="10">
        <thead>
          <tr>
            <th>ID</th>
            <th>Report Name</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {reports.map((report) => (
            <tr key={report.id}>
              <td>{report.id}</td>
              <td>{report.name}</td>
              <td>
                <button>Export CSV</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Reports;