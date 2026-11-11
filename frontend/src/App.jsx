
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
  const [showTimetableForm, setShowTimetableForm] = useState(false);

  const [newTask, setNewTask] = useState({
    title: "",
    subject: "",
    start: "",
    end: "",
    date: "",
    priority: "Medium"
  });

  const [completed, setCompleted] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("smartScheduleCompleted") || "[]");
    } catch {
      return [];
    }
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("All");

  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const [selectedDate, setSelectedDate] = useState(() =>
    formatDate(new Date())
  );

  const [currentMonth, setCurrentMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );

  const [day, setDay] = useState(() =>
    new Date().toLocaleDateString("en-US", { weekday: "long" })
  );

  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);

  const [studentDetails, setStudentDetails] = useState({
    subjects: "",
    studyHours: "",
    preferredTime: "Flexible",
    duration: "7",
    startDate: "",
    endDate: "",
    examDetails: ""
  });

  const [chatMessages, setChatMessages] = useState(() => {
    try {
      const saved = localStorage.getItem("smartScheduleChat");
      return saved ? JSON.parse(saved) : [{
        role: "assistant",
        text: "Hi! I'm your SmartSchedule AI assistant. Tell me about your tasks, goals or plans, and I'll help you organize your time."
      }];
    } catch {
      return [{
        role: "assistant",
        text: "Hi! I'm your SmartSchedule AI assistant. Tell me about your tasks, goals or plans, and I'll help you organize your time."
      }];
    }
  });

  const days = [
    "Monday", "Tuesday", "Wednesday", "Thursday",
    "Friday", "Saturday", "Sunday"
  ];

  const defaultTasks = [
    { id: 1, title: "Java DSA Practice", subject: "Programming", time: "09:00 AM - 10:00 AM", day: "Monday", priority: "High" },
    { id: 2, title: "Web Development", subject: "Development", time: "10:30 AM - 11:30 AM", day: "Tuesday", priority: "Medium" },
    { id: 3, title: "Operating Systems", subject: "Computer Science", time: "02:00 PM - 03:00 PM", day: "Wednesday", priority: "High" },
    { id: 4, title: "Computer Networks", subject: "Computer Science", time: "04:00 PM - 05:00 PM", day: "Thursday", priority: "Medium" }
  ];

  const [tasks, setTasks] = useState(() => {
    try {
      const saved = localStorage.getItem("smartScheduleTasks");
      return saved ? JSON.parse(saved) : defaultTasks;
    } catch {
      return defaultTasks;
    }
  });

  useEffect(() => {
    localStorage.setItem("smartScheduleTasks", JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem("smartScheduleCompleted", JSON.stringify(completed));
  }, [completed]);

  useEffect(() => {
    localStorage.setItem("smartScheduleChat", JSON.stringify(chatMessages));
  }, [chatMessages]);

  // Migrate old tasks that do not have dates.
  useEffect(() => {
    const today = new Date(selectedDate + "T00:00:00");
    const dayOfWeek = today.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);

    setTasks((previousTasks) =>
      previousTasks.map((task) => {
        if (task.date) return task;

        const dayIndex = days.indexOf(task.day);
        if (dayIndex === -1) return task;

        const taskDate = new Date(monday);
        taskDate.setDate(monday.getDate() + dayIndex);

        return { ...task, date: formatDate(taskDate) };
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const changeMonth = (amount) => {
    setCurrentMonth((previous) =>
      new Date(
        previous.getFullYear(),
        previous.getMonth() + amount,
        1
      )
    );
  };

  const firstDayOfMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1
  );

  const daysInMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0
  ).getDate();

  const startingDay = (firstDayOfMonth.getDay() + 6) % 7;

  const calendarCells = [
    ...Array(startingDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1)
  ];

  const selectedDateTasks = tasks
    .filter((task) => task.date === selectedDate)
    .sort((a, b) => a.time.localeCompare(b.time));

  const filteredTasks = tasks
    .filter((task) =>
      task.title.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter((task) =>
      priorityFilter === "All" ||
      (task.priority || "Medium") === priorityFilter
    );

  const toggleTask = (id) => {
    setCompleted((previous) =>
      previous.includes(id)
        ? previous.filter((item) => item !== id)
        : [...previous, id]
    );
  };

  const deleteTask = (taskId) => {
    setTasks((previous) =>
      previous.filter((task) => task.id !== taskId)
    );
    setCompleted((previous) =>
      previous.filter((id) => id !== taskId)
    );
  };

  const selectDate = (dateString) => {
    setSelectedDate(dateString);
    setDay(
      new Date(dateString + "T00:00:00").toLocaleDateString(
        "en-US",
        { weekday: "long" }
      )
    );
  };

  const goToToday = () => {
    const today = new Date();
    const todayString = formatDate(today);

    selectDate(todayString);
    setCurrentMonth(
      new Date(today.getFullYear(), today.getMonth(), 1)
    );
  };

  const clearChat = () => {
    if (!window.confirm("Are you sure you want to clear your conversation?")) {
      return;
    }

    setChatMessages([{
      role: "assistant",
      text: "Hi! I'm your SmartSchedule AI assistant. Tell me about your tasks, goals or plans, and I'll help you organize your time."
    }]);
  };

  const sendMessage = async (messageText = chatInput) => {
    if (!messageText.trim()) return;

    const userMessage = messageText.trim();

    setChatMessages((previous) => [
      ...previous,
      { role: "user", text: userMessage }
    ]);

    setChatInput("");
    setIsChatLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          tasks,
          completed,
          history: chatMessages.slice(-10).map((message) => ({
            role: message.role,
            content: message.text
          }))
        })
      });

      if (!response.ok) throw new Error("Backend request failed");

      const data = await response.json();

      setChatMessages((previous) => [
        ...previous,
        { role: "assistant", text: data.reply }
      ]);
    } catch (error) {
      console.error("Chat error:", error);

      setChatMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          text: "Unable to connect to the backend. Please check whether the server is running."
        }
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const addTask = () => {
    if (!newTask.title || !newTask.start || !newTask.end) {
      alert("Please fill in all required fields");
      return;
    }

    const startMinutes =
      Number(newTask.start.split(":")[0]) * 60 +
      Number(newTask.start.split(":")[1]);

    const endMinutes =
      Number(newTask.end.split(":")[0]) * 60 +
      Number(newTask.end.split(":")[1]);

    if (endMinutes <= startMinutes) {
      alert("End time must be after start time");
      return;
    }

    const taskDate = newTask.date || selectedDate;

    const hasOverlap = tasks.some((task) => {
      if (task.date !== taskDate) return false;

      const [oldStart, oldEnd] = task.time.split(" - ");

      const oldStartParts = oldStart.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
      const oldEndParts = oldEnd.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);

      if (!oldStartParts || !oldEndParts) return false;

      const toMinutes = (parts) => {
        let hour = Number(parts[1]);
        const minute = Number(parts[2]);
        const meridiem = parts[3]?.toUpperCase();

        if (meridiem === "PM" && hour !== 12) hour += 12;
        if (meridiem === "AM" && hour === 12) hour = 0;

        return hour * 60 + minute;
      };

      return (
        startMinutes < toMinutes(oldEndParts) &&
        endMinutes > toMinutes(oldStartParts)
      );
    });

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
      date: taskDate,
      day: new Date(taskDate + "T00:00:00").toLocaleDateString(
        "en-US",
        { weekday: "long" }
      )
    };

    setTasks((previous) => [...previous, task]);

    setNewTask({
      title: "",
      subject: "",
      start: "",
      end: "",
      date: "",
      priority: "Medium"
    });

    setShowAddTask(false);
  };

  const generateTimetable = async (event) => {
    event.preventDefault();

    if (
      !studentDetails.startDate ||
      !studentDetails.endDate ||
      studentDetails.endDate < studentDetails.startDate
    ) {
      alert("Please select a valid start date and end date.");
      return;
    }

    const prompt = `Create a timetable ONLY between these dates:

Start Date: ${studentDetails.startDate}
End Date: ${studentDetails.endDate}

Tasks, subjects or goals: ${studentDetails.subjects}.
Available hours per day: ${studentDetails.studyHours || "Choose suitable hours"}.
Preferred working time: ${studentDetails.preferredTime || "No preference"}.
Important deadlines or events: ${studentDetails.examDetails || "None specified"}.

IMPORTANT RULES:
1. Generate tasks only between the specified start date and end date, including both dates.
2. Do not generate tasks outside this date range.
3. Include the actual calendar date (YYYY-MM-DD) for every task.
4. Distribute tasks across the selected date range.
5. Include start time, end time, title, subject and priority for every task.
6. Return tasks in JSON format.`;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/generate-timetable`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: prompt })
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Schedule generation failed");
      }

      const data = await response.json();

      const newTasks = (data.tasks || [])
        .filter((task) => {
          return (
            task.title &&
            task.start &&
            task.end &&
            task.date >= studentDetails.startDate &&
            task.date <= studentDetails.endDate
          );
        })
        .map((task, index) => ({
          id: Date.now() + index,
          title: task.title,
          subject: task.subject || "General",
          time: `${task.start} - ${task.end}`,
          priority: task.priority || "Medium",
          date: task.date,
          day: new Date(task.date + "T00:00:00").toLocaleDateString(
            "en-US",
            { weekday: "long" }
          )
        }));

      setTasks((previous) => [...previous, ...newTasks]);

      selectDate(studentDetails.startDate);
      setCurrentMonth(
        new Date(studentDetails.startDate + "T00:00:00")
      );

      setShowTimetableForm(false);
      setActivePage("My Timetable");

      if (newTasks.length === 0) {
        alert("The AI returned no valid tasks in the selected date range. Please try again.");
      }
    } catch (error) {
      console.error("Schedule generation error:", error);
      alert(error.message || "Unable to generate your schedule. Please try again.");
    }
  };

  const progress = tasks.length
    ? Math.round((completed.filter((id) => tasks.some((task) => task.id === id)).length / tasks.length) * 100)
    : 0;

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

          <button className="date-button" onClick={goToToday}>
            <CalendarDays size={17} /> Today
          </button>
        </header>

        {activePage === "Dashboard" && (
          <>
            <section className="welcome">
              <div>
                <span className="welcome-tag">
                  <Sparkles size={15} /> YOUR PERSONAL AI PLANNER
                </span>
                <h1>Make today <span>count.</span></h1>
                <p>Organize your time, focus on your goals and make every hour productive.</p>
              </div>
              <div className="welcome-art"><BrainCircuit size={85} /></div>
            </section>

            <section className="stats">
              <div className="stat-card">
                <div className="stat-icon purple"><Clock /></div>
                <div>
                  <small>Scheduled hours</small>
                  <h2>My Schedule</h2>
                  <span>Manage your daily activities</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon green"><CheckSquare /></div>
                <div>
                  <small>Tasks completed</small>
                  <h2>{completed.filter((id) => tasks.some((task) => task.id === id)).length}/{tasks.length}</h2>
                  <span>Overall progress</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon orange"><Flame /></div>
                <div>
                  <small>Daily progress</small>
                  <h2>{progress}%</h2>
                  <span>Keep going!</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon blue"><Target /></div>
                <div>
                  <small>Total tasks</small>
                  <h2>{tasks.length}</h2>
                  <span>Across your schedule</span>
                </div>
              </div>
            </section>

            <section className="content-grid">
              <div className="panel schedule-panel">
                <div className="panel-header">
                  <div>
                    <h3>Today's Schedule</h3>
                    <p>Your planned activities</p>
                  </div>
                  <button className="add-button" onClick={() => setShowAddTask(true)}>
                    <Plus size={17} /> Add task
                  </button>
                </div>

                <div className="day-selector">
                  <button onClick={() => setDay(days[Math.max(0, days.indexOf(day) - 1)])}>
                    <ChevronLeft />
                  </button>
                  <strong>{day}</strong>
                  <button onClick={() => setDay(days[Math.min(6, days.indexOf(day) + 1)])}>
                    <ChevronRight />
                  </button>
                </div>

                <div className="task-list">
                  {tasks.filter((task) => task.day === day).map((task) => {
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
                          >
                            ×
                          </button>
                          <span className={`priority-badge ${(task.priority || "Medium").toLowerCase()}`}>
                            {task.priority || "Medium"}
                          </span>
                          <small>{task.subject}</small>
                          <small className="task-end">
                            <Clock size={12} /> {task.time}
                          </small>
                        </div>
                        <button
                          className={`check-button ${done ? "checked" : ""}`}
                          onClick={() => toggleTask(task.id)}
                        >
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
                    <div>
                      <h3>Daily Progress</h3>
                      <p>Your productivity</p>
                    </div>
                    <Target size={20} />
                  </div>
                  <div className="progress-circle" style={{ "--progress": `${progress}%` }}>
                    <div><strong>{progress}%</strong><small>Completed</small></div>
                  </div>
                  <p className="progress-caption">
                    {completed.length} of {tasks.length} tasks completed
                  </p>
                </div>

                <div className="ai-card">
                  <div className="ai-heading"><Sparkles size={20} /> AI Assistant</div>
                  <h3>Let AI organize your day.</h3>
                  <p>Generate an intelligent timetable based on your goals and availability.</p>
                  <button onClick={() => setActivePage("AI Assistant")}>
                    Generate timetable <ChevronRight size={17} />
                  </button>
                </div>

                <div className="panel break-panel">
                  <Coffee size={20} />
                  <div>
                    <strong>Remember to take breaks!</strong>
                    <small>Rest is part of productivity.</small>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}

        {activePage === "My Timetable" && (
          <section className="panel my-timetable-page">

            <div className="calendar-container">
              <div className="calendar-header">
                <button onClick={() => changeMonth(-1)}>
                  <ChevronLeft size={20} />
                </button>

                <h2>
                  {currentMonth.toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric"
                  })}
                </h2>

                <button onClick={() => changeMonth(1)}>
                  <ChevronRight size={20} />
                </button>
              </div>

              <div className="calendar-grid">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((name) => (
                  <div className="calendar-day-name" key={name}>
                    {name}
                  </div>
                ))}

                {calendarCells.map((date, index) => {
                  if (date === null) {
                    return <div key={`empty-${index}`} />;
                  }

                  const cellDate = formatDate(
                    new Date(
                      currentMonth.getFullYear(),
                      currentMonth.getMonth(),
                      date
                    )
                  );

                  const hasTasks = tasks.some((task) => task.date === cellDate);

                  return (
                    <button
                      key={cellDate}
                      className={`calendar-date ${selectedDate === cellDate ? "selected" : ""}`}
                      onClick={() => selectDate(cellDate)}
                    >
                      {date}
                      {hasTasks && <span className="calendar-dot" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="panel-header">
              <div>
                <h3>Daily Timetable</h3>
                <p>Your planned activities for the selected date</p>
              </div>
              <button className="add-button" onClick={() => setShowAddTask(true)}>
                <Plus size={17} /> Add task
              </button>
            </div>

            <h3 className="selected-date-heading">
              {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric"
              })}
            </h3>

            <div className="timetable-table-wrapper">
              {selectedDateTasks.length > 0 ? (
                <table className="timetable-table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Task</th>
                      <th>Category</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {selectedDateTasks.map((task) => {
                      const done = completed.includes(task.id);

                      return (
                        <tr key={task.id}>
                          <td>{task.time}</td>
                          <td>{task.title}</td>
                          <td>{task.subject || "General"}</td>
                          <td>
                            <span className={`priority-badge ${(task.priority || "Medium").toLowerCase()}`}>
                              {task.priority || "Medium"}
                            </span>
                          </td>
                          <td>
                            <button
                              className={`check-button ${done ? "checked" : ""}`}
                              onClick={() => toggleTask(task.id)}
                            >
                              {done ? "Completed" : "Pending"}
                            </button>
                          </td>
                          <td>
                            <button
                              className="delete-task"
                              onClick={() => deleteTask(task.id)}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <p className="empty-tasks">No tasks planned for this date.</p>
              )}
            </div>
          </section>
        )}

        {activePage === "AI Assistant" && (
          <section className="panel ai-chat-page">
            <div className="panel-header">
              <div>
                <h3><Sparkles size={20} /> Smart AI Assistant</h3>
                <p>Your personal planning assistant</p>
              </div>
              <button
                className="add-button"
                onClick={clearChat}
                disabled={isChatLoading}
              >
                Clear Chat
              </button>
            </div>

            <div className="chat-messages">
              {chatMessages.map((message, index) => (
                <div key={index} className={`chat-message ${message.role}`}>
                  <div className="message-content">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {message.text}
                    </ReactMarkdown>
                  </div>
                </div>
              ))}

              {isChatLoading && (
                <div className="chat-message assistant">
                  <div className="message-content">
                    <p>AI is thinking...</p>
                  </div>
                </div>
              )}
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
                  <form className="timetable-form" onSubmit={generateTimetable}>
                    <label>What do you want to organize?</label>
                    <textarea
                      placeholder="Example: Java, assignments, office work, online courses, personal tasks..."
                      value={studentDetails.subjects}
                      onChange={(e) => setStudentDetails({
                        ...studentDetails,
                        subjects: e.target.value
                      })}
                      required
                    />

                    <label>Available hours per day</label>
                    <select
                      value={studentDetails.studyHours}
                      onChange={(e) => setStudentDetails({
                        ...studentDetails,
                        studyHours: e.target.value
                      })}
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
                      onChange={(e) => setStudentDetails({
                        ...studentDetails,
                        preferredTime: e.target.value
                      })}
                    >
                      <option value="">No preference</option>
                      <option>Morning</option>
                      <option>Afternoon</option>
                      <option>Evening</option>
                      <option>Flexible</option>
                    </select>

                    <label>Start Date *</label>
                    <input
                      type="date"
                      value={studentDetails.startDate}
                      onChange={(e) => setStudentDetails({
                        ...studentDetails,
                        startDate: e.target.value
                      })}
                      required
                    />

                    <label>End Date *</label>
                    <input
                      type="date"
                      value={studentDetails.endDate}
                      min={studentDetails.startDate}
                      onChange={(e) => setStudentDetails({
                        ...studentDetails,
                        endDate: e.target.value
                      })}
                      required
                    />

                    <label>Important deadlines or events (optional)</label>
                    <textarea
                      placeholder="Example: Project submission on Friday, exam next week..."
                      value={studentDetails.examDetails}
                      onChange={(e) => setStudentDetails({
                        ...studentDetails,
                        examDetails: e.target.value
                      })}
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
                placeholder="Ask me to organize your tasks, schedule or goals..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
              />
              <button type="submit" disabled={isChatLoading}>
                <Sparkles size={18} />
                {isChatLoading ? "Thinking..." : "Send"}
              </button>
            </form>

            <p className="chat-note">AI-powered assistance is active.</p>
          </section>
        )}

        {activePage === "My Tasks" && (
          <section className="panel my-tasks-page">
            <div className="panel-header">
              <div>
                <h3>All My Tasks</h3>
                <p>Manage your activities and priorities</p>
              </div>
              <button className="add-button" onClick={() => setShowAddTask(true)}>
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
              {filteredTasks.map((task) => {
                const done = completed.includes(task.id);

                return (
                  <div className="all-task-item" key={task.id}>
                    <div>
                      <strong>{task.title}</strong>
                      <small>{task.subject}</small>
                      <small>{task.time}</small>
                      {task.date && <small>{task.date}</small>}
                      <span className={`priority-badge ${(task.priority || "Medium").toLowerCase()}`}>
                        {task.priority || "Medium"}
                      </span>
                    </div>

                    <div className="task-actions">
                      <button type="button" onClick={() => toggleTask(task.id)}>
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

              {filteredTasks.length === 0 && (
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
                  onChange={(e) => setNewTask({
                    ...newTask,
                    title: e.target.value
                  })}
                  required
                />

                <label>Subject / Category</label>
                <input
                  type="text"
                  placeholder="e.g. Programming"
                  value={newTask.subject}
                  onChange={(e) => setNewTask({
                    ...newTask,
                    subject: e.target.value
                  })}
                />

                <label>Task Date *</label>
                <input
                  type="date"
                  value={newTask.date || selectedDate}
                  onChange={(e) => setNewTask({
                    ...newTask,
                    date: e.target.value
                  })}
                  required
                />

                <div className="time-inputs">
                  <div>
                    <label>Start Time *</label>
                    <input
                      type="time"
                      value={newTask.start}
                      onChange={(e) => setNewTask({
                        ...newTask,
                        start: e.target.value
                      })}
                      required
                    />
                  </div>
                  <div>
                    <label>End Time *</label>
                    <input
                      type="time"
                      value={newTask.end}
                      onChange={(e) => setNewTask({
                        ...newTask,
                        end: e.target.value
                      })}
                      required
                    />
                  </div>
                </div>

                <label>Priority</label>
                <select
                  value={newTask.priority}
                  onChange={(e) => setNewTask({
                    ...newTask,
                    priority: e.target.value
                  })}
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
