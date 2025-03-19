import React, { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

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

interface MapDetailsViewProps {
  mapId: string;
}

const MapDetailsView: React.FC<MapDetailsViewProps> = ({ mapId }) => {
  const [loading, setLoading] = useState(true);
  const [mapData, setMapData] = useState<GameMap | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMapDetails = async () => {
      if (!mapId) {
        setLoading(false);
        return;
      }

      try {
        const mapDoc = await getDoc(doc(db, 'maps', mapId));
        if (mapDoc.exists()) {
          setMapData({
            id: mapDoc.id,
            ...mapDoc.data() as Omit<GameMap, 'id'>
          });
        } else {
          setError('Map not found');
        }
      } catch (err: any) {
        console.error('Error loading map details:', err);
        setError(err.message || 'Failed to load map');
      } finally {
        setLoading(false);
      }
    };

    fetchMapDetails();
  }, [mapId]);

  if (loading) {
    return (
      <div style={{ 
        padding: '1rem', 
        backgroundColor: '#262640', 
        borderRadius: '8px',
        textAlign: 'center'
      }}>
        Loading map details...
      </div>
    );
  }

  if (error || !mapData) {
    return (
      <div style={{ 
        padding: '1rem', 
        backgroundColor: '#262640', 
        borderRadius: '8px',
        color: '#ff6b6b'
      }}>
        {error || 'Map information is not available'}
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '1.5rem', 
      backgroundColor: '#262640', 
      borderRadius: '8px'
    }}>
      <h3 style={{ marginBottom: '1rem' }}>Map: {mapData.name}</h3>
      
      <div style={{ 
        display: 'grid',
        gridTemplateColumns: '250px 1fr',
        gap: '1.5rem',
        alignItems: 'start'
      }}>
        {/* Map Preview */}
        <div style={{ 
          width: '250px', 
          height: '180px', 
          borderRadius: '6px',
          overflow: 'hidden',
          backgroundColor: '#1a1a2e',
          boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
        }}>
          {mapData.previewUrl ? (
            <img 
              src={mapData.previewUrl} 
              alt={mapData.name} 
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'cover',
                display: 'block'
              }} 
            />
          ) : (
            <div style={{ 
              width: '100%', 
              height: '100%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: '#888'
            }}>
              {mapData.name} ({mapData.mapSize.width}x{mapData.mapSize.height})
            </div>
          )}
        </div>
        
        {/* Map Details */}
        <div>
          <p style={{ marginBottom: '0.75rem', color: '#ccc' }}>{mapData.description}</p>
          
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0.5rem 1.5rem',
            fontSize: '0.9rem',
            marginTop: '1rem'
          }}>
            <div>
              <span style={{ color: '#aaa' }}>Size: </span>
              <span>{mapData.mapSize.width} × {mapData.mapSize.height}</span>
            </div>
            <div>
              <span style={{ color: '#aaa' }}>Players: </span>
              <span>{mapData.playerCount}</span>
            </div>
            <div>
              <span style={{ color: '#aaa' }}>Grid Type: </span>
              <span>{mapData.hexagonal ? 'Hexagonal' : 'Square'}</span>
            </div>
            <div>
              <span style={{ color: '#aaa' }}>Created: </span>
              <span>{new Date(mapData.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapDetailsView; 