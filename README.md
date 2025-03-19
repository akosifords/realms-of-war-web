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

3. Set up environment variables:
   - Copy `.env.example` to `.env`
   ```
   cp .env.example .env
   ```
   - Fill in your Firebase configuration values in `.env`

4. Create a Firebase project and configure:
   - Enable Authentication with Email/Password
   - Create a Firestore database
   - Get your Firebase configuration from the Firebase Console
   - Add the configuration values to your `.env` file

5. Start the development server
   ```
   npm start
   ```

6. Open http://localhost:3000 to view the app in your browser

## Deployment

1. Build the production version
   ```
   npm run build
   ```

2. Deploy to GitHub Pages
   ```
   npm run deploy
   ```

   Note: Make sure to set up the environment variables in your GitHub repository's secrets for GitHub Actions deployment.

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