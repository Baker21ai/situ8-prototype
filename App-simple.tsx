import React from 'react';

const SimpleApp = () => {
  const [user, setUser] = React.useState<any>(null);
  
  const loginAsAdmin = () => {
    const adminUser = {
      id: 'demo-admin-001',
      email: 'admin@demo.situ8.com',
      role: 'admin',
      clearanceLevel: 5,
      profile: { fullName: 'Demo Admin' }
    };
    
    // Save to localStorage
    localStorage.setItem('situ8-user-store', JSON.stringify({
      state: {
        isAuthenticated: true,
        currentUser: adminUser,
        isDemoMode: true
      }
    }));
    
    setUser(adminUser);
  };
  
  if (!user) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#111827',
        color: 'white',
        fontFamily: 'system-ui'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '2rem' }}>
            🛡️ Situ8 Security Platform
          </h1>
          <p style={{ marginBottom: '2rem', opacity: 0.8 }}>
            Simple working version - Click to login
          </p>
          <button
            onClick={loginAsAdmin}
            style={{
              backgroundColor: '#dc2626',
              color: 'white',
              padding: '1rem 2rem',
              fontSize: '1.25rem',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer'
            }}
          >
            Login as Admin
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div style={{
      height: '100vh',
      backgroundColor: '#111827',
      color: 'white',
      fontFamily: 'system-ui'
    }}>
      <header style={{
        backgroundColor: '#1f2937',
        padding: '1rem 2rem',
        borderBottom: '1px solid #374151'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: '1.5rem', margin: 0 }}>
            🛡️ Situ8 Command Center
          </h1>
          <div>
            Logged in as: <strong>{user.email}</strong> ({user.role})
          </div>
        </div>
      </header>
      
      <main style={{ padding: '2rem' }}>
        <div style={{
          backgroundColor: '#1f2937',
          borderRadius: '0.5rem',
          padding: '2rem',
          marginBottom: '2rem'
        }}>
          <h2 style={{ marginTop: 0 }}>Welcome, {user.profile.fullName}!</h2>
          <p>This is a simplified version of the Situ8 platform.</p>
          <p>The main app appears to have initialization issues.</p>
        </div>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1rem'
        }}>
          {['Activities', 'Incidents', 'Cases', 'Communications'].map(module => (
            <div
              key={module}
              style={{
                backgroundColor: '#1f2937',
                borderRadius: '0.5rem',
                padding: '1.5rem',
                border: '1px solid #374151'
              }}
            >
              <h3>{module}</h3>
              <p style={{ opacity: 0.7 }}>Module placeholder</p>
            </div>
          ))}
        </div>
        
        <button
          onClick={() => {
            localStorage.clear();
            setUser(null);
          }}
          style={{
            marginTop: '2rem',
            backgroundColor: '#ef4444',
            color: 'white',
            padding: '0.75rem 1.5rem',
            border: 'none',
            borderRadius: '0.375rem',
            cursor: 'pointer'
          }}
        >
          Logout
        </button>
      </main>
    </div>
  );
};

export default SimpleApp;