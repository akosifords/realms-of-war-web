import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import NavBar from '../components/NavBar';
import MapDetailsView from '../components/MapDetailsView';

const GameScene: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [gameData, setGameData] = useState<any>(null);
  const [showMapDetails, setShowMapDetails] = useState(false);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      navigate('/signin');
      return;
    }

    if (!id) return;

    const fetchGame = async () => {
      try {
        const gameDoc = await getDoc(doc(db, 'games', id));
        if (gameDoc.exists()) {
          const data = gameDoc.data();
          
          if (!data.players.includes(user.uid)) {
            setError('You are not a player in this game');
            setLoading(false);
            return;
          }

          setGameData({ id: gameDoc.id, ...data });
          setLoading(false);
        } else {
          setError('Game not found');
          setLoading(false);
        }
      } catch (err: any) {
        setError(err.message || 'Error loading game');
        setLoading(false);
      }
    };

    fetchGame();
  }, [id, navigate]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#1a1a2e', color: 'white' }}>
        <NavBar />
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <p>Loading game...</p>
        </div>
      </div>
    );
  }

  if (error || !gameData) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#1a1a2e', color: 'white' }}>
        <NavBar />
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <p style={{ color: '#ff6b6b' }}>{error || 'Game not found'}</p>
          <button 
            onClick={() => navigate('/home')}
            style={{ 
              backgroundColor: '#4a4a8f', 
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '4px',
              cursor: 'pointer',
              marginTop: '1rem'
            }}
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#1a1a2e', color: 'white' }}>
      <NavBar />
      
      <div style={{ padding: '1rem' }}>
        <h1 style={{ marginBottom: '1rem' }}>{gameData.name}</h1>
        
        <div style={{ 
          padding: '1rem',
          backgroundColor: '#262640',
          borderRadius: '8px',
          marginBottom: '1rem'
        }}>
          <div style={{ 
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '1rem'
          }}>
            <div>Game Mode: {gameData.gameMode || 'Conquest'}</div>
            <div>Turn: {gameData.currentTurn || 0}</div>
            <div>Players: {gameData.players.length}/{gameData.maxPlayers}</div>
          </div>
          
          <div style={{ 
            display: 'flex',
            gap: '1rem',
            marginBottom: '1rem',
            flexWrap: 'wrap'
          }}>
            <button 
              style={{ 
                backgroundColor: '#4a4a8f', 
                color: 'white',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Play
            </button>
            <button 
              style={{ 
                backgroundColor: '#4a4a8f', 
                color: 'white',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Players
            </button>
            <button 
              onClick={() => setShowMapDetails(!showMapDetails)}
              style={{ 
                backgroundColor: showMapDetails ? '#ff6b35' : '#4a4a8f', 
                color: 'white',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              {showMapDetails ? 'Hide Map Info' : 'Map Info'}
            </button>
            <button 
              style={{ 
                backgroundColor: '#4a4a8f', 
                color: 'white',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Turn Info
            </button>
            <button 
              style={{ 
                backgroundColor: '#4a4a8f', 
                color: 'white',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Tech
            </button>
            <button 
              style={{ 
                backgroundColor: '#4a4a8f', 
                color: 'white',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Armies
            </button>
          </div>
        </div>
        
        {/* Map Details Section */}
        {showMapDetails && gameData.mapId && (
          <div style={{ marginBottom: '1rem' }}>
            <MapDetailsView mapId={gameData.mapId} />
          </div>
        )}
        
        <div style={{ 
          backgroundColor: '#262640',
          borderRadius: '8px',
          height: '600px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <p>Game map and interface will be implemented here.</p>
          <p>The 2D civilization turn-based strategy game UI.</p>
        </div>
      </div>
    </div>
  );
};

export default GameScene; 