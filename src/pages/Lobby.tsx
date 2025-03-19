import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, onSnapshot, updateDoc, deleteDoc, DocumentSnapshot, arrayUnion } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import NavBar from '../components/NavBar';
import MapSelector from '../components/MapSelector';
import MapDetailsView from '../components/MapDetailsView';

interface Player {
  id: string;
  username: string;
}

interface MapDetails {
  id: string;
  name: string;
  description: string;
  size: string;
  terrainType: string;
}

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

interface GameData {
  id: string;
  title: string;
  createdBy: string;
  players: string[];
  maxPlayers: number;
  turnDuration: string;
  mapSize: string;
  resourceType: string;
  terranType: string;
  status: 'waiting' | 'ongoing' | 'completed';
  selectedMapId?: string; // Store the selected map ID
  name: string;
  mapId: string;
  gameMode?: 'conquest' | 'domination';
}

const Lobby: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [game, setGame] = useState<GameData | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCreator, setIsCreator] = useState(false);
  const [showMapSelector, setShowMapSelector] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedMap, setSelectedMap] = useState<GameMap | null>(null);
  const [showMapDetails, setShowMapDetails] = useState(false);
  const [isMember, setIsMember] = useState(false);

  useEffect(() => {
    if (!id) return;

    const user = auth.currentUser;
    if (!user) {
      navigate('/signin');
      return;
    }

    // Subscribe to game document changes with proper error handling
    const unsubscribe = onSnapshot(
      doc(db, 'games', id),
      // Success callback
      async (docSnapshot: DocumentSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data() as Omit<GameData, 'id'>;
          const gameData = { id: docSnapshot.id, ...data };
          setGame(gameData);
          setIsCreator(user.uid === data.createdBy);
          setIsMember(data.players.includes(user.uid));
          
          // Fetch map details if a map is selected
          if (data.selectedMapId || data.mapId) {
            try {
              const mapId = data.selectedMapId || data.mapId;
              const mapDoc = await getDoc(doc(db, 'maps', mapId));
              if (mapDoc.exists()) {
                const mapData = mapDoc.data();
                setSelectedMap({
                  id: mapDoc.id,
                  name: mapData.name,
                  description: mapData.description,
                  createdAt: mapData.createdAt,
                  createdBy: mapData.createdBy,
                  tiles: mapData.tiles || [],
                  hexagonal: mapData.hexagonal || true,
                  mapSize: mapData.mapSize || { width: 0, height: 0 },
                  playerCount: mapData.playerCount || 2,
                  previewUrl: mapData.previewUrl
                });
              }
            } catch (err) {
              console.error("Error fetching map details:", err);
            }
          }
          
          try {
            // Get player details
            const playerPromises = data.players.map(async (playerId) => {
              try {
                const playerDocRef = doc(db, 'users', playerId);
                const playerDocSnap = await getDoc(playerDocRef);
                
                if (playerDocSnap.exists()) {
                  const userData = playerDocSnap.data();
                  return {
                    id: playerId,
                    username: userData.username || 'Unnamed Player'
                  };
                } else {
                  return {
                    id: playerId,
                    username: playerId === user.uid ? 'You' : 'Unknown Player'
                  };
                }
              } catch (err) {
                console.error("Error fetching player data:", err);
                return {
                  id: playerId,
                  username: 'Player ' + playerId.substring(0, 5)
                };
              }
            });
            
            const playerData = await Promise.all(playerPromises);
            setPlayers(playerData);
          } catch (err) {
            console.error("Error processing players:", err);
            // Create fallback player data if fetching fails
            const fallbackPlayers = data.players.map(playerId => ({
              id: playerId,
              username: playerId === user.uid ? 'You' : 'Player ' + playerId.substring(0, 5)
            }));
            setPlayers(fallbackPlayers);
          }
          
          setLoading(false);
        } else {
          setError('Game not found');
          setLoading(false);
        }
      },
      // Error callback
      (err) => {
        console.error("Error in snapshot listener:", err);
        setError('Error loading game data');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [id, navigate]);

  const startGame = async () => {
    if (!game || !isCreator) return;
    
    try {
      // Update games collection
      await updateDoc(doc(db, 'games', game.id), {
        status: 'ongoing',
        currentTurn: 0,
        // Here we would also initialize the game map and other game state
      });
      
      // Remove from lobbies collection since it's no longer waiting
      try {
        // Using a direct reference to doc without requiring the deleteDoc function
        await updateDoc(doc(db, 'lobbies', game.id), {
          status: 'ongoing' // Update status instead of deleting
        });
      } catch (error) {
        console.error("Error updating lobby status:", error);
        // Continue even if this fails
      }
      
      navigate(`/game/${game.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to start game');
    }
  };

  const deleteLobby = async () => {
    if (!game || !isCreator || !id) return;
    
    try {
      // Delete from games collection
      await deleteDoc(doc(db, 'games', id));
      
      // Delete from lobbies collection
      try {
        await deleteDoc(doc(db, 'lobbies', id));
      } catch (error) {
        console.error("Error deleting from lobbies collection:", error);
        // Continue even if this fails
      }
      
      navigate('/home');
    } catch (err: any) {
      setError(err.message || 'Failed to delete game lobby');
    }
  };

  const leaveGame = async () => {
    if (!game || !id) return;
    
    const user = auth.currentUser;
    if (!user) return;
    
    try {
      // Update the players array to remove the current user
      await updateDoc(doc(db, 'games', id), {
        players: game.players.filter(playerId => playerId !== user.uid)
      });
      
      // Also update in lobbies collection if it exists
      try {
        await updateDoc(doc(db, 'lobbies', id), {
          players: game.players.filter(playerId => playerId !== user.uid)
        });
      } catch (error) {
        console.error("Error updating lobbies collection:", error);
        // Continue even if this fails
      }
      
      navigate('/home');
    } catch (err: any) {
      setError(err.message || 'Failed to leave the game');
    }
  };

  const handleSelectMap = async (mapId: string) => {
    if (!game || !isCreator || !id) return;
    
    try {
      await updateDoc(doc(db, 'games', id), {
        selectedMapId: mapId
      });
      
      // Also update in lobbies collection if it exists
      try {
        await updateDoc(doc(db, 'lobbies', id), {
          selectedMapId: mapId
        });
      } catch (error) {
        console.error("Error updating lobbies collection:", error);
        // Continue even if this fails
      }
      
      console.log(`Selected map ${mapId} for game ${id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to update selected map');
    }
  };

  const handleJoinGame = async () => {
    if (!game || !id) return;
    
    const user = auth.currentUser;
    if (!user) {
      setError('You must be logged in to join a game');
      return;
    }

    try {
      // First, get the current game state to check player count
      const gameDoc = await getDoc(doc(db, 'games', id));
      if (!gameDoc.exists()) {
        throw new Error('Game not found');
      }

      const currentGame = gameDoc.data();
      const currentPlayers = currentGame.players || [];
      
      // Check if adding this player would reach max players
      const willReachMaxPlayers = currentPlayers.length + 1 >= (currentGame.maxPlayers || 2);

      // Add the player
      await updateDoc(doc(db, 'games', id), {
        players: arrayUnion(user.uid),
        // If we're reaching max players, automatically set status to ongoing
        ...(willReachMaxPlayers ? {
          status: 'ongoing',
          currentTurn: 0
        } : {})
      });

      // If we reached max players, also update the lobby status
      if (willReachMaxPlayers) {
        try {
          await updateDoc(doc(db, 'lobbies', id), {
            status: 'ongoing'
          });
        } catch (error) {
          console.error("Error updating lobby status:", error);
          // Continue even if this fails
        }

        // Navigate to the game page since it's starting
        navigate(`/game/${id}`);
      }
      // The real-time listener will update the UI for other cases
    } catch (err: any) {
      console.error('Error joining game:', err);
      setError(err.message || 'Failed to join the game');
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#1a1a2e', color: 'white' }}>
        <NavBar />
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <p>Loading game lobby...</p>
        </div>
      </div>
    );
  }

  if (error || !game) {
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
      <div style={{ 
        padding: '2rem',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <h1 style={{ marginBottom: '1rem' }}>{game.title || game.name}</h1>
        <p style={{ marginBottom: '2rem' }}>Waiting for players ({players.length}/{game.maxPlayers})</p>
        
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: '1fr 300px',
          gap: '2rem'
        }}>
          {/* Left Panel - Map Preview and Details */}
          <div style={{ 
            backgroundColor: '#262640',
            padding: '2rem',
            borderRadius: '8px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            <h3 style={{ marginBottom: '1.5rem', alignSelf: 'flex-start' }}>Game Map</h3>
            
            {selectedMap && (
              <>
                <div style={{ 
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'center',
                  marginBottom: '1.5rem'
                }}>
                  {selectedMap.previewUrl && (
                    <img 
                      src={selectedMap.previewUrl} 
                      alt={selectedMap.name}
                      style={{
                        maxWidth: '100%',
                        maxHeight: '400px',
                        objectFit: 'contain',
                        borderRadius: '4px'
                      }}
                    />
                  )}
                </div>
                
                <div style={{ 
                  width: '100%',
                  backgroundColor: '#1a1a2e',
                  padding: '1.5rem',
                  borderRadius: '4px'
                }}>
                  <h4 style={{ marginBottom: '1rem' }}>{selectedMap.name}</h4>
                  <p style={{ 
                    color: '#ccc',
                    marginBottom: '1rem',
                    fontSize: '0.9rem'
                  }}>
                    {selectedMap.description}
                  </p>
                  <div style={{ 
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '1rem',
                    color: '#aaa',
                    fontSize: '0.9rem'
                  }}>
                    <div>Size: {selectedMap.mapSize.width} x {selectedMap.mapSize.height}</div>
                    <div>Players: {selectedMap.playerCount}</div>
                  </div>
                </div>
                
                <div style={{ marginTop: '1.5rem', width: '100%' }}>
                  <button
                    onClick={() => setShowMapDetails(!showMapDetails)}
                    style={{
                      backgroundColor: showMapDetails ? '#ff6b35' : '#4a4a8f',
                      color: 'white',
                      border: 'none',
                      padding: '0.75rem 1.5rem',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      width: '100%'
                    }}
                  >
                    {showMapDetails ? 'Hide Map Details' : 'Show Map Details'}
                  </button>
                  
                  {showMapDetails && selectedMap.id && (
                    <div style={{ marginTop: '1rem' }}>
                      <MapDetailsView mapId={selectedMap.id} />
                    </div>
                  )}
                </div>
              </>
            )}
            
            {isCreator && (
              <button
                onClick={() => setShowMapSelector(true)}
                style={{ 
                  backgroundColor: '#4a4a8f',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  width: '100%',
                  marginTop: '1.5rem'
                }}
              >
                Change Map
              </button>
            )}
          </div>

          {/* Right Panel - Game Details and Players */}
          <div>
            <div style={{ 
              backgroundColor: '#262640',
              padding: '1.5rem',
              borderRadius: '8px',
              marginBottom: '1.5rem'
            }}>
              <h3 style={{ marginBottom: '1rem' }}>Game Details</h3>
              <div style={{ 
                display: 'grid',
                gap: '0.5rem',
                color: '#ccc',
                fontSize: '0.9rem'
              }}>
                <div>Turn Duration: {game.turnDuration} hours</div>
                <div>Max Players: {game.maxPlayers}</div>
                <div>Game Mode: {game.gameMode || 'Conquest'}</div>
              </div>
            </div>

            <div style={{ 
              backgroundColor: '#262640',
              padding: '1.5rem',
              borderRadius: '8px',
              marginBottom: '1.5rem'
            }}>
              <h3 style={{ marginBottom: '1rem' }}>Players</h3>
              <div style={{ 
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
              }}>
                {players.map((player) => (
                  <div 
                    key={player.id}
                    style={{ 
                      padding: '0.75rem',
                      backgroundColor: '#1a1a2e',
                      borderRadius: '4px',
                      color: '#ccc',
                      fontSize: '0.9rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <span>{player.username}</span>
                    {player.id === game.createdBy && (
                      <span style={{ 
                        backgroundColor: '#4a4a8f',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.8rem'
                      }}>
                        Host
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ 
              display: 'flex',
              gap: '1rem',
              marginTop: '2rem'
            }}>
              {isCreator ? (
                <>
                  <button
                    onClick={startGame}
                    disabled={players.length < 2 || !selectedMap}
                    style={{ 
                      backgroundColor: players.length < 2 || !selectedMap ? '#666' : '#ff6b35',
                      color: 'white',
                      border: 'none',
                      padding: '0.75rem 1.5rem',
                      borderRadius: '4px',
                      cursor: players.length < 2 || !selectedMap ? 'not-allowed' : 'pointer',
                      flex: 1
                    }}
                  >
                    Start Game
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    style={{ 
                      backgroundColor: '#ff4444',
                      color: 'white',
                      border: 'none',
                      padding: '0.75rem 1.5rem',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Delete
                  </button>
                </>
              ) : isMember ? (
                <button
                  onClick={leaveGame}
                  style={{ 
                    backgroundColor: '#ff4444',
                    color: 'white',
                    border: 'none',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    width: '100%'
                  }}
                >
                  Leave Game
                </button>
              ) : (
                <button
                  onClick={handleJoinGame}
                  disabled={players.length >= (game?.maxPlayers || 2)}
                  style={{ 
                    backgroundColor: players.length >= (game?.maxPlayers || 2) ? '#666' : '#3a86ff',
                    color: 'white',
                    border: 'none',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '4px',
                    cursor: players.length >= (game?.maxPlayers || 2) ? 'not-allowed' : 'pointer',
                    width: '100%'
                  }}
                >
                  {players.length >= (game?.maxPlayers || 2) ? 'Game Full' : 'Join Game'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Map Selector Modal */}
      {showMapSelector && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <MapSelector
            mapSize={game.mapSize}
            terrainType={game.terranType}
            onClose={() => setShowMapSelector(false)}
            onSelectMap={handleSelectMap}
          />
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#262640',
            padding: '2rem',
            borderRadius: '8px',
            maxWidth: '400px',
            width: '100%'
          }}>
            <h3 style={{ marginBottom: '1rem' }}>Delete Game?</h3>
            <p style={{ marginBottom: '2rem', color: '#ccc' }}>
              Are you sure you want to delete this game? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                style={{ 
                  backgroundColor: '#4a4a8f',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  flex: 1
                }}
              >
                Cancel
              </button>
              <button
                onClick={deleteLobby}
                style={{ 
                  backgroundColor: '#ff4444',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  flex: 1
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Lobby; 