import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import NavBar from '../components/NavBar';
import GamePreview from '../components/GamePreview';

interface GameData {
  id: string;
  name: string;
  mapId: string;
  status: 'waiting' | 'in-progress' | 'completed';
  players: string[];
  maxPlayers: number;
  createdAt: Date;
  createdBy: string;
  gameMode?: 'conquest' | 'domination';
}

const Games: React.FC = () => {
  const navigate = useNavigate();
  const [games, setGames] = useState<GameData[]>([]);
  const [myGames, setMyGames] = useState<GameData[]>([]);
  const [openGames, setOpenGames] = useState<GameData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'my-games' | 'open-games'>('my-games');

  useEffect(() => {
    const fetchGames = async () => {
      if (!auth.currentUser) {
        navigate('/signin');
        return;
      }

      setLoading(true);
      
      try {
        const userId = auth.currentUser.uid;
        
        // Fetch all games
        const gamesCollection = collection(db, 'games');
        const gamesSnapshot = await getDocs(gamesCollection);
        
        const allGames: GameData[] = [];
        gamesSnapshot.forEach(doc => {
          allGames.push({
            id: doc.id,
            ...doc.data() as Omit<GameData, 'id'>
          });
        });
        
        setGames(allGames);
        
        // Filter games for current user
        const userGames = allGames.filter(game => 
          game.players.includes(userId)
        );
        setMyGames(userGames);
        
        // Filter open games (waiting and not full)
        const availableGames = allGames.filter(game => 
          game.status === 'waiting' && 
          game.players.length < game.maxPlayers &&
          !game.players.includes(userId)
        );
        setOpenGames(availableGames);
      } catch (error) {
        console.error('Error fetching games:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchGames();
  }, [navigate]);
  
  const handleJoinGame = (gameId: string) => {
    // In a real implementation, you would add the user to the game here
    navigate(`/game/${gameId}`);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#1a1a2e', color: 'white' }}>
        <NavBar />
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <p>Loading games...</p>
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
          <h1>Games</h1>
          <button
            onClick={() => navigate('/create-game')}
            style={{ 
              backgroundColor: '#ff6b35',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Create New Game
          </button>
        </div>
        
        {/* Tabs */}
        <div style={{ 
          display: 'flex',
          marginBottom: '1.5rem',
          borderBottom: '1px solid #333'
        }}>
          <button
            onClick={() => setActiveTab('my-games')}
            style={{
              backgroundColor: 'transparent',
              color: activeTab === 'my-games' ? '#ff6b35' : '#aaa',
              border: 'none',
              borderBottom: activeTab === 'my-games' ? '2px solid #ff6b35' : 'none',
              padding: '0.75rem 1.5rem',
              cursor: 'pointer',
              fontWeight: activeTab === 'my-games' ? 'bold' : 'normal',
              fontSize: '1.1rem'
            }}
          >
            My Games
          </button>
          
          <button
            onClick={() => setActiveTab('open-games')}
            style={{
              backgroundColor: 'transparent',
              color: activeTab === 'open-games' ? '#ff6b35' : '#aaa',
              border: 'none',
              borderBottom: activeTab === 'open-games' ? '2px solid #ff6b35' : 'none',
              padding: '0.75rem 1.5rem',
              cursor: 'pointer',
              fontWeight: activeTab === 'open-games' ? 'bold' : 'normal',
              fontSize: '1.1rem'
            }}
          >
            Open Games
          </button>
        </div>
        
        {/* Game List */}
        {activeTab === 'my-games' ? (
          myGames.length === 0 ? (
            <div style={{ 
              backgroundColor: '#262640',
              borderRadius: '8px',
              padding: '2rem',
              textAlign: 'center'
            }}>
              <p style={{ color: '#aaa', marginBottom: '1rem' }}>You haven't joined any games yet.</p>
              <button
                onClick={() => setActiveTab('open-games')}
                style={{ 
                  backgroundColor: '#4a4a8f',
                  color: 'white',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Browse Open Games
              </button>
            </div>
          ) : (
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '1.5rem'
            }}>
              {myGames.map(game => (
                <GamePreview
                  key={game.id}
                  game={game}
                  onClick={() => navigate(`/game/${game.id}`)}
                />
              ))}
            </div>
          )
        ) : (
          openGames.length === 0 ? (
            <div style={{ 
              backgroundColor: '#262640',
              borderRadius: '8px',
              padding: '2rem',
              textAlign: 'center'
            }}>
              <p style={{ color: '#aaa', marginBottom: '1rem' }}>There are no open games available to join.</p>
              <button
                onClick={() => navigate('/create-game')}
                style={{ 
                  backgroundColor: '#ff6b35',
                  color: 'white',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Create New Game
              </button>
            </div>
          ) : (
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '1.5rem'
            }}>
              {openGames.map(game => (
                <GamePreview
                  key={game.id}
                  game={game}
                  onClick={() => handleJoinGame(game.id)}
                />
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default Games; 