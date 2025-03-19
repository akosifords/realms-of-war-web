# Realms of War

A 2D civilization turn-based strategy game web application.

## Features

- User authentication with Firebase Auth
- Create and join game lobbies
- Multiplayer turn-based gameplay
- Customizable game settings
- Real-time game state updates with Firebase

## Pages

1. Sign in scene
2. Sign up scene
3. Home scene
4. Create game scene
5. Lobby scene
6. List of open games that can be joined
7. Game Scene
8. Profile
9. Messages
10. Rules
11. Welcome page

## Technologies Used

- React with TypeScript
- Firebase (Auth & Firestore)
- React Router for navigation

## Getting Started

### Prerequisites

- Node.js (v14.x or higher)
- npm (v6.x or higher)
- Firebase account and project

### Installation

1. Clone the repository
   ```
   git clone https://github.com/yourusername/realms-of-war.git
   cd realms-of-war
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Create a Firebase project and configure:
   - Enable Authentication with Email/Password
   - Create a Firestore database
   - Update the Firebase configuration in `src/firebase/config.ts`

4. Start the development server
   ```
   npm start
   ```

5. Open http://localhost:3000 to view the app in your browser

## Deployment

1. Build the production version
   ```
   npm run build
   ```

2. Deploy to Firebase Hosting (optional)
   ```
   npm install -g firebase-tools
   firebase login
   firebase init
   firebase deploy
   ```

## Game Mechanics

The game is a 2D civilization turn-based strategy game where players:
- Create or join game lobbies
- Manage resources
- Build cities and units
- Explore the map
- Research technologies
- Engage in diplomacy or war

## License

MIT 