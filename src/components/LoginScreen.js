import React, { useState } from 'react';

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

export default LoginScreen;