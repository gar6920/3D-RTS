// Global variables
let client;
let room;
let playerId;

// DOM Elements
const statusEl = document.getElementById('status');
const connectBtn = document.getElementById('connect-btn');
const disconnectBtn = document.getElementById('disconnect-btn');
const moveHeroBtn = document.getElementById('move-hero-btn');
const gameControlsEl = document.getElementById('game-controls');
const logsEl = document.getElementById('logs');
const playerInfoEl = document.getElementById('player-info');

// Initialize the application
window.addEventListener('DOMContentLoaded', () => {
  console.log('Conqueror\'s Quest client initialized');
  
  // Set up event listeners
  connectBtn.addEventListener('click', connect);
  disconnectBtn.addEventListener('click', disconnect);
  moveHeroBtn.addEventListener('click', moveHero);
});

// Connect to the server
async function connect() {
  try {
    addLog('Connecting to server...');
    statusEl.textContent = 'Connecting...';
    
    // Disable connect button during connection
    connectBtn.disabled = true;
    
    // Create a Colyseus client
    client = new Colyseus.Client('ws://localhost:3000');
    
    // Join the game room
    room = await client.joinOrCreate('game_room');
    
    // Success! Enable controls
    playerId = room.sessionId;
    statusEl.textContent = `Connected! Your ID: ${playerId}`;
    disconnectBtn.disabled = false;
    gameControlsEl.style.display = 'block';
    
    addLog(`Successfully joined game room with ID: ${playerId}`);
    
    // Set up room event listeners
    setupRoomListeners();
    
  } catch (error) {
    console.error('Connection error:', error);
    statusEl.textContent = `Connection failed: ${error.message}`;
    connectBtn.disabled = false;
    addLog(`Connection error: ${error.message}`, true);
  }
}

// Disconnect from the server
function disconnect() {
  if (room) {
    addLog('Disconnecting from server...');
    room.leave();
    room = null;
  }
  
  // Reset UI
  statusEl.textContent = 'Disconnected';
  connectBtn.disabled = false;
  disconnectBtn.disabled = true;
  gameControlsEl.style.display = 'none';
  playerInfoEl.innerHTML = '<h3>Player Info</h3><div>Not connected</div>';
  
  addLog('Disconnected from server');
}

// Set up room event listeners
function setupRoomListeners() {
  // Listen for state changes
  room.onStateChange((state) => {
    console.log('Game state updated:', state);
    updatePlayerInfo(state);
    addLog('Game state updated');
  });
  
  // Listen for room events
  room.onLeave(() => {
    addLog('You have left the room');
    disconnect();
  });
  
  // Listen for hero moved messages
  room.onMessage('heroMoved', (message) => {
    const { playerId: movedPlayerId, x, y, z } = message;
    const isMe = movedPlayerId === playerId;
    addLog(`${isMe ? 'Your' : 'Player ' + movedPlayerId + '\'s'} hero moved to (${x}, ${y}, ${z})`);
  });
}

// Move the hero
function moveHero() {
  if (!room) {
    addLog('Cannot move hero: Not connected', true);
    return;
  }
  
  // Get position values from input fields
  const x = parseFloat(document.getElementById('x-pos').value);
  const y = parseFloat(document.getElementById('y-pos').value);
  const z = parseFloat(document.getElementById('z-pos').value);
  
  addLog(`Sending hero move command to position (${x}, ${y}, ${z})`);
  
  // Send move message to server
  room.send('moveHero', { x, y, z });
}

// Update player info display
function updatePlayerInfo(state) {
  if (!state || !state.players) return;
  
  let html = '<h3>Player Info</h3>';
  
  // Display current players
  const players = state.players;
  if (Object.keys(players).length === 0) {
    html += '<div>No players connected</div>';
  } else {
    html += '<ul>';
    for (const id in players) {
      const player = players[id];
      const isMe = id === playerId;
      
      html += `<li>
        <strong>${isMe ? 'You' : 'Player'}</strong> (${id})<br>
        Name: ${player.name}<br>
        Hero Position: (${Math.round(player.hero.x)}, ${Math.round(player.hero.y)}, ${Math.round(player.hero.z)})<br>
        Buildings: ${player.buildings ? Object.keys(player.buildings).length : 0}
      </li>`;
    }
    html += '</ul>';
  }
  
  playerInfoEl.innerHTML = html;
}

// Add log entry
function addLog(message, isError = false) {
  const logEntry = document.createElement('div');
  logEntry.className = 'log-entry';
  logEntry.style.color = isError ? 'red' : 'black';
  
  const time = new Date().toLocaleTimeString();
  logEntry.textContent = `[${time}] ${message}`;
  
  logsEl.appendChild(logEntry);
  logsEl.scrollTop = logsEl.scrollHeight;
} 