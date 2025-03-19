import React from 'react';
import NavBar from '../components/NavBar';

const Rules: React.FC = () => {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#1a1a2e', color: 'white' }}>
      <NavBar activeTab="rules" />
      
      <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ marginBottom: '2rem' }}>Game Rules</h1>
        
        <div style={{ 
          backgroundColor: '#262640',
          borderRadius: '8px',
          padding: '2rem',
          textAlign: 'left'
        }}>
          <p style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>
            The rules for Realms of War will be added soon. The game is still in beta version.
          </p>
          
          <p style={{ marginBottom: '1rem' }}>
            Realms of War is a turn-based strategy game where players build and expand civilizations, 
            manage resources, research technologies, and engage in diplomacy or warfare with other players.
          </p>
          
          <p>
            Check back later for detailed rules and gameplay instructions.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Rules; 