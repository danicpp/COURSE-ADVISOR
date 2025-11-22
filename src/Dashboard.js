import React, { useState, useEffect } from 'react';
import './Dashboard.css';

// --- LOGIN SCREEN ---
const LoginScreen = ({ onLogin }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
        const res = await fetch('http://127.0.0.1:5000/api/login', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (data.success) {
            onLogin(data.role, data.profile || { full_name: data.username, roll_number: data.username });
        } else { setError(data.message); }
    } catch (err) { setError("Is Backend running?"); }
    setLoading(false);
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <div style={{fontSize: '3rem', marginBottom: '10px'}}>🎓</div>
        <h2>University Portal</h2>
        <input placeholder="Roll No / Admin" onChange={e => setUsername(e.target.value)} />
        <input type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} />
        <button className="btn-primary" onClick={handleLogin} disabled={loading}>Login</button>
        {error && <p style={{color:'red', marginTop:'10px'}}>{error}</p>}
      </div>
    </div>
  );
};

// --- ADMIN DASHBOARD ---
const AdminDashboard = ({ onLogout }) => {
  const [view, setView] = useState('students'); // 'students', 'courses', 'registrations'
  const [students, setStudents] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [form, setForm] = useState({ roll_number: '', full_name: '', father_name: '', gpa: 3.0, cgpa: 3.0, current_semester: 1 });
  const [msg, setMsg] = useState("");

  useEffect(() => {
      if (view === 'students') fetchStudents();
      if (view === 'registrations') fetchRegistrations();
  }, [view]);

  const fetchStudents = () => fetch('http://127.0.0.1:5000/api/admin/students').then(r=>r.json()).then(setStudents);
  const fetchRegistrations = () => fetch('http://127.0.0.1:5000/api/admin/registrations').then(r=>r.json()).then(setRegistrations);

  const addStudent = async () => {
      const res = await fetch('http://127.0.0.1:5000/api/admin/add-student', {
          method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(form)
      });
      const data = await res.json();
      if (data.success) { setMsg("Student Added"); fetchStudents(); } else setMsg("Error");
  };

  const deleteStudent = async (roll) => {
      await fetch('http://127.0.0.1:5000/api/admin/delete-student', {
          method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({roll_number: roll})
      });
      fetchStudents();
  };

  return (
    <div className="app-container">
        <aside className="sidebar">
            <h1>🛠️ Admin</h1>
            <button className={view==='students'?'btn-primary':'btn-logout'} onClick={()=>setView('students')}>Manage Students</button>
            <button className={view==='registrations'?'btn-primary':'btn-logout'} style={{marginTop:'10px'}} onClick={()=>setView('registrations')}>View Registrations</button>
            <button className="btn-logout" onClick={onLogout} style={{marginTop:'auto'}}>Sign Out</button>
        </aside>
        <main className="main-content">
            {view === 'students' && (
                <>
                    <h2>Manage Students</h2>
                    <div className="admin-panel" style={{marginBottom:'20px'}}>
                        <h3>Add New Student</h3>
                        <input placeholder="Roll No" onChange={e=>setForm({...form, roll_number:e.target.value})} style={{marginRight:'10px', padding:'5px'}}/>
                        <input placeholder="Name" onChange={e=>setForm({...form, full_name:e.target.value})} style={{marginRight:'10px', padding:'5px'}}/>
                        <button className="btn-primary" onClick={addStudent}>Add</button>
                        {msg && <p>{msg}</p>}
                    </div>
                    <div className="course-grid">
                        {students.map(s => (
                            <div key={s.roll_number} className="course-card available">
                                <h3>{s.full_name}</h3>
                                <p>{s.roll_number}</p>
                                <button onClick={()=>deleteStudent(s.roll_number)} style={{color:'red', background:'none', border:'none', cursor:'pointer'}}>🗑 Remove</button>
                            </div>
                        ))}
                    </div>
                </>
            )}
            {view === 'registrations' && (
                <>
                    <h2>Student Registrations</h2>
                    <table style={{width:'100%', background:'white', borderRadius:'10px', padding:'10px'}}>
                        <thead><tr style={{textAlign:'left'}}><th>Roll No</th><th>Course</th><th>Semester</th><th>Status</th></tr></thead>
                        <tbody>
                            {registrations.map((r, i) => (
                                <tr key={i} style={{borderBottom:'1px solid #eee'}}>
                                    <td style={{padding:'10px'}}>{r.roll_number}</td>
                                    <td>{r.course_name}</td>
                                    <td>{r.semester_label}</td>
                                    <td style={{color:'green', fontWeight:'bold'}}>{r.status}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </>
            )}
        </main>
    </div>
  );
};

// --- STUDENT DASHBOARD ---
const StudentDashboard = ({ profile, onLogout }) => {
  const [view, setView] = useState('planner'); 
  const [catalog, setCatalog] = useState([]); 
  const [schedule, setSchedule] = useState([]); 
  const [roadmap, setRoadmap] = useState([]); 
  const [error, setError] = useState("");
  
  const passedCourses = ["CMPC-5201", "CMPC-5204"]; 

  useEffect(() => { fetch('http://127.0.0.1:5000/api/courses').then(r => r.json()).then(setCatalog); }, []);

  const generateRoadmap = async () => {
    const res = await fetch('http://127.0.0.1:5000/api/generate-path', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: profile.roll_number, passed_courses: passedCourses, current_schedule: schedule })
    });
    setRoadmap(await res.json());
    setView('roadmap');
  };

  const addToSchedule = (course) => {
    const currentCredits = schedule.reduce((acc, c) => acc + c.credits, 0);
    if (currentCredits + course.credits > 18) { setError(`Limit Reached!`); return; }
    if (!schedule.find(c => c.id === course.id)) setSchedule([...schedule, course]);
  };

  const submitRegistration = async () => {
      await fetch('http://127.0.0.1:5000/api/student/register', {
          method: 'POST', headers: {'Content-Type':'application/json'},
          body: JSON.stringify({ username: profile.roll_number, courses: schedule.map(c=>c.id), semester_label: 'Current Selection' })
      });
      setView('success');
  };

  const acceptAIPlan = async (semesterData) => {
      await fetch('http://127.0.0.1:5000/api/student/register', {
          method: 'POST', headers: {'Content-Type':'application/json'},
          body: JSON.stringify({ username: profile.roll_number, courses: semesterData.courses.map(c=>c.course_id), semester_label: `AI Sem ${semesterData.semester}` })
      });
      alert(`Plan for Semester ${semesterData.semester} Accepted!`);
  };

  const totalCredits = schedule.reduce((acc, c) => acc + c.credits, 0);

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div><h1>🎓 {profile.full_name}</h1><p>{profile.roll_number}</p></div>
        <div style={{fontSize:'1.5rem', fontWeight:'bold', margin:'20px 0'}}>{totalCredits} / 18</div>
        <button className={view==='planner'?'btn-primary':'btn-logout'} onClick={()=>setView('planner')}>📅 Planner</button>
        <button className={view==='roadmap'?'btn-primary':'btn-logout'} style={{marginTop:'10px'}} onClick={generateRoadmap}>🚀 Roadmap</button>
        <button className="btn-logout" style={{marginTop:'auto'}} onClick={onLogout}>Sign Out</button>
      </aside>

      <main className="main-content">
        {error && <div className="toast-notification">⚠️ {error} <button onClick={()=>setError("")} style={{background:'none', border:'none'}}>×</button></div>}

        {view === 'success' && (
            <div style={{textAlign:'center', padding:'50px'}}>
                <h1 style={{fontSize:'4rem'}}>🎉</h1>
                <h2>Registration Successful!</h2>
                <p>Your course selection has been submitted to the Admin.</p>
                <button className="btn-primary" onClick={()=>setView('planner')}>Back to Home</button>
            </div>
        )}

        {view === 'planner' && (
            <>
                <h2>My Plan</h2>
                {schedule.length > 0 && totalCredits >= 18 && (
                    <div style={{background:'#ecfdf5', padding:'20px', borderRadius:'10px', marginBottom:'20px', textAlign:'center'}}>
                        <h3>✅ Semester Full</h3>
                        <p>You have reached 18 credits.</p>
                        <button className="btn-success" style={{fontSize:'1.2rem', padding:'10px 30px'}} onClick={submitRegistration}>Confirm Registration</button>
                    </div>
                )}
                <div className="schedule-list-container">
                    {schedule.map(c => (
                        <div key={c.id} className="schedule-item" style={{borderLeft:'5px solid #10b981'}}>
                            <b>{c.name}</b> <button onClick={()=>setSchedule(schedule.filter(s=>s.id!==c.id))} style={{color:'red', border:'none'}}>×</button>
                        </div>
                    ))}
                </div>
                <h2>Catalog</h2>
                <div className="course-grid">
                    {catalog.map(c => (
                        <div key={c.id} className="course-card available">
                            <h3>{c.name}</h3>
                            <button onClick={()=>addToSchedule(c)}>+ Add</button>
                        </div>
                    ))}
                </div>
            </>
        )}

        {view === 'roadmap' && (
            <>
                <h2>🤖 AI Roadmap</h2>
                <div style={{display: 'grid', gap: '25px'}}>
                    {roadmap.map((sem, index) => (
                        <div key={index} style={{background:'white', padding:'25px', borderRadius:'12px', boxShadow:'var(--shadow)', borderLeft:'6px solid var(--primary)'}}>
                            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                                <h3>Semester {sem.semester}</h3>
                                <button className="btn-primary" style={{padding:'5px 15px', fontSize:'0.8rem'}} onClick={()=>acceptAIPlan(sem)}>✓ Accept This Plan</button>
                            </div>
                            <div style={{background:'#eff6ff', padding:'10px', borderRadius:'5px', margin:'10px 0'}}>💡 {sem.reason}</div>
                            <div style={{display:'flex', flexWrap:'wrap', gap:'10px'}}>
                                {sem.courses.map(c => <div key={c.course_id} style={{background:'#f3f4f6', padding:'5px 10px', borderRadius:'15px'}}>{c.course_name}</div>)}
                            </div>
                        </div>
                    ))}
                </div>
            </>
        )}
      </main>
    </div>
  );
};

const CourseAdvisorDashboard = () => {
  const [userRole, setUserRole] = useState(null);
  const [profile, setProfile] = useState({}); 
  if (!userRole) return <LoginScreen onLogin={(role, data) => { setUserRole(role); setProfile(data); }} />;
  if (userRole === 'admin') return <AdminDashboard onLogout={() => setUserRole(null)} />;
  return <StudentDashboard profile={profile} onLogout={() => setUserRole(null)} />;
};

export default CourseAdvisorDashboard;