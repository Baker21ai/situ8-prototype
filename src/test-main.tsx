import React from 'react'
import ReactDOM from 'react-dom/client'

// Super simple test app
const TestApp = () => {
  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100vh',
      backgroundColor: '#1a1a1a',
      color: 'white',
      fontSize: '24px',
      fontFamily: 'monospace'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1>React is Working! 🎉</h1>
        <p>If you see this, React loaded successfully.</p>
        <button 
          onClick={() => alert('Button works!')}
          style={{
            padding: '10px 20px',
            fontSize: '18px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            marginTop: '20px'
          }}
        >
          Test Button
        </button>
      </div>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <TestApp />
  </React.StrictMode>,
)