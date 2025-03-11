const { Client } = require('colyseus.js');

async function testConnection() {
  console.log("Connecting to game server...");
  
  // Create Colyseus client
  const client = new Client('ws://localhost:3000');
  
  try {
    // Connect to the TestRoom
    console.log("Joining test room...");
    const room = await client.joinOrCreate("test_room");
    
    console.log("Successfully joined the test room!");
    
    // Listen for state changes
    room.onStateChange((state) => {
      console.log("New state:", JSON.stringify(state));
    });
    
    // Wait for 10 seconds then leave
    setTimeout(() => {
      console.log("Test complete. Leaving room...");
      room.leave();
      process.exit(0);
    }, 10000);
    
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

// Run the test
testConnection(); 