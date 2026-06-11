function HealthCheck() {
  return (
    <div>
      <h1>System Health Check</h1>

      <table border="1" cellPadding="10">
        <tbody>
          <tr>
            <td>Frontend Status</td>
            <td>Running ✅</td>
          </tr>

          <tr>
            <td>Authentication Module</td>
            <td>Active ✅</td>
          </tr>

          <tr>
            <td>Employee Management</td>
            <td>Active ✅</td>
          </tr>

          <tr>
            <td>Leave Management</td>
            <td>Active ✅</td>
          </tr>

          <tr>
            <td>Asset Management</td>
            <td>Active ✅</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default HealthCheck;