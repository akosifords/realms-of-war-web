import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  updateDoc, 
  arrayUnion,
  getDocs,
  QuerySnapshot,
  QueryDocumentSnapshot,
  orderBy
} from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import NavBar from '../components/NavBar';

interface Game {
  id: string;
  gameId?: string;
  title: string;
  name: string;
  createdBy: string;
  players: string[];
  maxPlayers: number;
  mapSize: string;
  turnDuration: string;
  status: 'waiting' | 'ongoing' | 'completed';
  createdAt: Date;
  selectedMapId?: string;
  mapId?: string;
}

const OpenGames: React.FC = () => {
  const navigate = useNavigate();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      navigate('/signin');
      return;
    }

    // Query both games and lobbies collections for waiting games
    const fetchGames = async () => {
      try {
        // Query games collection
        const gamesQuery = query(
          collection(db, 'games'),
          where('status', '==', 'waiting'),
          orderBy('createdAt', 'desc')
        );
        
        const gamesSnapshot = await getDocs(gamesQuery);
        const availableGames: Game[] = [];
        
        gamesSnapshot.forEach((docSnapshot) => {
          const data = docSnapshot.data();
          if (!data.players.includes(user.uid) && data.players.length < data.maxPlayers) {
            availableGames.push({
              id: docSnapshot.id,
              gameId: docSnapshot.id,
              title: data.title || data.name,
              name: data.name,
              createdBy: data.createdBy,
              players: data.players,
              maxPlayers: data.maxPlayers,
              mapSize: data.mapSize,
              turnDuration: data.turnDuration,
              status: data.status,
              createdAt: data.createdAt?.toDate(),
              selectedMapId: data.selectedMapId,
              mapId: data.mapId
            });
          }
        });

        setGames(availableGames);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching games:", err);
        setError('Failed to load available games');
        setLoading(false);
      }
    };

    // Set up real-time listener for changes
    const gamesQuery = query(
      collection(db, 'games'),
      where('status', '==', 'waiting'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      gamesQuery,
      (snapshot: QuerySnapshot) => {
        try {
          const availableGames: Game[] = [];
          snapshot.forEach((docSnapshot: QueryDocumentSnapshot) => {
            const data = docSnapshot.data();
            if (!data.players.includes(user.uid) && data.players.length < data.maxPlayers) {
              availableGames.push({
                id: docSnapshot.id,
                gameId: docSnapshot.id,
                title: data.title || data.name,
                name: data.name,
                createdBy: data.createdBy,
                players: data.players,
                maxPlayers: data.maxPlayers,
                mapSize: data.mapSize,
                turnDuration: data.turnDuration,
                status: data.status,
                createdAt: data.createdAt?.toDate(),
                selectedMapId: data.selectedMapId,
                mapId: data.mapId
              });
            }
          });
          setGames(availableGames);
          setLoading(false);
        } catch (err) {
          console.error("Error processing games data:", err);
          setError('Failed to load available games');
          setLoading(false);
        }
      },
      (err) => {
        console.error("Error in games snapshot listener:", err);
        setError('Error loading available games');
        setLoading(false);
      }
    );

    // Initial fetch
    fetchGames();

    return () => unsubscribe();
  }, [navigate]);

  const joinGame = async (game: Game) => {
    const user = auth.currentUser;
    if (!user) return;

    const gameId = game.gameId || game.id;
    setJoining(game.id);
    setError('');

    try {
      // Add the user to the game's players array
      await updateDoc(doc(db, 'games', gameId), {
        players: arrayUnion(user.uid)
      });

      // Navigate to the game lobby
      navigate(`/lobby/${gameId}`);
    } catch (err: any) {
      console.error("Error joining game:", err);
      setError(err.message || 'Failed to join game');
      setJoining(null);
    }
  };

  const formatDate = (date: Date) => {
    if (!date) return '';
    return new Date(date).toLocaleString();
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#1a1a2e', color: 'white' }}>
      <NavBar activeTab="join-game" />
      
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
          <h1>Available Games</h1>
          <button 
            onClick={() => navigate('/create-game')}
            style={{ 
              backgroundColor: '#ff6b35', 
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Create New Game
          </button>
        </div>
        
        {error && (
          <div style={{ 
            color: '#ff6b6b', 
            marginBottom: '1rem',
            padding: '1rem',
            backgroundColor: 'rgba(255, 107, 107, 0.1)',
            borderRadius: '4px'
          }}>
            {error}
          </div>
        )}
        
        {loading ? (
          <div style={{ 
            backgroundColor: '#262640',
            borderRadius: '8px',
            padding: '2rem',
            textAlign: 'center'
          }}>
            <p>Loading available games...</p>
          </div>
        ) : games.length === 0 ? (
          <div style={{ 
            backgroundColor: '#262640',
            borderRadius: '8px',
            padding: '2rem',
            textAlign: 'center'
          }}>
            <p style={{ color: '#aaa', marginBottom: '1rem' }}>No available games to join at the moment.</p>
            <button 
              onClick={() => navigate('/create-game')}
              style={{ 
                backgroundColor: '#ff6b35', 
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Create New Game
            </button>
          </div>
        ) : (
          <div style={{ 
            backgroundColor: '#262640',
            borderRadius: '8px',
            overflow: 'hidden'
          }}>
            <table style={{ 
              width: '100%',
              borderCollapse: 'collapse'
            }}>
              <thead>
                <tr>
                  <th style={{ 
                    padding: '1rem',
                    textAlign: 'left',
                    borderBottom: '1px solid #333',
                    backgroundColor: '#202035'
                  }}>
                    Game
                  </th>
                  <th style={{ 
                    padding: '1rem',
                    textAlign: 'left',
                    borderBottom: '1px solid #333',
                    backgroundColor: '#202035'
                  }}>
                    Players
                  </th>
                  <th style={{ 
                    padding: '1rem',
                    textAlign: 'left',
                    borderBottom: '1px solid #333',
                    backgroundColor: '#202035'
                  }}>
                    Details
                  </th>
                  <th style={{ 
                    padding: '1rem',
                    textAlign: 'center',
                    borderBottom: '1px solid #333',
                    backgroundColor: '#202035',
                    width: '150px'
                  }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {games.map((game) => (
                  <tr 
                    key={game.id} 
                    style={{ 
                      borderBottom: '1px solid #333',
                      backgroundColor: '#262640',
                      transition: 'background-color 0.2s'
                    }}
                  >
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>
                        {game.title || game.name}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#aaa' }}>
                        Created {formatDate(game.createdAt)}
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        backgroundColor: '#202035',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.9rem'
                      }}>
                        <span style={{ color: '#fff' }}>{game.players.length}</span>
                        <span style={{ color: '#666', margin: '0 0.25rem' }}>/</span>
                        <span style={{ color: '#fff' }}>{game.maxPlayers}</span>
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontSize: '0.9rem', color: '#ccc' }}>
                        <div>Map Size: {game.mapSize}</div>
                        <div>Turn Duration: {game.turnDuration} hours</div>
                      </div>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <button
                        onClick={() => joinGame(game)}
                        disabled={joining === game.id}
                        style={{ 
                          backgroundColor: joining === game.id ? '#666' : '#ff6b35',
                          color: 'white',
                          border: 'none',
                          padding: '0.75rem 1.5rem',
                          borderRadius: '4px',
                          cursor: joining === game.id ? 'not-allowed' : 'pointer',
                          width: '100%',
                          maxWidth: '120px'
                        }}
                      >
                        {joining === game.id ? 'Joining...' : 'Join'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default OpenGames; 