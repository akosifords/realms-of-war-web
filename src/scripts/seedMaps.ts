// Seed script to add sample maps to the Firestore database
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, deleteDoc, DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import { firebaseConfig } from '../firebase/config';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

interface MapTile {
  type: string;
  x: number;
  y: number;
  resource?: string;
}

interface GameMap {
  name: string;
  size: 'small' | 'medium' | 'large';
  terrainType: 'plains' | 'mountain' | 'forest' | 'water' | 'mixed';
  description: string;
  createdAt: Date;
  tiles?: MapTile[];
}

// Helper function to generate a grid of tiles
const generateTiles = (size: 'small' | 'medium' | 'large', terrainType: string): MapTile[] => {
  const tiles: MapTile[] = [];
  const gridSize = size === 'small' ? 8 : size === 'medium' ? 12 : 16; // large
  
  // Function to determine if a tile should be of a specific type based on terrain
  const shouldBeTileType = (x: number, y: number, type: string, terrainType: string): boolean => {
    if (terrainType === 'plains') {
      // Plains maps have mostly plains with some forests and mountains
      if (type === 'forest') return Math.random() < 0.15;
      if (type === 'mountain') return Math.random() < 0.1;
      if (type === 'water') return Math.random() < 0.05;
      return false;
    }
    
    if (terrainType === 'forest') {
      // Forest maps have mostly forests with some plains and mountains
      if (type === 'forest') return Math.random() < 0.6;
      if (type === 'mountain') return Math.random() < 0.1;
      if (type === 'water') return Math.random() < 0.05;
      return false;
    }
    
    if (terrainType === 'mountain') {
      // Mountain maps have mountains with some forests and plains
      if (type === 'mountain') return Math.random() < 0.5;
      if (type === 'forest') return Math.random() < 0.2;
      if (type === 'water') return Math.random() < 0.1;
      return false;
    }
    
    if (terrainType === 'water') {
      // Water maps have significant water areas with some land
      if (type === 'water') {
        // More water in the center, less on the edges
        const centerX = gridSize / 2;
        const centerY = gridSize / 2;
        const distFromCenter = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
        const maxDist = Math.sqrt(Math.pow(gridSize, 2) / 2);
        
        // Higher probability of water near the center
        return Math.random() < 0.7 - (distFromCenter / maxDist) * 0.4;
      }
      if (type === 'forest') return Math.random() < 0.15;
      if (type === 'mountain') return Math.random() < 0.05;
      return false;
    }
    
    if (terrainType === 'mixed') {
      // Mixed maps have a balanced distribution
      if (type === 'forest') return Math.random() < 0.3;
      if (type === 'mountain') return Math.random() < 0.2;
      if (type === 'water') return Math.random() < 0.15;
      return false;
    }
    
    return false;
  };
  
  // Generate resources with probability based on terrain type
  const addResourceToTile = (tile: MapTile, terrainType: string): MapTile => {
    // Skip water tiles for resources
    if (tile.type === 'water') return tile;
    
    let resourceProbability = 0;
    let resourceOptions: string[] = [];
    
    if (tile.type === 'mountain') {
      resourceProbability = 0.3;
      resourceOptions = ['iron', 'gold'];
    } else if (tile.type === 'forest') {
      resourceProbability = 0.25;
      resourceOptions = ['wood'];
    } else if (tile.type.includes('plains')) {
      resourceProbability = 0.15;
      resourceOptions = ['food'];
    }
    
    if (Math.random() < resourceProbability) {
      const randomResource = resourceOptions[Math.floor(Math.random() * resourceOptions.length)];
      return { ...tile, resource: randomResource };
    }
    
    return tile;
  };
  
  // Generate the grid
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      let tileType: string;
      
      if (shouldBeTileType(x, y, 'water', terrainType)) {
        tileType = 'water';
      } else if (shouldBeTileType(x, y, 'mountain', terrainType)) {
        tileType = 'mountain';
      } else if (shouldBeTileType(x, y, 'forest', terrainType)) {
        tileType = 'forest';
      } else {
        // Default to plains with random variation
        const plainsVariants = ['plains_light', 'plains_medium', 'plains_dark'];
        tileType = plainsVariants[Math.floor(Math.random() * plainsVariants.length)];
      }
      
      let tile: MapTile = { type: tileType, x, y };
      tile = addResourceToTile(tile, terrainType);
      
      tiles.push(tile);
    }
  }
  
  return tiles;
};

// Sample maps to add
const sampleMaps: GameMap[] = [
  {
    name: 'Green Valley',
    size: 'small',
    terrainType: 'plains',
    description: 'A peaceful valley with green plains and scattered forests.',
    createdAt: new Date(),
  },
  {
    name: 'Mountain Fortress',
    size: 'small',
    terrainType: 'mountain',
    description: 'Rugged mountain terrain perfect for defensive positions.',
    createdAt: new Date(),
  },
  {
    name: 'Deep Woods',
    size: 'small',
    terrainType: 'forest',
    description: 'Dense forest with hidden paths and abundant resources.',
    createdAt: new Date(),
  },
  {
    name: 'Island Archipelago',
    size: 'small',
    terrainType: 'water',
    description: 'Series of small islands separated by shallow waters.',
    createdAt: new Date(),
  },
  {
    name: 'Mixed Terrain',
    size: 'small',
    terrainType: 'mixed',
    description: 'Varied landscape with a mix of all terrain types.',
    createdAt: new Date(),
  },
  {
    name: 'Vast Plains',
    size: 'medium',
    terrainType: 'plains',
    description: 'Wide open plains with excellent visibility.',
    createdAt: new Date(),
  },
  {
    name: 'Mountain Range',
    size: 'medium',
    terrainType: 'mountain',
    description: 'Extensive mountain range with valuable ore deposits.',
    createdAt: new Date(),
  },
  {
    name: 'Grand Forest',
    size: 'medium',
    terrainType: 'forest',
    description: 'Ancient forest with tall trees and hidden clearings.',
    createdAt: new Date(),
  },
  {
    name: 'Great Lakes',
    size: 'medium',
    terrainType: 'water',
    description: 'Region dominated by large interconnected lakes.',
    createdAt: new Date(),
  },
  {
    name: 'Diverse Landscape',
    size: 'medium',
    terrainType: 'mixed',
    description: 'A balanced map featuring all terrain types in equal measure.',
    createdAt: new Date(),
  },
  {
    name: 'Endless Plains',
    size: 'large',
    terrainType: 'plains',
    description: 'Massive plains stretching to the horizon.',
    createdAt: new Date(),
  },
  {
    name: 'Mountain Empire',
    size: 'large',
    terrainType: 'mountain',
    description: 'Imposing mountain peaks with deep valleys between them.',
    createdAt: new Date(),
  },
  {
    name: 'Ancient Woods',
    size: 'large',
    terrainType: 'forest',
    description: 'Sprawling primeval forest with centuries-old trees.',
    createdAt: new Date(),
  },
  {
    name: 'Ocean Expanse',
    size: 'large',
    terrainType: 'water',
    description: 'Vast ocean with scattered islands and abundant marine resources.',
    createdAt: new Date(),
  },
  {
    name: 'Complete Realm',
    size: 'large',
    terrainType: 'mixed',
    description: 'A complete realm with diverse regions and terrain types.',
    createdAt: new Date(),
  },
];

// Function to add maps to Firestore
const addMapsToFirestore = async (): Promise<void> => {
  try {
    console.log('Checking for existing maps...');
    
    // Check if maps already exist
    const mapsRef = collection(db, 'maps');
    const mapsSnapshot = await getDocs(mapsRef);
    
    if (!mapsSnapshot.empty) {
      console.log(`Found ${mapsSnapshot.docs.length} existing maps.`);
      
      const deleteExisting = process.argv.includes('--delete-existing');
      
      if (deleteExisting) {
        console.log('Deleting existing maps...');
        
        const deletePromises: Promise<void>[] = [];
        mapsSnapshot.forEach((doc) => {
          // Use 'any' to bypass TypeScript checking
          deletePromises.push(deleteDoc((doc as any).ref));
        });
        
        await Promise.all(deletePromises);
        console.log('Existing maps deleted.');
      } else {
        console.log('Maps already exist in the database. Run with --delete-existing to replace them.');
        return;
      }
    }
    
    console.log('Adding sample maps to Firestore...');
    
    // Add each map with its generated tiles
    for (const mapData of sampleMaps) {
      // Generate tiles based on map size and terrain type
      const tiles = generateTiles(mapData.size, mapData.terrainType);
      
      // Add map to Firestore
      const docRef = await addDoc(collection(db, 'maps'), {
        ...mapData,
        tiles,
      });
      
      console.log(`Added map "${mapData.name}" (${mapData.size}, ${mapData.terrainType}) with ID: ${docRef.id}`);
    }
    
    console.log('All maps added successfully!');
  } catch (error) {
    console.error('Error adding maps:', error);
  }
};

// Run the seed function
addMapsToFirestore(); 