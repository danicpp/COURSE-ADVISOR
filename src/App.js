import React, { useState } from 'react';
import './App.css'; 
import HomeScreen from './components/HomeScreen';
import LoginScreen from './components/LoginScreen';
import AdminDashboard from './components/AdminDashboard';
import StudentDashboard from './components/StudentDashboard';

const App = () => {
  const [showHome, setShowHome] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [profile, setProfile] = useState({}); 
  const [passedCourses, setPassedCourses] = useState([]);

  if (showHome) {
    return <HomeScreen onGetStarted={() => setShowHome(false)} />;
  }

  if (!userRole) {
      return <LoginScreen onLogin={(role, data) => { 
          setUserRole(role); 
          setProfile(data.profile);
          setPassedCourses(data.passed_courses || []);
      }} />;
  }
  
  if (userRole === 'admin') {
      return <AdminDashboard onLogout={() => setUserRole(null)} />;
  }
  
  return <StudentDashboard profile={profile} passedCourses={passedCourses} onLogout={() => setUserRole(null)} />;
};

export default App;
