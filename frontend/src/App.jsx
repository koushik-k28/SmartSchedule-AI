import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  CalendarDays,
  CheckSquare,
  BrainCircuit,
  Settings,
  Plus,
  Clock,
  Flame,
  Target,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  BookOpen,
  Coffee,
  Code,
  GraduationCap
} from "lucide-react";
import "./App.css";

function App() {
  const [activePage, setActivePage] = useState("Dashboard");
  const [showAddTask, setShowAddTask] = useState(false);

  const [newTask, setNewTask] = useState({
    title: "",
    subject: "",
    start: "",
    end: "",
    priority: "Medium"
  });
  const [completed, setCompleted] = useState(() => {
    return JSON.parse(
      localStorage.getItem("smartScheduleCompleted") || "[]"
    );
  });
  const [searchTerm, setSearchTerm] = useState("");

  const [priorityFilter, setPriorityFilter] = useState("All");
  const [day, setDay] = useState("Monday");
  const [chatInput, setChatInput] = useState("");
  const [showTimetableForm, setShowTimetableForm] = useState(false);

  const [studentDetails, setStudentDetails] = useState({
    subjects: "",
    studyHours: "",
    preferredTime: "Flexible",
    duration: "7",
    examDetails: ""
  });

  const [chatMessages, setChatMessages] = useState([
    {
      role: "assistant",
      text: "Hi! I'm your SmartSchedule AI assistant. Tell me about your study goals and I'll help you plan your day."
    }
  ]);



  const defaultTasks = [
    { id: 1, title: "Java DSA Practice", subject: "Programming", time: "09:00 AM - 10:00 AM", day: "Monday", priority: "High" },
    { id: 2, title: "Web Development", subject: "Development", time: "10:30 AM - 11:30 AM", day: "Tuesday", priority: "Medium" },
    { id: 3, title: "Operating Systems", subject: "Computer Science", time: "02:00 PM - 03:00 PM", day: "Wednesday", priority: "High" },
    { id: 4, title: "Computer Networks", subject: "Computer Science", time: "04:00 PM - 05:00 PM", day: "Thursday", priority: "Medium" }
  ];


  const [tasks, setTasks] = useState(() => {
    try {
      const savedTasks = localStorage.getItem("smartScheduleTasks");
      return savedTasks ? JSON.parse(savedTasks) : defaultTasks;
    } catch {
      return defaultTasks;
    }
  });

  // Save tasks whenever they change
  useEffect(() => {
    localStorage.setItem(
      "smartScheduleTasks",
      JSON.stringify(tasks)
    );
  }, [tasks]);

  // Save completed tasks whenever they change
  useEffect(() => {
    localStorage.setItem(
      "smartScheduleCompleted",
      JSON.stringify(completed)
    );
  }, [completed]);
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  const toggleTask = (id) => {
    setCompleted((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };
  const deleteTask = (taskId) => {
    setTasks((prev) =>
      prev.filter((task) => task.id !== taskId)
    );

    setCompleted((prev) =>
      prev.filter((id) => id !== taskId)
    );
  };



  const sendMessage = async (messageText = chatInput) => {
    if (!messageText.trim()) return;

    const userMessage = messageText.trim();

    setChatMessages((prev) => [
      ...prev,
      { role: "user", text: userMessage }
    ]);

    setChatInput("");

    try {
      const response = await fetch("http://127.0.0.1:8000/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: userMessage
        })
      });

      if (!response.ok) {
        throw new Error("Backend request failed");
      }

      const data = await response.json();

      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", text: data.reply }
      ]);

    } catch (error) {
      console.error("Chat error:", error);

      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "Unable to connect to the backend. Please check whether the server is running."
        }
      ]);
    }
  };


  const addTask = () => {
    if (!newTask.title || !newTask.start || !newTask.end) {
      alert("Please fill in all required fields");
      return;
    }

    // Convert time into minutes
    const startMinutes =
      Number(newTask.start.split(":")[0]) * 60 +
      Number(newTask.start.split(":")[1]);

    const endMinutes =
      Number(newTask.end.split(":")[0]) * 60 +
      Number(newTask.end.split(":")[1]);

    // Check whether end time is after start time
    if (endMinutes <= startMinutes) {
      alert("End time must be after start time");
      return;
    }

    // Check for overlapping tasks
    const hasOverlap = tasks.some((task) => {
      const [oldStart, oldEnd] = task.time.split(" - ");

      const oldStartMinutes =
        Number(oldStart.split(":")[0]) * 60 +
        Number(oldStart.split(":")[1]);

      const oldEndMinutes =
        Number(oldEnd.split(":")[0]) * 60 +
        Number(oldEnd.split(":")[1]);

      return (
        startMinutes < oldEndMinutes &&
        endMinutes > oldStartMinutes
      );
    });


    // const sendMessage = async () => {
    //   if (!chatInput.trim()) return;

    //   const userMessage = chatInput.trim();

    //   setChatMessages((prev) => [
    //     ...prev,
    //     { role: "user", text: userMessage }
    //   ]);

    //   setChatInput("");

    //   try {
    //     const response = await fetch("http://127.0.0.1:8000/chat", {
    //       method: "POST",
    //       headers: {
    //         "Content-Type": "application/json"
    //       },
    //       body: JSON.stringify({
    //         message: userMessage
    //       })
    //     });

    //     if (!response.ok) {
    //       throw new Error("Backend request failed");
    //     }

    //     const data = await response.json();

    //     setChatMessages((prev) => [
    //       ...prev,
    //       { role: "assistant", text: data.reply }
    //     ]);

    //   } catch (error) {
    //     setChatMessages((prev) => [
    //       ...prev,
    //       {
    //         role: "assistant",
    //         text: "Unable to connect to the backend. Please check whether the server is running."
    //       }
    //     ]);
    //   }
    // };



    if (hasOverlap) {
      alert("This time slot overlaps with another task!");
      return;
    }

    const task = {
      id: Date.now(),
      title: newTask.title,
      subject: newTask.subject || "General",
      time: `${newTask.start} - ${newTask.end}`,
      priority: newTask.priority,
      day: day
    };

    setTasks((prev) => [...prev, task]);

    setNewTask({
      title: "",
      subject: "",
      start: "",
      end: "",
      priority: "Medium"
    });

    setShowAddTask(false);
  };


  const progress = Math.round((completed.length / tasks.length) * 100);

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon"><BrainCircuit size={25} /></div>
          <span>SmartSchedule<span className="brand-ai"> AI</span></span>
        </div>

        <p className="nav-label">WORKSPACE</p>

        {[
          { name: "Dashboard", icon: LayoutDashboard },
          { name: "My Timetable", icon: CalendarDays },
          { name: "My Tasks", icon: CheckSquare },
          { name: "AI Assistant", icon: BrainCircuit }
        ].map((item) => (
          <button
            key={item.name}
            className={`nav-item ${activePage === item.name ? "active" : ""}`}
            onClick={() => setActivePage(item.name)}
          >
            <item.icon size={19} />
            {item.name}
          </button>
        ))}

        <div className="sidebar-bottom">
          <button
            className={`nav-item ${activePage === "Settings" ? "active" : ""}`}
            onClick={() => setActivePage("Settings")}
          >
            <Settings size={19} /> Settings
          </button>

          <div className="profile">
            <div className="avatar">S</div>
            <div>
              <strong>Student</strong>
              <small>Free Plan</small>
            </div>
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <span className="breadcrumb">Workspace / {activePage}</span>
            <h2>{activePage}</h2>
          </div>
          <button className="date-button"><CalendarDays size={17} /> Today</button>
        </header>
        {activePage === "Dashboard" && (
          <>
            <section className="welcome">
              <div>
                <span className="welcome-tag"><Sparkles size={15} /> YOUR PERSONAL AI PLANNER</span>
                <h1>Make today <span>count.</span></h1>
                <p>Organize your time, focus on your goals and make every hour productive.</p>
              </div>
              <div className="welcome-art"><BrainCircuit size={85} /></div>
            </section>

            <section className="stats">
              <div className="stat-card">
                <div className="stat-icon purple"><Clock /></div>
                <div><small>Study hours</small><h2>4.0 hrs</h2><span>Daily target</span></div>
              </div>
              <div className="stat-card">
                <div className="stat-icon green"><CheckSquare /></div>
                <div><small>Tasks completed</small><h2>{completed.length}/{tasks.length}</h2><span>Today's progress</span></div>
              </div>
              <div className="stat-card">
                <div className="stat-icon orange"><Flame /></div>
                <div><small>Daily progress</small><h2>{progress}%</h2><span>Keep going!</span></div>
              </div>
              <div className="stat-card">
                <div className="stat-icon blue"><Target /></div>
                <div><small>Weekly goal</small><h2>20 hrs</h2><span>Study target</span></div>
              </div>
            </section>

            <section className="content-grid">
              <div className="panel schedule-panel">
                <div className="panel-header">
                  <div>
                    <h3>Today's Schedule</h3>
                    <p>Your planned activities</p>
                  </div>
                  <button className="add-button" onClick={() => setShowAddTask(true)}><Plus size={17} /> Add task</button>
                </div>

                <div className="day-selector">
                  <button onClick={() => setDay(days[Math.max(0, days.indexOf(day) - 1)])}><ChevronLeft /></button>
                  <strong>{day}</strong>
                  <button onClick={() => setDay(days[Math.min(6, days.indexOf(day) + 1)])}><ChevronRight /></button>
                </div>

                <div className="task-list">
                  {tasks.map((task) => {

                    const Icon = task.subject?.toLowerCase().includes("programming")
                      ? Code
                      : task.subject?.toLowerCase().includes("computer science")
                        ? GraduationCap
                        : BookOpen;
                    const done = completed.includes(task.id);
                    return (
                      <div className={`task-row ${done ? "done" : ""}`} key={task.id}>
                        <div className="task-time">{task.time.split(" - ")[0]}</div>
                        <div className="task-icon"><Icon size={19} /></div>
                        <div className="task-details">
                          <strong>{task.title}</strong>
                          <button
                            type="button"
                            className="delete-task"
                            onClick={() => deleteTask(task.id)}
                            title="Delete task"
                          >
                            ×
                          </button>
                          <span className={`priority-badge ${task.priority?.toLowerCase() || "medium"}`}>
                            {task.priority || "Medium"}
                          </span>
                          <small>{task.subject}</small>
                          <small className="task-end"><Clock size={12} /> {task.time}</small>
                        </div>
                        <button className={`check-button ${done ? "checked" : ""}`} onClick={() => toggleTask(task.id)}>
                          {done ? "✓" : ""}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="right-column">
                <div className="panel progress-panel">
                  <div className="panel-header">
                    <div><h3>Daily Progress</h3><p>Your productivity</p></div>
                    <Target size={20} />
                  </div>
                  <div className="progress-circle" style={{ "--progress": `${progress}%` }}>
                    <div><strong>{progress}%</strong><small>Completed</small></div>
                  </div>
                  <p className="progress-caption">{completed.length} of {tasks.length} tasks completed</p>
                </div>

                <div className="ai-card">
                  <div className="ai-heading"><Sparkles size={20} /> AI Assistant</div>
                  <h3>Let AI organize your day.</h3>
                  <p>Generate an intelligent timetable based on your goals and availability.</p>
                  <button onClick={() => setActivePage("AI Assistant")}>Generate timetable <ChevronRight size={17} /></button>
                </div>

                <div className="panel break-panel">
                  <Coffee size={20} />
                  <div><strong>Remember to take breaks!</strong><small>Rest is part of productivity.</small></div>
                </div>
              </div>
            </section>
          </>
        )}

        {activePage === "My Timetable" && (
          <section className="panel my-timetable-page">

            <div className="panel-header">
              <div>
                <h3>Weekly Timetable</h3>
                <p>View your planned activities by day</p>
              </div>
            </div>

            <div className="week-selector">

              {days.map((d) => (
                <button
                  key={d}
                  className={day === d ? "selected-day" : ""}
                  onClick={() => setDay(d)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();

                    const taskId = Number(
                      e.dataTransfer.getData("taskId")
                    );

                    setTasks((prev) =>
                      prev.map((task) =>
                        task.id === taskId
                          ? { ...task, day: d }
                          : task
                      )
                    );
                  }}
                >
                  {d.slice(0, 3)}
                </button>
              ))}

            </div>

            <h3>{day}'s Schedule</h3>

            <div className="all-tasks-list">
              {tasks
                .filter((task) => (task.day || "Monday") === day)
                .map((task) => (
                  <div
                    className="all-task-item"
                    key={task.id}
                    draggable={true}
                    onDragStart={(e) => {
                      e.dataTransfer.setData("taskId", String(task.id));
                    }}
                  >
                    <div>
                      <strong>{task.title}</strong>
                      <small>{task.subject}</small>
                      <small>{task.time}</small>
                      <span className="priority-badge">
                        {task.priority || "Medium"}
                      </span>
                    </div>

                    <button
                      className="delete-task"
                      onClick={() => deleteTask(task.id)}
                    >
                      ×
                    </button>
                  </div>
                ))}

              {tasks.filter(
                (task) => (task.day || "Monday") === day
              ).length === 0 && (
                  <p className="empty-tasks">
                    No tasks planned for {day}.
                  </p>
                )}
            </div>

            <button
              className="add-button"
              onClick={() => setShowAddTask(true)}
            >
              <Plus size={17} /> Add task
            </button>

          </section>
        )}

        {activePage === "AI Assistant" && (
          <section className="panel ai-chat-page">

            <div className="panel-header">
              <div>
                <h3><Sparkles size={20} /> Smart AI Assistant</h3>
                <p>Your personal study planning assistant</p>
              </div>
            </div>

            <div className="chat-messages">

              {chatMessages.map((message, index) => (
                <div
                  key={index}
                  className={`chat-message ${message.role}`}
                >
                  <strong>
                    {message.role === "assistant" ? "AI Assistant" : "You"}
                  </strong>

                  <div className="message-content">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {message.text}
                    </ReactMarkdown>
                  </div>
                </div>
              ))}

            </div>
            <div className="chat-suggestions">

              <div className="timetable-generator">
                <h3>AI Schedule Generator</h3>
                <p>Organize your studies, work, learning goals and daily activities with AI.</p>

                <button
                  type="button"
                  className="add-button"
                  onClick={() => setShowTimetableForm(!showTimetableForm)}
                >
                  {showTimetableForm ? "Close Form" : "Create My Schedule"}
                </button>

                {showTimetableForm && (
                  <form
                    className="timetable-form"

                    onSubmit={async (e) => {
                      e.preventDefault();

                      const prompt = `Create a ${studentDetails.duration}-day schedule.

Tasks, subjects or goals: ${studentDetails.subjects}.

Available hours per day: ${studentDetails.studyHours || "Choose suitable hours"}.

Preferred working time: ${studentDetails.preferredTime || "No preference"}.

Important deadlines or events: ${studentDetails.examDetails || "None specified"}.

Create a practical schedule with days, start times, end times and breaks.`;

                      try {
                        const response = await fetch(
                          "http://127.0.0.1:8000/generate-timetable",
                          {
                            method: "POST",
                            headers: {
                              "Content-Type": "application/json"
                            },
                            body: JSON.stringify({ message: prompt })
                          }
                        );

                        if (!response.ok) {
                          throw new Error("Schedule generation failed");
                        }

                        const data = await response.json();

                        const newTasks = data.tasks.map((task, index) => ({
                          id: Date.now() + index,
                          title: task.title,
                          subject: task.subject,
                          time: `${task.start} - ${task.end}`,
                          priority: task.priority,
                          day: task.day
                        }));

                        setTasks((prev) => [...prev, ...newTasks]);

                        setShowTimetableForm(false);
                        setActivePage("My Timetable");

                      } catch (error) {
                        console.error("Schedule generation error:", error);
                        alert("Unable to generate your schedule. Please try again.");
                      }
                    }}

                  >
                    <label>What do you want to organize?</label>
                    <textarea
                      placeholder="Example: Java, assignments, office work, online courses, personal tasks..."
                      value={studentDetails.subjects}
                      onChange={(e) =>
                        setStudentDetails({
                          ...studentDetails,
                          subjects: e.target.value
                        })
                      }
                      required
                    />

                    <label>Available hours per day</label>
                    <select
                      value={studentDetails.studyHours}
                      onChange={(e) =>
                        setStudentDetails({
                          ...studentDetails,
                          studyHours: e.target.value
                        })
                      }
                    >
                      <option value="">Let AI decide</option>
                      <option value="2">2 hours</option>
                      <option value="3">3 hours</option>
                      <option value="4">4 hours</option>
                      <option value="5">5 hours</option>
                      <option value="6">6 hours</option>
                      <option value="8">8 hours</option>
                    </select>

                    <label>Preferred working time</label>
                    <select
                      value={studentDetails.preferredTime}
                      onChange={(e) =>
                        setStudentDetails({
                          ...studentDetails,
                          preferredTime: e.target.value
                        })
                      }
                    >
                      <option value="">No preference</option>
                      <option>Morning</option>
                      <option>Afternoon</option>
                      <option>Evening</option>
                      <option>Flexible</option>
                    </select>

                    <label>Schedule duration</label>
                    <select
                      value={studentDetails.duration}
                      onChange={(e) =>
                        setStudentDetails({
                          ...studentDetails,
                          duration: e.target.value
                        })
                      }
                    >
                      <option value="1">1 day</option>
                      <option value="7">7 days</option>
                      <option value="14">14 days</option>
                      <option value="30">30 days</option>
                    </select>

                    <label>Important deadlines or events (optional)</label>
                    <textarea
                      placeholder="Example: Project submission on Friday, exam next week..."
                      value={studentDetails.examDetails}
                      onChange={(e) =>
                        setStudentDetails({
                          ...studentDetails,
                          examDetails: e.target.value
                        })
                      }
                    />

                    <button type="submit" className="submit-task">
                      Generate My Schedule
                    </button>
                  </form>
                )}
              </div>

            </div>

            <div className="chat-suggestions">
              <button onClick={() => setChatInput("Create a 4-hour daily study plan")}>
                Create a study plan
              </button>

              <button onClick={() => setChatInput("Help me prepare for my exams")}>
                Exam preparation
              </button>
            </div>

            <form
              className="chat-input-area"
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage();
              }}
            >
              <input
                type="text"
                placeholder="Ask me to organize your study schedule..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
              />

              <button type="submit">
                <Sparkles size={18} /> Send
              </button>
            </form>

            <p className="chat-note">
              Preview mode: real AI integration is coming next.
            </p>

          </section>
        )}

        {activePage === "My Tasks" && (
          <section className="panel my-tasks-page">
            <div className="panel-header">
              <div>
                <h3>All My Tasks</h3>
                <p>Manage your activities and priorities</p>
              </div>
              <button
                className="add-button"
                onClick={() => setShowAddTask(true)}
              >
                <Plus size={17} /> Add Task
              </button>
            </div>

            <input
              className="task-search"
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <select
              className="task-filter"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="All">All Priorities</option>
              <option value="High">High Priority</option>
              <option value="Medium">Medium Priority</option>
              <option value="Low">Low Priority</option>
            </select>

            <div className="all-tasks-list">
              {tasks
                .filter((task) =>
                  task.title.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .filter((task) =>
                  priorityFilter === "All" ||
                  (task.priority || "Medium") === priorityFilter
                )
                .map((task) => {
                  const done = completed.includes(task.id);

                  return (
                    <div className="all-task-item" key={task.id}>
                      <div>
                        <strong>{task.title}</strong>
                        <small>{task.subject}</small>
                        <small>{task.time}</small>
                        <span className={`priority-badge ${(task.priority || "Medium").toLowerCase()}`}>
                          {task.priority || "Medium"}
                        </span>
                      </div>

                      <div className="task-actions">
                        <button
                          type="button"
                          onClick={() => toggleTask(task.id)}
                        >
                          {done ? "Undo" : "Complete"}
                        </button>

                        <button
                          type="button"
                          onClick={() => deleteTask(task.id)}
                          className="delete-task"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  );
                })}

              {tasks.filter((task) =>
                task.title.toLowerCase().includes(searchTerm.toLowerCase())
              ).filter((task) =>
                priorityFilter === "All" ||
                (task.priority || "Medium") === priorityFilter
              ).length === 0 && (
                  <p className="empty-tasks">No matching tasks found.</p>
                )}
            </div>
          </section>
        )}

        {showAddTask && (
          <div className="modal-overlay">
            <div className="task-modal">
              <div className="modal-header">
                <div>
                  <h2>Add New Task</h2>
                  <p>Enter your activity details</p>
                </div>
                <button
                  className="close-button"
                  onClick={() => setShowAddTask(false)}
                >
                  ×
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  addTask();
                }}
              >
                <label>Task Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Java DSA Practice"
                  value={newTask.title}
                  onChange={(e) =>
                    setNewTask({ ...newTask, title: e.target.value })
                  }
                  required
                />

                <label>Subject / Category</label>
                <input
                  type="text"
                  placeholder="e.g. Programming"
                  value={newTask.subject}
                  onChange={(e) =>
                    setNewTask({ ...newTask, subject: e.target.value })
                  }
                />

                <div className="time-inputs">
                  <div>
                    <label>Start Time *</label>
                    <input
                      type="time"
                      value={newTask.start}
                      onChange={(e) =>
                        setNewTask({ ...newTask, start: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div>
                    <label>End Time *</label>
                    <input
                      type="time"
                      value={newTask.end}
                      onChange={(e) =>
                        setNewTask({ ...newTask, end: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <label>Priority</label>
                <select
                  value={newTask.priority}
                  onChange={(e) =>
                    setNewTask({ ...newTask, priority: e.target.value })
                  }
                >
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                </select>

                <button type="submit" className="submit-task">
                  <Plus size={17} /> Add Task
                </button>
              </form>
            </div>
          </div>
        )}
      </main>

    </div>
  );
}

export default App;
