function AssetManagement() {
  const assets = [
    {
      id: 1,
      employee: "Aman Patel",
      asset: "Laptop",
      status: "Allocated",
    },
    {
      id: 2,
      employee: "Rahul Sharma",
      asset: "Monitor",
      status: "Allocated",
    },
    {
      id: 3,
      employee: "Priya Singh",
      asset: "ID Card",
      status: "Returned",
    },
  ];

  return (
    <div>
      <h1>Asset Management</h1>

      <table border="1" cellPadding="10">
        <thead>
          <tr>
            <th>ID</th>
            <th>Employee</th>
            <th>Asset</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          {assets.map((item) => (
            <tr key={item.id}>
              <td>{item.id}</td>
              <td>{item.employee}</td>
              <td>{item.asset}</td>
              <td>{item.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AssetManagement;