import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import NavBar from '../components/NavBar';
import MapPreview from '../components/MapPreview';

interface GameMap {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  createdBy: string;
  tiles: any[];
  hexagonal: boolean;
  mapSize: { width: number; height: number };
  playerCount: number;
  previewUrl?: string;
}

interface GameSettings {
  name: string;
  mapId: string;
  maxPlayers: number;
  createdBy: string;
  createdAt: Date;
  status: 'waiting' | 'in-progress' | 'completed';
  players: string[];
  gameMode: 'conquest' | 'domination';
}

const CreateGame: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [maps, setMaps] = useState<GameMap[]>([]);
  const [selectedMapId, setSelectedMapId] = useState<string | null>(null);
  const [gameName, setGameName] = useState('');
  const [gameMode, setGameMode] = useState<'conquest' | 'domination'>('conquest');
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [selectedMap, setSelectedMap] = useState<GameMap | null>(null);

  useEffect(() => {
    const loadMaps = async () => {
      try {
        const mapsCollection = collection(db, 'maps');
        const snapshot = await getDocs(mapsCollection);
        const loadedMaps: GameMap[] = [];
        
        snapshot.forEach(doc => {
          loadedMaps.push({
            id: doc.id,
            ...doc.data() as Omit<GameMap, 'id'>
          });
        });
        
        setMaps(loadedMaps);
        
        // Select the first map by default if available
        if (loadedMaps.length > 0) {
          setSelectedMapId(loadedMaps[0].id);
          setSelectedMap(loadedMaps[0]);
        }
      } catch (err: any) {
        console.error('Error loading maps:', err);
        setError('Error loading maps');
      } finally {
        setLoading(false);
      }
    };
    
    loadMaps();
  }, []);

  // Update selected map when the ID changes
  useEffect(() => {
    if (selectedMapId) {
      const map = maps.find(m => m.id === selectedMapId) || null;
      setSelectedMap(map);
    } else {
      setSelectedMap(null);
    }
  }, [selectedMapId, maps]);

  const handleCreateGame = async () => {
    if (!gameName.trim()) {
      setError('Please enter a game name');
      return;
    }
    
    if (!selectedMapId) {
      setError('Please select a map');
      return;
    }
    
    const user = auth.currentUser;
    if (!user) {
      setError('You must be logged in');
      navigate('/signin');
      return;
    }
    
    setCreating(true);
    setError('');
    
    try {
      const selectedMap = maps.find(map => map.id === selectedMapId);
      if (!selectedMap) {
        throw new Error('Selected map not found');
      }
      
      const gameData: GameSettings = {
        name: gameName,
        mapId: selectedMapId,
        maxPlayers: selectedMap.playerCount,
        createdBy: user.uid,
        createdAt: new Date(),
        status: 'waiting',
        players: [user.uid], // Creator is the first player
        gameMode: gameMode
      };
      
      const docRef = await addDoc(collection(db, 'games'), gameData);
      navigate(`/lobby/${docRef.id}`);
    } catch (err: any) {
      console.error('Error creating game:', err);
      setError(err.message || 'Error creating game');
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#1a1a2e', color: 'white' }}>
        <NavBar />
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <p>Loading maps...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#1a1a2e', color: 'white' }}>
      <NavBar />
      
      <div style={{ padding: '2rem' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '2rem' 
        }}>
          <h1>Create New Game</h1>
          <button
            onClick={() => navigate('/home')}
            style={{ 
              backgroundColor: '#4a4a8f',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Back to Home
          </button>
        </div>
        
        {error && (
          <div style={{ 
            backgroundColor: '#5c0a0a', 
            color: '#ff6b6b', 
            padding: '1rem', 
            borderRadius: '4px',
            marginBottom: '1.5rem'
          }}>
            {error}
          </div>
        )}
        
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: '1fr 300px',
          gap: '2rem',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          {/* Map Selection */}
          <div>
            <div style={{ 
              backgroundColor: '#262640',
              borderRadius: '8px',
              padding: '1.5rem',
              marginBottom: '1.5rem'
            }}>
              <h2 style={{ marginBottom: '1.5rem' }}>Select Map</h2>
              
              {maps.length === 0 ? (
                <p style={{ color: '#aaa' }}>No maps available. Please create a map first.</p>
              ) : (
                <div>
                  <div style={{ 
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'flex-start',
                    gap: '1rem',
                    marginBottom: '1.5rem'
                  }}>
                    {maps.map(map => (
                      <MapPreview
                        key={map.id}
                        map={map}
                        selected={selectedMapId === map.id}
                        onClick={() => setSelectedMapId(map.id)}
                      />
                    ))}
                  </div>
                  
                  {selectedMap && (
                    <div style={{ 
                      backgroundColor: '#1a1a2e',
                      borderRadius: '4px',
                      padding: '1rem',
                      marginTop: '1.5rem'
                    }}>
                      <h3 style={{ marginBottom: '0.5rem' }}>{selectedMap.name}</h3>
                      <p style={{ 
                        fontSize: '0.9rem', 
                        color: '#ccc',
                        marginBottom: '0.5rem'
                      }}>
                        {selectedMap.description}
                      </p>
                      <div style={{ 
                        display: 'flex',
                        gap: '1.5rem',
                        fontSize: '0.9rem',
                        color: '#aaa',
                        marginTop: '1rem'
                      }}>
                        <div>Size: {selectedMap.mapSize.width} x {selectedMap.mapSize.height}</div>
                        <div>Players: {selectedMap.playerCount}</div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Game Settings */}
          <div>
            <div style={{ 
              backgroundColor: '#262640',
              borderRadius: '8px',
              padding: '1.5rem',
              marginBottom: '1.5rem'
            }}>
              <h2 style={{ marginBottom: '1.5rem' }}>Game Settings</h2>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <label htmlFor="gameName" style={{ display: 'block', marginBottom: '0.5rem' }}>
                  Game Name
                </label>
                <input
                  type="text"
                  id="gameName"
                  value={gameName}
                  onChange={(e) => setGameName(e.target.value)}
                  placeholder="Enter game name"
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem', 
                    backgroundColor: '#1a1a2e', 
                    border: '1px solid #333',
                    borderRadius: '4px',
                    color: 'white'
                  }}
                />
              </div>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <label htmlFor="gameMode" style={{ display: 'block', marginBottom: '0.5rem' }}>
                  Game Mode
                </label>
                <select
                  id="gameMode"
                  value={gameMode}
                  onChange={(e) => setGameMode(e.target.value as 'conquest' | 'domination')}
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem', 
                    backgroundColor: '#1a1a2e', 
                    border: '1px solid #333',
                    borderRadius: '4px',
                    color: 'white'
                  }}
                >
                  <option value="conquest">Conquest</option>
                  <option value="domination">Domination</option>
                </select>
              </div>
              
              <button
                onClick={handleCreateGame}
                disabled={creating || !selectedMapId}
                style={{ 
                  backgroundColor: (!selectedMapId || creating) ? '#666' : '#ff6b35',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '4px',
                  cursor: (!selectedMapId || creating) ? 'not-allowed' : 'pointer',
                  width: '100%'
                }}
              >
                {creating ? 'Creating Game...' : 'Create Game'}
              </button>
            </div>
            
            {selectedMap && (
              <div style={{ 
                backgroundColor: '#262640',
                borderRadius: '8px',
                padding: '1.5rem'
              }}>
                <h3 style={{ marginBottom: '1rem' }}>Selected Map</h3>
                <p style={{ color: '#ccc' }}>{selectedMap.name}</p>
                <p style={{ 
                  fontSize: '0.9rem', 
                  color: '#aaa', 
                  marginTop: '0.5rem' 
                }}>
                  This map requires {selectedMap.playerCount} players.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateGame; 