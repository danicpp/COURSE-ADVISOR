import React, { useState, useEffect } from 'react';
import { Footer, SidebarHeader, formatTime } from './Shared';

const AdminDashboard = ({ onLogout }) => {
  const [view, setView] = useState('students');
  const [students, setStudents] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [courses, setCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [studentFilter, setStudentFilter] = useState("");
  const [courseFilter, setCourseFilter] = useState("");
    const [registrationsByCourse, setRegistrationsByCourse] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [courseForm, setCourseForm] = useState({ id: '', name: '', credits: 3, difficulty: 1, day: 'Mon', start: '0900', end: '1030' });
  const [form, setForm] = useState({ roll_number: '', full_name: '', father_name: '', gpa: 3.0, cgpa: 3.0, current_semester: 1 });
  const [msg, setMsg] = useState("");

  useEffect(() => {
      if (view === 'students') fetch('http://127.0.0.1:5000/api/admin/students').then(r=>r.json()).then(setStudents);
      if (view === 'registrations') fetch('http://127.0.0.1:5000/api/admin/registrations').then(r=>r.json()).then(setRegistrations);
      if (view === 'schedules' || view === 'registrations_by_course' || view === 'add_course') {
        fetch('http://127.0.0.1:5000/api/courses').then(r=>r.json()).then(setCourses);
      }
  }, [view]);

    const fetchRegistrationsByCourse = async (courseId) => {
        setSelectedCourse(courseId);
        const res = await fetch('http://127.0.0.1:5000/api/admin/registrations/course', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ course_id: courseId })
        });
        const data = await res.json();
        setRegistrationsByCourse(data);
    };

    const addCourse = async () => {
        const res = await fetch('http://127.0.0.1:5000/api/admin/add-course', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(courseForm)
        });
        const data = await res.json();
        if (data.success) {
            setMsg("Course Added Successfully!");
            setCourseForm({ id: '', name: '', credits: 3, difficulty: 1, day: 'Mon', start: '0900', end: '1030' });
            fetch('http://127.0.0.1:5000/api/courses').then(r=>r.json()).then(setCourses);
        } else {
            setMsg("Error: " + data.message);
        }
    };

  const addStudent = async () => {
      const res = await fetch('http://127.0.0.1:5000/api/admin/add-student', {
          method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(form)
      });
      const data = await res.json();
      if (data.success) { setMsg("Student Added"); fetch('http://127.0.0.1:5000/api/admin/students').then(r=>r.json()).then(setStudents); } 
      else setMsg("Error");
  };

  const deleteStudent = async (roll) => {
      if(!window.confirm("Are you sure?")) return;
      await fetch('http://127.0.0.1:5000/api/admin/delete-student', {
          method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({roll_number: roll})
      });
      fetch('http://127.0.0.1:5000/api/admin/students').then(r=>r.json()).then(setStudents);
  };

  const updateSchedule = async (courseId, day, start, end) => {
      const res = await fetch('http://127.0.0.1:5000/api/admin/update-schedule', {
          method: 'POST', headers: {'Content-Type':'application/json'},
          body: JSON.stringify({ course_id: courseId, day, start: parseInt(start), end: parseInt(end) })
      });
      const data = await res.json();
      if(data.success) { alert("Schedule Updated!"); fetch('http://127.0.0.1:5000/api/courses').then(r=>r.json()).then(setCourses); }
      else alert("Error updating schedule: " + data.message);
  };

  const filteredStudents = students.filter(s => 
      s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      s.roll_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const studentsBySemester = filteredStudents.reduce((acc, student) => {
      const sem = student.current_semester || 'Unknown';
      if (!acc[sem]) acc[sem] = []; acc[sem].push(student); return acc;
  }, {});

  const groupedRegistrations = registrations.reduce((acc, r) => {
      const key = r.roll_number + '-' + r.semester_label;
      if (!acc[key]) acc[key] = { roll_number: r.roll_number, semester: r.semester_label.replace("AI Sem", "CS Sem"), status: r.status, courses: [] };
      acc[key].courses.push(r.course_name); return acc;
  }, {});
  const groupedList = Object.values(groupedRegistrations);
  
  const filteredGroupedList = groupedList.filter(g => {
    const studentMatch = g.roll_number.toLowerCase().includes(studentFilter.toLowerCase());
    const courseMatch = courseFilter === "" || g.courses.some(c => c.toLowerCase().includes(courseFilter.toLowerCase()));
    return studentMatch && courseMatch;
  });

  return (
    <div className="app-container">
        <aside className="sidebar">
            <SidebarHeader />
            <button className={view==='students'?'btn-primary':'btn-logout'} onClick={()=>setView('students')}>Manage Students</button>
            <button className={view==='registrations'?'btn-primary':'btn-logout'} style={{marginTop:'10px'}} onClick={()=>setView('registrations')}>Registrations by Student</button>
            <button className={view==='registrations_by_course'?'btn-primary':'btn-logout'} style={{marginTop:'10px'}} onClick={()=>setView('registrations_by_course')}>Registrations by Course</button>
            <button className={view==='schedules'?'btn-primary':'btn-logout'} style={{marginTop:'10px'}} onClick={()=>setView('schedules')}>Manage Schedules</button>
            <button className={view==='add_course'?'btn-primary':'btn-logout'} style={{marginTop:'10px'}} onClick={()=>setView('add_course')}>Add Course</button>
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
                            <div style={{display:'flex', gap:'10px', flexWrap:'wrap'}}>
                                <input placeholder="Roll No" onChange={e=>setForm({...form, roll_number:e.target.value})} style={{padding:'5px'}}/>
                                <input placeholder="Name" onChange={e=>setForm({...form, full_name:e.target.value})} style={{padding:'5px'}}/>
                                <input placeholder="Father's Name" onChange={e=>setForm({...form, father_name:e.target.value})} style={{padding:'5px'}}/>
                                <input placeholder="GPA" type="number" step="0.1" onChange={e=>setForm({...form, gpa:parseFloat(e.target.value)})} style={{width:'60px', padding:'5px'}}/>
                                <input placeholder="CGPA" type="number" step="0.1" onChange={e=>setForm({...form, cgpa:parseFloat(e.target.value)})} style={{width:'60px', padding:'5px'}}/>
                                <input placeholder="Sem" type="number" onChange={e=>setForm({...form, current_semester:parseInt(e.target.value)})} style={{width:'60px', padding:'5px'}}/>
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
                        <h2>Course Registrations</h2>
                        <div style={{display:'flex', gap:'10px', marginBottom:'20px'}}>
                          <input placeholder="Filter by student..." value={studentFilter} onChange={e => setStudentFilter(e.target.value)} style={{padding:'10px', borderRadius:'8px', border:'1px solid #ccc', width:'300px'}}/>
                          <input placeholder="Filter by course..." value={courseFilter} onChange={e => setCourseFilter(e.target.value)} style={{padding:'10px', borderRadius:'8px', border:'1px solid #ccc', width:'300px'}}/>
                        </div>
                        <table style={{width:'100%', background:'white', borderRadius:'10px', padding:'10px', borderCollapse:'collapse'}}>
                            <thead><tr style={{textAlign:'left', background:'#f8fafc'}}><th style={{padding:'15px'}}>Roll No</th><th style={{padding:'15px'}}>Semester</th><th style={{padding:'15px'}}>Courses</th><th style={{padding:'15px'}}>Status</th></tr></thead>
                            <tbody>
                                {filteredGroupedList.map((group, i) => (
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
                {view === 'registrations_by_course' && (
                    <>
                        <h2>Registrations by Course</h2>
                        <div style={{display:'flex', gap:'20px', alignItems:'flex-start'}}>
                            <div className="admin-panel" style={{width:'300px', padding:'20px'}}>
                                <h3 style={{marginBottom:'10px'}}>Select a Course</h3>
                                {courses.map(c => (
                                    <div key={c.id} onClick={() => fetchRegistrationsByCourse(c.id)} 
                                        className={`course-list-item ${selectedCourse === c.id ? 'selected' : ''}`}
                                        style={{padding:'10px', background:selectedCourse === c.id ? 'var(--primary)' : '#f8fafc', 
                                                color: selectedCourse === c.id? 'white':'black',
                                                border:'1px solid #e2e8f0', borderRadius:'5px', marginBottom:'5px', cursor:'pointer', transition: 'all 0.2s'}}>
                                        <strong>{c.id}</strong>: {c.name}
                                    </div>
                                ))}
                            </div>
                            <div style={{flex:1}}>
                                {selectedCourse && (
                                    <div className="admin-panel" style={{padding:'20px'}}>
                                        <h3>Students Registered in {selectedCourse}</h3>
                                        {registrationsByCourse.length > 0 ? (
                                            <table className="table" style={{width:'100%', background:'white', borderRadius:'8px', borderCollapse:'collapse'}}>
                                                <thead><tr style={{textAlign:'left', background:'#f1f5f9'}}><th style={{padding:'12px'}}>Roll No</th><th style={{padding:'12px'}}>Name</th><th style={{padding:'12px'}}>Semester</th></tr></thead>
                                                <tbody>
                                                    {registrationsByCourse.map(r => (
                                                        <tr key={r.roll_number} style={{borderBottom:'1px solid #f1f5f9'}}>
                                                            <td style={{padding:'12px'}}>{r.roll_number}</td><td style={{padding:'12px'}}>{r.full_name}</td><td style={{padding:'12px'}}>{r.semester_label}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        ) : <p>No registrations found for this course.</p>}
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
                {view === 'add_course' && (
                    <>
                        <h2>Add New Course</h2>
                        <div className="admin-panel" style={{maxWidth:'700px', margin:'auto', padding:'30px'}}>
                            <div className="form-group"><label>Course ID</label><input value={courseForm.id} onChange={e=>setCourseForm({...courseForm, id:e.target.value})} /></div>
                            <div className="form-group"><label>Course Name</label><input value={courseForm.name} onChange={e=>setCourseForm({...courseForm, name:e.target.value})} /></div>
                            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px'}}>
                                <div className="form-group"><label>Credits</label><input type="number" value={courseForm.credits} onChange={e=>setCourseForm({...courseForm, credits:parseInt(e.target.value)})} /></div>
                                <div className="form-group"><label>Difficulty (1-5)</label><input type="number" min="1" max="5" value={courseForm.difficulty} onChange={e=>setCourseForm({...courseForm, difficulty:parseInt(e.target.value)})} /></div>
                            </div>
                            <h4 style={{marginTop:'20px', borderTop:'1px solid #eee', paddingTop:'20px'}}>Default Schedule</h4>
                            <div style={{display:'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px'}}>
                                <div className="form-group"><label>Day</label><select value={courseForm.day} onChange={e=>setCourseForm({...courseForm, day:e.target.value})}>{['Mon','Tue','Wed','Thu','Fri'].map(d=><option key={d} value={d}>{d}</option>)}</select></div>
                                <div className="form-group"><label>Start Time (HHMM)</label><input value={courseForm.start} onChange={e=>setCourseForm({...courseForm, start:e.target.value})} /></div>
                                <div className="form-group"><label>End Time (HHMM)</label><input value={courseForm.end} onChange={e=>setCourseForm({...courseForm, end:e.target.value})} /></div>
                            </div>
                            <button className="btn-primary" style={{marginTop:'20px', width:'100%'}} onClick={addCourse}>Add Course</button>
                            {msg && <p style={{color: msg.startsWith("Error") ? 'red' : 'green', marginTop:'15px', textAlign:'center', fontWeight:'bold'}}>{msg}</p>}
                        </div>
                    </>
                )}
                {view === 'schedules' && (
                    <>
                        <h2>Manage Course Schedules</h2>
                        <table style={{width:'100%', background:'white', borderRadius:'10px', padding:'10px', borderCollapse:'collapse'}}>
                            <thead><tr style={{textAlign:'left', background:'#f8fafc'}}><th style={{padding:'15px'}}>Course</th><th style={{padding:'15px'}}>Day</th><th style={{padding:'15px'}}>Start</th><th style={{padding:'15px'}}>End</th><th style={{padding:'15px'}}>Action</th></tr></thead>
                            <tbody>
                                {courses.map((c, i) => {
                                    const schedule = c.schedule && c.schedule.length > 0 ? c.schedule[0] : {};
                                    return (
                                        <tr key={i} style={{borderBottom:'1px solid #eee'}}>
                                            <td style={{padding:'15px'}}><strong>{c.id}</strong><br/><small>{c.name}</small></td>
                                            <td style={{padding:'15px'}}>
                                                <select id={`day-${c.id}`} defaultValue={schedule.day || 'Mon'} style={{padding:'5px'}}>
                                                    {['Mon','Tue','Wed','Thu','Fri'].map(d=><option key={d} value={d}>{d}</option>)}
                                                </select>
                                            </td>
                                            <td style={{padding:'15px'}}><input id={`start-${c.id}`} defaultValue={schedule.start || ''} placeholder="0900" style={{width:'60px', padding:'5px'}}/></td>
                                            <td style={{padding:'15px'}}><input id={`end-${c.id}`} defaultValue={schedule.end || ''} placeholder="1030" style={{width:'60px', padding:'5px'}}/></td>
                                            <td style={{padding:'15px'}}>
                                                <button onClick={() => updateSchedule(
                                                    c.id, 
                                                    document.getElementById(`day-${c.id}`).value,
                                                    document.getElementById(`start-${c.id}`).value,
                                                    document.getElementById(`end-${c.id}`).value
                                                )} style={{background:'var(--primary)', color:'white', border:'none', padding:'5px 10px', borderRadius:'5px'}}>Update</button>
                                            </td>
                                        </tr>
                                    );
                                })}
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

export default AdminDashboard;