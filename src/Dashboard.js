import React, { useState, useEffect } from 'react';
import './Dashboard.css';

// --- HELPERS FOR UI ---
const getDifficultyColor = (level) => {
    if (level <= 2) return '#10b981'; // Green (Easy)
    if (level === 3) return '#f59e0b'; // Orange (Medium)
    return '#ef4444'; // Red (Hard)
};

const getCourseCategory = (id) => {
    if (id.startsWith('CMPC') || id.startsWith('CSDC')) return 'Core Computing';
    if (id.startsWith('CSDE') || id.startsWith('ITDC') || id.startsWith('SEDC') || id.startsWith('DSDC') || id.startsWith('AIDC')) return 'Domain Electives';
    return 'General & Math'; // URCA, URCQ, MATH, etc.
};

// --- SHARED: FOOTER COMPONENT ---
const Footer = () => (
    <footer className="app-footer">
        <p>
            Developed by <span className="developer-credits">Group 15 (Daniyal, Faisal, Maheen)</span> using Gemini AI
        </p>
        <p style={{fontSize:'0.7rem', marginTop:'5px'}}>© 2025 University of Sargodha. All Rights Reserved.</p>
    </footer>
);

// --- SHARED: SIDEBAR HEADER ---
const SidebarHeader = () => (
    <div className="brand-header">
        {/* Tries to load logo.png, falls back to emoji if missing */}
        <img src="/logo.png" alt="UoS Logo" style={{width:'80px', height:'auto', marginBottom:'10px'}} 
             onError={(e) => {e.target.onerror = null; e.target.style.display='none'; e.target.nextSibling.style.display='block'}} />
        <div style={{fontSize:'3rem', display:'none'}}>🏛️</div>
        <h3>University of Sargodha</h3>
        <p>CoursePath Advisor</p>
    </div>
);

// --- COMPONENT 1: LOGIN SCREEN ---
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
        <img src="/logo.png" alt="UOS Logo" style={{width:'100px', marginBottom:'15px'}} 
             onError={(e) => {e.target.onerror = null; e.target.style.display='none'; e.target.nextSibling.style.display='block'}} />
        <div style={{fontSize: '3rem', marginBottom: '10px', display:'none'}}>🏛️</div>
        
        <h4 style={{textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.9rem', color:'#6b7280', marginTop:0}}>University of Sargodha</h4>
        <h2 style={{color: 'var(--primary)', fontWeight:'800', marginBottom:'30px'}}>CoursePath Advisor</h2>
        
        <input placeholder="Roll No / Admin" onChange={e => setUsername(e.target.value)} />
        <input type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} />
        <button className="btn-primary" onClick={handleLogin} disabled={loading}>
            {loading ? "Authenticating..." : "Login to Portal"}
        </button>
        {error && <p style={{color:'red', background:'#fee2e2', padding:'10px', borderRadius:'5px', marginTop:'10px'}}>{error}</p>}
        
        <div style={{marginTop: '40px', borderTop: '1px solid #eee', paddingTop: '20px'}}>
            <p style={{fontSize: '0.8rem', color: '#6b7280'}}>
                Developed by <b>Group 15 (Daniyal, Faisal, Maheen)</b>
            </p>
        </div>
      </div>
    </div>
  );
};

// --- COMPONENT 2: ADMIN DASHBOARD ---
const AdminDashboard = ({ onLogout }) => {
  const [view, setView] = useState('students');
  const [students, setStudents] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [form, setForm] = useState({ roll_number: '', full_name: '', father_name: '', gpa: 3.0, cgpa: 3.0, current_semester: 1 });
  const [msg, setMsg] = useState("");

  useEffect(() => {
      if (view === 'students') fetch('http://127.0.0.1:5000/api/admin/students').then(r=>r.json()).then(setStudents);
      if (view === 'registrations') fetch('http://127.0.0.1:5000/api/admin/registrations').then(r=>r.json()).then(setRegistrations);
  }, [view]);

  const addStudent = async () => {
      const res = await fetch('http://127.0.0.1:5000/api/admin/add-student', {
          method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(form)
      });
      const data = await res.json();
      if (data.success) { setMsg("Student Added"); fetch('http://127.0.0.1:5000/api/admin/students').then(r=>r.json()).then(setStudents); } 
      else setMsg("Error");
  };

  const deleteStudent = async (roll) => {
      if(!window.confirm("Are you sure you want to delete this student?")) return;
      await fetch('http://127.0.0.1:5000/api/admin/delete-student', {
          method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({roll_number: roll})
      });
      fetch('http://127.0.0.1:5000/api/admin/students').then(r=>r.json()).then(setStudents);
  };

  const filteredStudents = students.filter(s => 
      s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      s.roll_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const studentsBySemester = filteredStudents.reduce((acc, student) => {
      const sem = student.current_semester || 'Unknown';
      if (!acc[sem]) acc[sem] = [];
      acc[sem].push(student);
      return acc;
  }, {});

  const groupedRegistrations = registrations.reduce((acc, r) => {
      const key = `${r.roll_number}-${r.semester_label}`;
      if (!acc[key]) acc[key] = { roll_number: r.roll_number, semester: r.semester_label.replace("AI Sem", "CS Sem"), status: r.status, courses: [] };
      acc[key].courses.push(r.course_name);
      return acc;
  }, {});
  const groupedList = Object.values(groupedRegistrations);

  return (
    <div className="app-container">
        <aside className="sidebar">
            <SidebarHeader />
            <button className={view==='students'?'btn-primary':'btn-logout'} onClick={()=>setView('students')}>Manage Students</button>
            <button className={view==='registrations'?'btn-primary':'btn-logout'} style={{marginTop:'10px'}} onClick={()=>setView('registrations')}>Registrations</button>
            <button className="btn-logout" onClick={onLogout} style={{marginTop:'auto'}}>Sign Out</button>
        </aside>
        <main className="main-content">
            <div className="content-body">
                {view === 'students' && (
                    <>
                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
                            <h2>Manage Students</h2>
                            <input placeholder="🔍 Search..." onChange={e => setSearchTerm(e.target.value)} style={{padding:'10px', borderRadius:'8px', border:'1px solid #ccc', width:'300px'}}/>
                        </div>
                        <div className="admin-panel" style={{marginBottom:'30px', padding:'15px', background:'#f8fafc'}}>
                            <h4 style={{margin:'0 0 10px 0'}}>Quick Add Student</h4>
                            <div style={{display:'flex', gap:'10px'}}>
                                <input placeholder="Roll No" onChange={e=>setForm({...form, roll_number:e.target.value})} style={{padding:'5px'}}/>
                                <input placeholder="Name" onChange={e=>setForm({...form, full_name:e.target.value})} style={{padding:'5px'}}/>
                                <input placeholder="Sem" type="number" onChange={e=>setForm({...form, current_semester:e.target.value})} style={{width:'60px', padding:'5px'}}/>
                                <button className="btn-primary" style={{width:'auto'}} onClick={addStudent}>Add</button>
                            </div>
                            {msg && <small style={{color:'green'}}>{msg}</small>}
                        </div>
                        {Object.keys(studentsBySemester).sort().map(sem => (
                            <div key={sem} style={{marginBottom:'30px'}}>
                                <h3 style={{borderBottom:'2px solid #e2e8f0', paddingBottom:'10px', color:'#475569'}}>Semester {sem}</h3>
                                <table style={{width:'100%', background:'white', borderRadius:'8px', borderCollapse:'collapse'}}>
                                    <thead><tr style={{background:'#f1f5f9', textAlign:'left'}}><th style={{padding:'12px'}}>Roll</th><th style={{padding:'12px'}}>Name</th><th style={{padding:'12px'}}>Action</th></tr></thead>
                                    <tbody>
                                        {studentsBySemester[sem].map(s => (
                                            <tr key={s.roll_number} style={{borderBottom:'1px solid #f1f5f9'}}>
                                                <td style={{padding:'12px'}}>{s.roll_number}</td><td style={{padding:'12px'}}>{s.full_name}</td>
                                                <td style={{padding:'12px'}}><button onClick={()=>deleteStudent(s.roll_number)} style={{color:'red', border:'none', background:'none'}}>Delete</button></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ))}
                    </>
                )}
                {view === 'registrations' && (
                    <>
                        <h2>Student Registrations</h2>
                        <table style={{width:'100%', background:'white', borderRadius:'10px', padding:'10px', borderCollapse:'collapse'}}>
                            <thead><tr style={{textAlign:'left', background:'#f8fafc'}}><th style={{padding:'15px'}}>Roll No</th><th style={{padding:'15px'}}>Semester</th><th style={{padding:'15px'}}>Courses</th><th style={{padding:'15px'}}>Status</th></tr></thead>
                            <tbody>
                                {groupedList.map((group, i) => (
                                    <tr key={i} style={{borderBottom:'1px solid #eee'}}>
                                        <td style={{padding:'15px', fontWeight:'bold'}}>{group.roll_number}</td>
                                        <td style={{padding:'15px'}}>{group.semester}</td>
                                        <td style={{padding:'15px'}}>{group.courses.map((c,x)=><span key={x} style={{background:'#f1f5f9', border:'1px solid #ccc', padding:'2px 6px', borderRadius:'4px', margin:'2px', fontSize:'0.8rem'}}>{c}</span>)}</td>
                                        <td style={{padding:'15px', color:'green'}}>✓ {group.status}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </>
                )}
            </div>
            <Footer />
        </main>
    </div>
  );
};

// --- COMPONENT 3: STUDENT DASHBOARD ---
const StudentDashboard = ({ profile, onLogout }) => {
  const [view, setView] = useState('planner'); 
  const [catalog, setCatalog] = useState([]); 
  const [schedule, setSchedule] = useState([]); 
  const [roadmap, setRoadmap] = useState([]); 
  const [error, setError] = useState("");
  const [strategy, setStrategy] = useState("balanced");
  
  const passedCourses = ["CMPC-5201", "CMPC-5204"]; 

  useEffect(() => { fetch('http://127.0.0.1:5000/api/courses').then(r => r.json()).then(setCatalog); }, []);

  const generateRoadmap = async () => {
    const res = await fetch('http://127.0.0.1:5000/api/generate-path', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: profile.roll_number, passed_courses: passedCourses, current_schedule: schedule, strategy: strategy })
    });
    setRoadmap(await res.json());
    setView('roadmap');
  };

  const addToSchedule = (course) => {
    const currentCredits = schedule.reduce((acc, c) => acc + c.credits, 0);
    if (currentCredits + course.credits > 18) { setError(`Limit Reached!`); return; }
    if (!schedule.find(c => c.id === course.id)) setSchedule([...schedule, course]);
  };

  const removeFromSchedule = (courseId) => {
      setSchedule(schedule.filter(s => s.id !== courseId));
      setError("");
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
  const difficultyScore = schedule.reduce((acc, c) => acc + c.difficulty, 0);
  const isSemesterFull = totalCredits >= 18;

  // Group Catalog by Category
  const categories = { 'Core Computing': [], 'Domain Electives': [], 'General & Math': [] };
  catalog.forEach(c => { const cat = getCourseCategory(c.id); if (categories[cat]) categories[cat].push(c); });

  return (
    <div className="app-container">
      <aside className="sidebar">
        <SidebarHeader />
        <div className="user-profile">
            <div style={{fontSize:'1.1rem', fontWeight:'bold'}}>{profile.full_name || profile.name}</div>
            <div style={{fontSize:'0.8rem', opacity:0.8}}>{profile.roll_number}</div>
            {profile.father_name && (
                <div style={{fontSize:'0.85rem', borderTop:'1px solid rgba(255,255,255,0.2)', paddingTop:'5px', marginTop:'5px'}}>
                    <div>Sem: <strong>{profile.current_semester}</strong></div>
                    <div style={{display:'flex', justifyContent:'space-between', marginTop:'5px'}}>
                        <span>SGPA: {profile.gpa}</span>
                        <span>CGPA: {profile.cgpa}</span>
                    </div>
                </div>
            )}
        </div>

        <div style={{fontSize:'1.5rem', fontWeight:'bold', margin:'20px 0', textAlign:'center'}}>{totalCredits} / 18 <br/><span style={{fontSize:'0.8rem', fontWeight:'normal'}}>Credits</span></div>

        <button className={view==='planner'?'btn-primary':'btn-logout'} onClick={()=>setView('planner')}>📅 Current Planner</button>
        
        <div style={{marginTop:'20px', padding:'10px', background:'rgba(255,255,255,0.1)', borderRadius:'10px'}}>
            <label style={{fontSize:'0.8rem', color:'#ccc'}}>AI Strategy:</label>
            <select style={{width:'100%', marginTop:'5px', padding:'5px', borderRadius:'5px'}} onChange={e=>setStrategy(e.target.value)} value={strategy}>
                <option value="balanced">⚖️ Balanced</option>
                <option value="aggressive">🚀 Fast Track</option>
                <option value="relaxed">☕ Relaxed Pace</option>
            </select>
            <button className='btn-primary' style={{marginTop:'10px', width:'100%', fontSize:'0.9rem'}} onClick={generateRoadmap}>Generate Roadmap</button>
        </div>

        <button className="btn-logout" style={{marginTop:'auto'}} onClick={onLogout}>Sign Out</button>
      </aside>

      <main className="main-content">
        {error && <div className="toast-notification">⚠️ {error} <button onClick={()=>setError("")} style={{background:'none', border:'none', marginLeft:'10px'}}>×</button></div>}

        <div className="content-body">
            {view === 'success' && (
                <div style={{textAlign:'center', padding:'50px'}}>
                    <h1 style={{fontSize:'4rem'}}>🎉</h1>
                    <h2>Registration Successful!</h2>
                    <p>Your selection has been submitted to the Admin.</p>
                    <button className="btn-primary" onClick={()=>setView('planner')}>Back to Home</button>
                </div>
            )}

            {view === 'planner' && (
                <>
                    <h2>My Semester Plan ({totalCredits} / 18 Cr)</h2>
                    {isSemesterFull && (
                        <div style={{background:'#ecfdf5', padding:'20px', borderRadius:'10px', marginBottom:'20px', textAlign:'center'}}>
                            <h3 style={{color:'#065f46', margin:0}}>✅ Limit Reached</h3>
                            <p>You have selected the maximum allowed credits.</p>
                            <button className="btn-success" style={{fontSize:'1.1rem', padding:'10px 30px', marginTop:'10px'}} onClick={submitRegistration}>Confirm Registration</button>
                        </div>
                    )}
                    <div className="schedule-list-container">
                        {schedule.map(c => (
                            <div key={c.id} className="schedule-item" style={{borderLeft:'5px solid #10b981'}}>
                                <b>{c.name}</b> <button onClick={()=>removeFromSchedule(c.id)} style={{color:'red', border:'none'}}>×</button>
                            </div>
                        ))}
                    </div>
                    
                    {Object.keys(categories).map(cat => (
                        <div key={cat} style={{marginBottom: '30px'}}>
                            <h2 style={{borderBottom:'2px solid #e2e8f0', paddingBottom:'10px', color:'#475569'}}>{cat}</h2>
                            <div className="course-grid">
                                {categories[cat].map(c => {
                                    const isAdded = schedule.find(s => s.id === c.id);
                                    const isDisabled = isAdded || (isSemesterFull && !isAdded);
                                    const diffColor = getDifficultyColor(c.difficulty);

                                    return (
                                        <div key={c.id} className={`course-card ${isAdded ? 'passed' : 'available'}`} style={{opacity: isDisabled && !isAdded ? 0.5 : 1}}>
                                            <div className="course-header">
                                                <span className="badge badge-credits">{c.credits} Cr</span>
                                                <span style={{background: diffColor, color:'white', padding:'2px 8px', borderRadius:'10px', fontSize:'0.75rem', fontWeight:'bold'}}>Lvl {c.difficulty}</span>
                                            </div>
                                            <h3 style={{margin:'10px 0'}}>{c.name}</h3>
                                            <small style={{color:'#6b7280'}}>{c.schedule?.day ? `${c.schedule.day} ${c.schedule.start}` : 'TBA'}</small>
                                            
                                            <div style={{marginTop:'15px'}}>
                                                {isAdded ? 
                                                    <button onClick={()=>removeFromSchedule(c.id)} style={{background:'#fee2e2', color:'#ef4444', border:'1px solid #ef4444', padding:'5px 10px', borderRadius:'5px', cursor:'pointer', width:'100%'}}>× Cancel</button> :
                                                 isSemesterFull ? <button disabled style={{background:'#d1d5db', color:'#fff', border:'none', padding:'5px 10px', borderRadius:'5px', width:'100%'}}>Full</button> :
                                                 <button onClick={() => addToSchedule(c)} style={{background:'var(--primary)', color:'white', border:'none', padding:'5px 10px', borderRadius:'5px', cursor:'pointer', width:'100%'}}>+ Add</button>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </>
            )}

            {view === 'roadmap' && (
                <>
                    <h2>🤖 AI Roadmap ({strategy.toUpperCase()})</h2>
                    <div style={{display: 'grid', gap: '25px'}}>
                        {roadmap.map((sem, index) => (
                            <div key={index} style={{background:'white', padding:'25px', borderRadius:'12px', boxShadow:'var(--shadow)', borderLeft:'6px solid var(--primary)'}}>
                                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                                    <h3>Semester {sem.semester}</h3>
                                    <button className="btn-primary" style={{padding:'5px 15px', fontSize:'0.8rem'}} onClick={()=>acceptAIPlan(sem)}>✓ Accept Plan</button>
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
        </div>
        <Footer />
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