import { useState } from "react";

function LeaveApplication() {
  const [leave, setLeave] = useState({
    leaveType: "",
    fromDate: "",
    toDate: "",
    reason: "",
  });

  const handleChange = (e) => {
    setLeave({
      ...leave,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert("Leave Application Submitted");
    console.log(leave);
  };

  return (
    <div>
      <h1>Leave Application</h1>

      <form onSubmit={handleSubmit}>
        <div>
          <label>Leave Type</label>
          <br />
          <select
            name="leaveType"
            value={leave.leaveType}
            onChange={handleChange}
          >
            <option value="">Select Leave Type</option>
            <option value="Casual Leave">Casual Leave</option>
            <option value="Sick Leave">Sick Leave</option>
            <option value="Earned Leave">Earned Leave</option>
          </select>
        </div>

        <br />

        <div>
          <label>From Date</label>
          <br />
          <input
            type="date"
            name="fromDate"
            value={leave.fromDate}
            onChange={handleChange}
          />
        </div>

        <br />

        <div>
          <label>To Date</label>
          <br />
          <input
            type="date"
            name="toDate"
            value={leave.toDate}
            onChange={handleChange}
          />
        </div>

        <br />

        <div>
          <label>Reason</label>
          <br />
          <textarea
            name="reason"
            value={leave.reason}
            onChange={handleChange}
          />
        </div>

        <br />

        <button type="submit">Apply Leave</button>
      </form>
    </div>
  );
}

export default LeaveApplication;