function Notifications() {
  const notifications = [
    {
      id: 1,
      message: "Leave request approved by Manager",
    },
    {
      id: 2,
      message: "Laptop assigned successfully",
    },
    {
      id: 3,
      message: "HR approved your leave request",
    },
  ];

  return (
    <div>
      <h1>Notifications</h1>

      <ul>
        {notifications.map((item) => (
          <li key={item.id}>{item.message}</li>
        ))}
      </ul>
    </div>
  );
}

export default Notifications;