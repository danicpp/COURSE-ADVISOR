import React, { useState } from 'react';
import './App.css'; 
import LoginScreen from './components/LoginScreen';
import AdminDashboard from './components/AdminDashboard';
import StudentDashboard from './components/StudentDashboard';

const App = () => {
  const [userRole, setUserRole] = useState(null);
  const [profile, setProfile] = useState({}); 

  if (!userRole) {
      return <LoginScreen onLogin={(role, data) => { setUserRole(role); setProfile(data); }} />;
  }
  
  if (userRole === 'admin') {
      return <AdminDashboard onLogout={() => setUserRole(null)} />;
  }
  
  return <StudentDashboard profile={profile} onLogout={() => setUserRole(null)} />;
};

export default App;
