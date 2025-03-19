import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy, onSnapshot, QuerySnapshot, DocumentData, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import NavBar from '../components/NavBar';
import GamePreview from '../components/GamePreview';

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
  name: string;
  title: string;
  mapId: string;
  status: 'waiting' | 'in-progress' | 'completed';
  players: string[];
  maxPlayers: number;
  createdAt: Date;
  turnDuration?: string;
  mapSize?: string;
  gameMode?: 'conquest' | 'domination';
}

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [activeGames, setActiveGames] = useState<GameData[]>([]);
  const [availableLobbies, setAvailableLobbies] = useState<GameData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      navigate('/signin');
      return;
    }

    // Check if user is admin
    const checkAdmin = async () => {
      try {
        const userDoc = await getDocs(query(
          collection(db, 'users'),
          where('uid', '==', user.uid)
        ));
        
        if (!userDoc.empty) {
          const userData = userDoc.docs[0].data();
          setIsAdmin(userData.isAdmin === true);
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
      }
    };

    // Set up real-time listener for active games
    const activeGamesQuery = query(
      collection(db, 'games'),
      where('players', 'array-contains', user.uid),
      where('status', 'in', ['waiting', 'ongoing']),
      orderBy('createdAt', 'desc')
    );

    const activeGamesUnsubscribe = onSnapshot(
      activeGamesQuery,
      (snapshot: QuerySnapshot) => {
        try {
          const games: GameData[] = [];
          snapshot.forEach(doc => {
            const data = doc.data();
            if (data) {
              games.push({
                id: doc.id,
                name: data.name || data.title || 'Untitled Game',
                title: data.title || data.name || 'Untitled Game',
                mapId: data.mapId || '',
                status: data.status || 'waiting',
                players: data.players || [],
                maxPlayers: data.maxPlayers || 2,
                createdAt: data.createdAt?.toDate() || new Date(),
                turnDuration: data.turnDuration,
                mapSize: data.mapSize,
                gameMode: data.gameMode || 'conquest'
              });
            }
          });
          setActiveGames(games);
          setLoading(false);
        } catch (error) {
          console.error('Error processing active games:', error);
          setLoading(false);
        }
      },
      (error) => {
        console.error('Error in active games listener:', error);
        setLoading(false);
      }
    );

    // Set up real-time listener for available lobbies
    const lobbiesQuery = query(
      collection(db, 'games'),
      where('status', '==', 'waiting'),
      orderBy('createdAt', 'desc')
    );

    const lobbiesUnsubscribe = onSnapshot(
      lobbiesQuery,
      (snapshot: QuerySnapshot) => {
        try {
          const lobbies: GameData[] = [];
          snapshot.forEach(doc => {
            const data = doc.data();
            if (data && 
                !data.players?.includes(user.uid) && 
                (data.players?.length || 0) < (data.maxPlayers || 2)) {
              lobbies.push({
                id: doc.id,
                name: data.name || data.title || 'Untitled Game',
                title: data.title || data.name || 'Untitled Game',
                mapId: data.mapId || '',
                status: data.status || 'waiting',
                players: data.players || [],
                maxPlayers: data.maxPlayers || 2,
                createdAt: data.createdAt?.toDate() || new Date(),
                turnDuration: data.turnDuration,
                mapSize: data.mapSize,
                gameMode: data.gameMode || 'conquest'
              });
            }
          });
          setAvailableLobbies(lobbies);
        } catch (error) {
          console.error('Error processing available lobbies:', error);
        }
      },
      (error) => {
        console.error('Error in lobbies listener:', error);
      }
    );

    checkAdmin();

    return () => {
      activeGamesUnsubscribe();
      lobbiesUnsubscribe();
    };
  }, [navigate]);

  const formatDate = (date: Date) => {
    if (!date) return '';
    try {
      return new Date(date).toLocaleString();
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

  const handleJoinGame = async (gameId: string) => {
    const user = auth.currentUser;
    if (!user) {
      console.error('No user logged in');
      return;
    }

    try {
      const gameRef = doc(db, 'games', gameId);
      await updateDoc(gameRef, {
        players: arrayUnion(user.uid)
      });
      // Navigation will happen automatically due to the real-time listener
    } catch (error) {
      console.error('Error joining game:', error);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#1a1a2e', color: 'white' }}>
        <NavBar activeTab="home" />
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#1a1a2e', color: 'white' }}>
      <NavBar activeTab="home" />
      
      <div style={{ 
        padding: '2rem',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '2rem' 
        }}>
          <h1>Realms of War</h1>
        </div>
        
        {/* Main Actions */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1.5rem',
          marginBottom: '3rem'
        }}>
          <div 
            onClick={() => navigate('/create-game')}
            style={{
              backgroundColor: '#262640',
              borderRadius: '8px',
              padding: '2rem',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'transform 0.2s'
            }}
          >
            <h2 style={{ color: '#ff6b35', marginBottom: '1rem' }}>Create New Game</h2>
            <p style={{ color: '#ccc' }}>Start a new strategic campaign with friends</p>
          </div>
          
          <div 
            onClick={() => navigate('/open-games')}
            style={{
              backgroundColor: '#262640',
              borderRadius: '8px',
              padding: '2rem',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'transform 0.2s'
            }}
          >
            <h2 style={{ color: '#3a86ff', marginBottom: '1rem' }}>Join Game</h2>
            <p style={{ color: '#ccc' }}>Browse open games and join the battle</p>
          </div>
          
          {isAdmin && (
            <div 
              onClick={() => navigate('/admin')}
              style={{
                backgroundColor: '#262640',
                borderRadius: '8px',
                padding: '2rem',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'transform 0.2s'
              }}
            >
              <h2 style={{ color: '#8338ec', marginBottom: '1rem' }}>Admin Dashboard</h2>
              <p style={{ color: '#ccc' }}>Manage game content and users</p>
            </div>
          )}
        </div>
        
        {/* Active Games */}
        <div style={{ marginBottom: '3rem' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '1rem' 
          }}>
            <h2>Your Active Games</h2>
            <button
              onClick={() => navigate('/open-games')}
              style={{ 
                backgroundColor: '#4a4a8f',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              View All Games
            </button>
          </div>
          
          {activeGames.length === 0 ? (
            <div style={{ 
              backgroundColor: '#262640',
              borderRadius: '8px',
              padding: '2rem',
              textAlign: 'center'
            }}>
              <p style={{ color: '#aaa' }}>You don't have any active games.</p>
              <button
                onClick={() => navigate('/create-game')}
                style={{ 
                  backgroundColor: '#ff6b35',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  marginTop: '1rem'
                }}
              >
                Create a New Game
              </button>
            </div>
          ) : (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '1.5rem'
            }}>
              {activeGames.map(game => (
                <div
                  key={game.id}
                  onClick={() => navigate(game.status === 'waiting' ? `/lobby/${game.id}` : `/game/${game.id}`)}
                  style={{ 
                    backgroundColor: '#262640',
                    borderRadius: '8px',
                    padding: '1.5rem',
                    cursor: 'pointer',
                    transition: 'transform 0.2s'
                  }}
                >
                  <h3 style={{ marginBottom: '0.5rem' }}>{game.name}</h3>
                  <div style={{ 
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1rem'
                  }}>
                    <span style={{ 
                      backgroundColor: game.status === 'waiting' ? '#4a90e2' : '#50c878',
                      color: 'white',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.8rem'
                    }}>
                      {game.status === 'waiting' ? 'Waiting for Players' : 'In Progress'}
                    </span>
                    <span style={{ 
                      backgroundColor: '#202035',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.8rem',
                      color: '#aaa'
                    }}>
                      {game.players.length}/{game.maxPlayers}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#aaa' }}>
                    Created {formatDate(game.createdAt)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Available Lobbies */}
        <div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '1rem' 
          }}>
            <h2>Available Game Lobbies</h2>
            <button
              onClick={() => navigate('/open-games')}
              style={{ 
                backgroundColor: '#4a4a8f',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              View All Lobbies
            </button>
          </div>
          
          {availableLobbies.length === 0 ? (
            <div style={{ 
              backgroundColor: '#262640',
              borderRadius: '8px',
              padding: '2rem',
              textAlign: 'center'
            }}>
              <p style={{ color: '#aaa' }}>No available game lobbies at the moment.</p>
              <button
                onClick={() => navigate('/create-game')}
                style={{ 
                  backgroundColor: '#ff6b35',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  marginTop: '1rem'
                }}
              >
                Create a New Game
              </button>
            </div>
          ) : (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '1.5rem'
            }}>
              {availableLobbies.map(lobby => (
                <div
                  key={lobby.id}
                  onClick={() => navigate(`/lobby/${lobby.id}`)}
                  style={{ 
                    backgroundColor: '#262640',
                    borderRadius: '8px',
                    padding: '1.5rem',
                    cursor: 'pointer',
                    transition: 'transform 0.2s'
                  }}
                >
                  <h3 style={{ marginBottom: '1rem' }}>{lobby.name}</h3>
                  <div style={{ 
                    display: 'grid',
                    gap: '0.5rem',
                    fontSize: '0.9rem',
                    color: '#aaa',
                    marginBottom: '1rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Players:</span>
                      <span style={{ 
                        backgroundColor: '#202035',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.8rem'
                      }}>
                        {lobby.players.length}/{lobby.maxPlayers}
                      </span>
                    </div>
                    {lobby.mapSize && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Map Size:</span>
                        <span>{lobby.mapSize}</span>
                      </div>
                    )}
                    {lobby.turnDuration && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Turn Duration:</span>
                        <span>{lobby.turnDuration} hours</span>
                      </div>
                    )}
                    {lobby.gameMode && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Mode:</span>
                        <span style={{ textTransform: 'capitalize' }}>{lobby.gameMode}</span>
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#666' }}>
                    Created {formatDate(lobby.createdAt)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home; 