# Conqueror's Quest

A cooperative 3D RTS game using Three.js for 3D graphics and Colyseus for multiplayer functionality.

## Project Overview

Conqueror's Quest is a real-time strategy game where players collaborate to defeat an AI opponent. Each player controls a hero unit, builds structures, and recruits soldiers to aid in their quest.

- 3D rendering with Three.js
- Multiplayer functionality with Colyseus
- Approximately one-hour match duration
- Minimap for navigation
- Resource management system

## Setup

### Prerequisites

- Node.js (v14.x or higher)
- npm (v6.x or higher)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/conquerors-quest.git
cd conquerors-quest
```

2. Install dependencies:

```bash
npm install
```

## Running the Game

### Development Mode

Run the server in development mode with auto-restart:

```bash
npm run dev
```

### Production Mode

Run the server in production mode:

```bash
npm start
```

### Accessing the Game

After starting the server, open your browser and navigate to:

```
http://localhost:3000
```

## Project Structure

```
project-root/
├── package.json
├── README.md
├── server/
│   ├── index.js          # Main server entry point
│   ├── gameRoom.js       # Colyseus game room definition
│   └── entities/         # Game entity schemas
├── client/
│   ├── index.html        # Main HTML file
│   ├── style.css         # Styles
│   ├── main.js           # Client entry point
│   └── three/            # Three.js related code
└── common/               # Shared utilities (optional)
```

## Current State

This project is in the initial development phase. Current features:
- Basic server setup with Colyseus
- Simple client interface for testing connections 