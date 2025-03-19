import React from 'react';

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

interface GamePreviewProps {
  game: GameData;
  onClick: () => void;
}

const GamePreview: React.FC<GamePreviewProps> = ({ game, onClick }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting':
        return '#4a90e2'; // Blue
      case 'in-progress':
        return '#50c878'; // Green
      case 'completed':
        return '#aaaaaa'; // Gray
      default:
        return '#ffffff';
    }
  };

  const formatDate = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleString();
  };

  const statusText = {
    'waiting': 'Waiting for Players',
    'in-progress': 'In Progress',
    'completed': 'Completed'
  };

  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: '#262640',
        borderRadius: '8px',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'transform 0.2s',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%'
      }}
    >
      <div style={{ 
        padding: '1rem',
        borderBottom: '1px solid #333',
        backgroundColor: '#202035'
      }}>
        <h3 style={{ 
          margin: 0,
          fontSize: '1.1rem',
          textOverflow: 'ellipsis',
          overflow: 'hidden',
          whiteSpace: 'nowrap'
        }}>
          {game.name}
        </h3>
      </div>
      
      <div style={{ padding: '1rem', flexGrow: 1 }}>
        <div style={{ 
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '0.75rem'
        }}>
          <span style={{ 
            backgroundColor: getStatusColor(game.status),
            color: '#fff',
            fontSize: '0.8rem',
            padding: '0.25rem 0.5rem',
            borderRadius: '4px',
            display: 'inline-block'
          }}>
            {statusText[game.status]}
          </span>
          
          <span style={{ color: '#aaa', fontSize: '0.8rem' }}>
            {game.gameMode || 'Conquest'}
          </span>
        </div>
        
        <div style={{ 
          display: 'flex',
          alignItems: 'center',
          marginBottom: '0.75rem'
        }}>
          <div style={{ 
            backgroundColor: '#333',
            borderRadius: '4px',
            padding: '0.25rem 0.5rem',
            display: 'flex',
            alignItems: 'center'
          }}>
            <span style={{ color: '#ccc', marginRight: '0.25rem' }}>
              {game.players.length}
            </span>
            <span style={{ color: '#666' }}>/</span>
            <span style={{ color: '#ccc', marginLeft: '0.25rem' }}>
              {game.maxPlayers}
            </span>
          </div>
          <span style={{ 
            marginLeft: '0.5rem',
            fontSize: '0.8rem',
            color: '#aaa'
          }}>
            Players
          </span>
        </div>
      </div>
      
      <div style={{ 
        padding: '0.75rem 1rem',
        borderTop: '1px solid #333',
        fontSize: '0.8rem',
        color: '#666',
        backgroundColor: '#202035'
      }}>
        Created {formatDate(game.createdAt)}
      </div>
    </div>
  );
};

export default GamePreview; 