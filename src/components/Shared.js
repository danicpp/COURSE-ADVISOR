import React from 'react';

// --- HELPERS ---
export const getDifficultyColor = (level) => {
    if (level <= 2) return '#10b981'; // Green
    if (level === 3) return '#f59e0b'; // Orange
    return '#ef4444'; // Red
};

export const getCourseCategory = (id) => {
    if (id.startsWith('CMPC') || id.startsWith('CSDC')) return 'Core Computing';
    if (id.startsWith('CSDE') || id.startsWith('ITDC') || id.startsWith('SEDC') || id.startsWith('DSDC') || id.startsWith('AIDC')) return 'Domain Electives';
    return 'General & Math';
};

// --- UI COMPONENTS ---
export const Footer = () => (
    <footer className="app-footer">
        <p>Developed by <span className="developer-credits">Group 15 (Daniyal, Faisal, Maheen)</span> using Gemini AI</p>
        <p style={{fontSize:'0.7rem', marginTop:'5px'}}>© 2025 University of Sargodha. All Rights Reserved.</p>
    </footer>
);

export const SidebarHeader = () => (
    <div className="brand-header">
        <img src="/logo.png" alt="UOS Logo" style={{width:'80px', height:'auto', marginBottom:'10px'}} 
             onError={(e) => {e.target.onerror = null; e.target.style.display='none'; e.target.nextSibling.style.display='block'}} />
        <div style={{fontSize:'3rem', display:'none'}}>🏛️</div>
        <h3>University of Sargodha</h3>
        <p>CoursePath Advisor</p>
    </div>
);
