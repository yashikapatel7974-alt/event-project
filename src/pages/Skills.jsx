function Skills() {
  const skills = [
    "React",
    "JavaScript",
    "Node.js",
    "SQL",
    "Java",
  ];

  return (
    <div>
      <h1>Skills</h1>

      <ul>
        {skills.map((skill, index) => (
          <li key={index}>{skill}</li>
        ))}
      </ul>
    </div>
  );
}

export default Skills;