// Client connection to Colyseus server
document.addEventListener('DOMContentLoaded', () => {
  // DOM elements
  const connectButton = document.getElementById('connect-button');
  const connectionStatus = document.getElementById('connection-status');
  const logsElement = document.getElementById('logs');
  
  // Colyseus client instance
  let client = null;
  let room = null;
  
  // Function to add log message
  function addLog(message) {
    const timestamp = new Date().toLocaleTimeString();
    logsElement.innerHTML += `[${timestamp}] ${message}\n`;
    logsElement.scrollTop = logsElement.scrollHeight;
    console.log(`[${timestamp}] ${message}`);
  }
  
  // Connect to the server
  const connect = async () => {
    try {
      // Create a new Colyseus client
      client = new Colyseus.Client('ws://localhost:3000');
      
      addLog('Connecting to server...');
      
      // Join a game room
      room = await client.joinOrCreate('game_room');
      
      // Connection successful
      connectionStatus.innerText = 'Connected';
      connectionStatus.className = 'connected';
      connectButton.innerText = 'Disconnect';
      
      addLog('Successfully connected to the server!');
      addLog(`Your session ID: ${room.sessionId}`);
      
      // Listen for state changes
      room.onStateChange((state) => {
        addLog(`State updated: ${Object.keys(state.players).length} players connected`);
        console.log('Current state:', state);
      });
      
      // Listen for error events
      room.onError((code, message) => {
        addLog(`Error: ${message} (${code})`);
      });
      
      // Listen for room leave event
      room.onLeave((code) => {
        addLog(`Left room, code: ${code}`);
        connectionStatus.innerText = 'Disconnected';
        connectionStatus.className = 'disconnected';
        connectButton.innerText = 'Connect to Server';
        room = null;
      });
      
    } catch (e) {
      addLog(`Connection error: ${e.message}`);
      connectionStatus.innerText = 'Connection failed';
      connectionStatus.className = 'disconnected';
    }
  };
  
  // Disconnect from the server
  const disconnect = () => {
    if (room) {
      room.leave();
    }
  };
  
  // Toggle connection
  connectButton.addEventListener('click', () => {
    if (room) {
      disconnect();
    } else {
      connect();
    }
  });
  
  // Initial log
  addLog('Client initialized and ready to connect');
}); 