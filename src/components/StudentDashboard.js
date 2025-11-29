import React, { useState, useEffect } from 'react';
import { Footer, SidebarHeader, getCourseCategory, getDifficultyColor } from './Shared';
import StrategySelector from './StrategySelector';
import './StudentDashboard.css';

const WeeklyTimetable = ({ courses }) => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    const timeToPx = (time) => {
        const hours = Math.floor(time / 100);
        const minutes = time % 100;
        return ((hours - 8) * 50) + (minutes * (50/60));
    };

    return (
        <div style={{background:'white', padding:'20px', borderRadius:'10px', marginBottom:'30px', boxShadow:'0 2px 5px rgba(0,0,0,0.05)', overflowX:'auto'}}>
            <h3 style={{marginTop:0, marginBottom:'20px'}}>📅 Weekly Schedule</h3>
            <div style={{display:'grid', gridTemplateColumns:'50px repeat(5, 1fr)', gap:'10px', minWidth:'600px'}}>
                <div style={{position:'relative', height:'450px', borderRight:'1px solid #eee'}}>
                    {[8,9,10,11,12,13,14,15,16].map(h => (
                        <div key={h} style={{position:'absolute', top:`${(h-8)*50}px`, fontSize:'0.7rem', color:'#999', width:'100%', textAlign:'right', paddingRight:'5px'}}>{h}:00</div>
                    ))}
                </div>
                {days.map(day => (
                    <div key={day} style={{position:'relative', height:'450px', borderLeft:'1px dashed #eee'}}>
                        <div style={{textAlign:'center', fontWeight:'bold', marginBottom:'10px', color:'#64748b'}}>{day}</div>
                        {courses.flatMap(c => 
                            c.schedule
                                .filter(s => s.day === day)
                                .map(s => {
                                    const top = timeToPx(s.start);
                                    const height = timeToPx(s.end) - top;
                                    return (
                                        <div key={`${c.id}-${s.day}-${s.start}`} style={{
                                            position: 'absolute', top: `${top}px`, height: `${height}px`, width: '90%', left: '5%',
                                            background: '#e0e7ff', borderLeft: '4px solid #4f46e5', borderRadius: '4px', padding: '5px',
                                            fontSize: '0.7rem', color: '#3730a3', overflow: 'hidden', zIndex: 10
                                        }}>
                                            <strong>{c.id}</strong><br/>{s.start}-{s.end}
                                        </div>
                                    );
                                })
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

const StudentDashboard = ({ profile, passedCourses, onLogout }) => {
    const [view, setView] = useState('planner');
    const [catalog, setCatalog] = useState([]);
    const [schedule, setSchedule] = useState([]);
    const [roadmap, setRoadmap] = useState([]);
    const [error, setError] = useState("");
    const [strategy, setStrategy] = useState("balanced");
    const [isRegistered, setIsRegistered] = useState(profile.is_registered || false);

    useEffect(() => {
        fetch('http://127.0.0.1:5000/api/courses')
            .then(r => r.json())
            .then(setCatalog);
    }, []);

    useEffect(() => {
        if (isRegistered && catalog.length > 0) {
            fetch(`http://127.0.0.1:5000/api/student/registrations?roll_number=${profile.roll_number}`)
                .then(r => r.json())
                .then(data => {
                    const currentSemesterLabel = `Semester ${profile.current_semester}`;
                    const registeredCourseIds = data
                        .filter(reg => reg.semester_label.includes(currentSemesterLabel))
                        .map(reg => reg.course_id);
                    
                    const registeredCourses = catalog.filter(course => registeredCourseIds.includes(course.id));
                    setSchedule(registeredCourses);
                });
        }
    }, [profile.roll_number, catalog, isRegistered, profile.current_semester]);
    
    const generateRoadmap = async () => {
        const res = await fetch('http://127.0.0.1:5000/api/generate-path', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: profile.roll_number, current_schedule: schedule, strategy: strategy })
        });
        setRoadmap(await res.json()); setView('roadmap');
    };

    const addToSchedule = async (course) => {
        if (isRegistered) return;
        const currentCredits = schedule.reduce((acc, c) => acc + c.credits, 0);
        if (currentCredits + course.credits > 18) { setError('Limit Reached! Max 18 Credits.'); return; }

        try {
            const res = await fetch('http://127.0.0.1:5000/api/check-conflict', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ new_course: course, current_schedule: schedule })
            });
            const result = await res.json();
            if (result.conflict) { setError(result.message); return; }
            setSchedule([...schedule, course]);
        } catch { setError("Server Error"); }
    };

    const removeFromSchedule = (courseId) => {
        if (isRegistered) return;
        setSchedule(schedule.filter(s => s.id !== courseId));
        setError("");
    };

    const submitRegistration = async () => {
        if (window.confirm('Are you sure you want to confirm your registration? This action is final and cannot be undone.')) {
            const sem_label = `Semester ${profile.current_semester} (Regular)`
            const res = await fetch('http://127.0.0.1:5000/api/student/register', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: profile.roll_number, courses: schedule.map(c => c.id), semester_label: sem_label })
            });
            const result = await res.json();
            if (result.success) {
                setIsRegistered(true);
                setView('success');
            } else {
                setError(result.message);
            }
        }
    };

    const acceptAIPlan = async (semesterData) => {
        await fetch('http://127.0.0.1:5000/api/student/register', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: profile.roll_number, courses: semesterData.courses.map(c => c.course_id), semester_label: "AI Sem " + semesterData.semester })
        });
        alert("Plan Accepted!");
    };

    const totalCredits = schedule.reduce((acc, c) => acc + c.credits, 0);
    const isSemesterFull = totalCredits >= 18;
    const fypCourses = ['CMPC-6702', 'CMPC-6703'];
    const availableCourses = catalog.filter(c => !passedCourses.includes(c.id) && !fypCourses.includes(c.id));
    const categories = { 'Core Computing': [], 'Domain Electives': [], 'General & Math': [] };
    availableCourses.forEach(c => { const cat = getCourseCategory(c.id); if (categories[cat]) categories[cat].push(c); });
		
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
													<span>SGPA: {profile.gpa}</span><span>CGPA: {profile.cgpa}</span>
											</div>
									</div>
							)}
					</div>
					<div style={{fontSize:'1.5rem', fontWeight:'bold', margin:'20px 0', textAlign:'center'}}>{totalCredits} / 18 <br/><span style={{fontSize:'0.8rem', fontWeight:'normal'}}>Credits</span></div>
					<button className={view==='planner'?'btn-primary':'btn-logout'} onClick={()=>setView('planner')}>📅 Planner</button>
					<StrategySelector selectedStrategy={strategy} onStrategyChange={setStrategy} />
					<button className='btn-primary btn-generate' onClick={generateRoadmap}>Generate Roadmap</button>
					<button className="btn-logout" style={{marginTop:'auto'}} onClick={onLogout}>Sign Out</button>
				</aside>

				<main className="main-content">
						{error && <div className="toast-notification">⚠️ {error} <button onClick={()=>setError("")} style={{background:'none', border:'none', marginLeft:'10px'}}>×</button></div>}

						<div className="content-body">
								{view === 'success' && (
										<div style={{textAlign:'center', padding:'50px'}}>
												<h1 style={{fontSize:'4rem'}}>🎉</h1><h2>Registration Successful!</h2><button className="btn-primary" onClick={()=>setView('planner')}>Back</button>
										</div>
								)}

								{view === 'planner' && (
										<>
												<WeeklyTimetable courses={schedule} />

												<h2>My Semester Plan ({totalCredits} / 18 Cr)</h2>
												{isRegistered ? (
                            <div style={{ background: '#eef2ff', padding: '20px', borderRadius: '10px', marginBottom: '20px', textAlign: 'center' }}>
                                <h3 style={{ color: '#4f46e5', margin: 0 }}>🔒 Registration Confirmed</h3>
                                <p style={{ color: '#6366f1' }}>Your course selection is locked for this semester.</p>
                            </div>
                        ) : isSemesterFull && (
                            <div style={{ background: '#ecfdf5', padding: '20px', borderRadius: '10px', marginBottom: '20px', textAlign: 'center' }}>
                                <h3 style={{ color: '#065f46', margin: 0 }}>✅ Limit Reached</h3>
                                <button className="btn-success" style={{ fontSize: '1.1rem', padding: '10px 30px', marginTop: '10px' }} onClick={submitRegistration}>Confirm Registration</button>
                            </div>
                        )}
												<div className="schedule-list-container">
														{schedule.map(c => (
																<div key={c.id} className="schedule-item" style={{borderLeft:'5px solid #10b981'}}>
																		<b>{c.name}</b> {!isRegistered && <button onClick={()=>removeFromSchedule(c.id)} style={{color:'red', border:'none'}}>×</button>}
																</div>
														))}
												</div>

												{Object.keys(categories).map(cat => (
														<div key={cat} style={{marginBottom: '30px'}}>
																<h2 style={{borderBottom:'2px solid #e2e8f0', paddingBottom:'10px', color:'#475569'}}>{cat}</h2>
																<div className="course-grid">
																		{categories[cat].map(c => {
																				const isAdded = schedule.find(s => s.id === c.id);
																				const isDisabled = isAdded || (isSemesterFull && !isAdded) || isRegistered;
																				const diffColor = getDifficultyColor(c.difficulty);
                                                const schedule_info = c.schedule && c.schedule.length > 0 ? `${c.schedule[0].day} ${c.schedule[0].start}`: 'TBA';
																				return (
																						<div key={c.id} className={`course-card ${isAdded ? 'passed' : 'available'}`} style={{opacity: isDisabled && !isAdded ? 0.5 : 1}}>
																								<div className="course-header">
																										<span className="badge badge-credits">{c.credits} Cr / {c.credits} Hrs</span>
																										<span style={{background: diffColor, color:'white', padding:'2px 8px', borderRadius:'10px', fontSize:'0.75rem', fontWeight:'bold'}}>Lvl {c.difficulty}</span>
																								</div>
																								<h3 style={{margin:'10px 0'}}>{c.name}</h3>
																								<small style={{color:'#6b7280'}}>{schedule_info}</small>
																								<div style={{marginTop:'15px'}}>
																										{isAdded ?
																												<button onClick={()=>removeFromSchedule(c.id)} disabled={isRegistered} style={{background:'#fee2e2', color:'#ef4444', border:'1px solid #ef4444', padding:'5px 10px', borderRadius:'5px', cursor:'pointer', width:'100%'}}>× Cancel</button> :
																										 isSemesterFull || isRegistered ? <button disabled style={{background:'#d1d5db', color:'#fff', border:'none', padding:'5px 10px', borderRadius:'5px', width:'100%'}}>Full</button> :
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
												<div className="roadmap-container">
														{roadmap.map((sem, index) => (
																<div key={index} className="semester-card">
																		<div className="semester-header">
																				<h3>Semester {sem.semester}</h3>
																				<button className="btn-accept-plan" onClick={()=>acceptAIPlan(sem)}>✓ Accept Plan</button>
																		</div>
																		<div className="semester-reason">💡 {sem.reason}</div>
																		<div className="course-tags">
																				{sem.courses.map(c => <div key={c.course_id} className="course-tag">{c.course_name}</div>)}
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
}


export default StudentDashboard;