import React from 'react';
import { Link } from 'react-router-dom';

const Welcome: React.FC = () => {
  return (
    <div style={{ 
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      backgroundColor: '#0f4c5c',
      color: 'white',
      textAlign: 'center'
    }}>
      <h1 style={{ 
        fontSize: '2.5rem', 
        color: '#ffd700',
        marginBottom: '2rem'
      }}>
        Online Multiplayer Turn Based Strategy Game
      </h1>

      <div style={{
        backgroundColor: 'rgba(46, 31, 25, 0.9)',
        padding: '3rem',
        borderRadius: '8px',
        maxWidth: '500px',
        width: '100%',
        marginBottom: '2rem'
      }}>
        <h2 style={{ 
          fontSize: '2rem', 
          marginBottom: '2rem'
        }}>
          Join The Fight!
        </h2>

        <Link to="/signin" style={{
          display: 'inline-block',
          backgroundColor: '#ff6b35',
          color: 'white',
          padding: '1rem 2rem',
          borderRadius: '4px',
          fontWeight: 'bold',
          fontSize: '1.25rem',
          textDecoration: 'none',
          marginBottom: '1rem',
          width: '200px'
        }}>
          PLAY NOW
        </Link>

        <p style={{ 
          marginTop: '1rem',
          fontSize: '0.9rem',
          opacity: 0.8
        }}>
          Beta Version Open
        </p>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <h3 style={{ 
          fontSize: '1.5rem', 
          marginBottom: '1rem',
          color: '#ffd700'
        }}>
          Support us!
        </h3>
        
        <a 
          href="https://Patreon.com/realmsofwar" 
          target="_blank" 
          rel="noopener noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            textDecoration: 'none'
          }}
        >
          <span style={{
            display: 'inline-block',
            width: '24px',
            height: '24px',
            backgroundColor: '#ff424d',
            borderRadius: '50%',
            marginRight: '0.5rem'
          }}></span>
          Patreon.com/realmsofwar
        </a>
      </div>
    </div>
  );
};

export default Welcome; 