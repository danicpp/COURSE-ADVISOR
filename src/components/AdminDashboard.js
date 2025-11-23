import React, { useState, useEffect } from 'react';
import { Footer, SidebarHeader } from './Shared';

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
      if(!window.confirm("Are you sure?")) return;
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
      if (!acc[sem]) acc[sem] = []; acc[sem].push(student); return acc;
  }, {});

  const groupedRegistrations = registrations.reduce((acc, r) => {
      // FIX: Removed the backslash issue here
      const key = r.roll_number + '-' + r.semester_label;
      if (!acc[key]) acc[key] = { roll_number: r.roll_number, semester: r.semester_label.replace("AI Sem", "CS Sem"), status: r.status, courses: [] };
      acc[key].courses.push(r.course_name); return acc;
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
                        <h2>Course Registrations</h2>
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

export default AdminDashboard;