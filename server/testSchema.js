const { Schema, type } = require('@colyseus/schema');
const { Room } = require('colyseus');

class TestState extends Schema {
  constructor() {
    super();
    this.message = "Hello World";
    this.count = 0;
  }
}

// Define schema types
type("string")(TestState.prototype, "message");
type("number")(TestState.prototype, "count");

class TestRoom extends Room {
  onCreate(options) {
    console.log("TestRoom created!");
    
    // Initialize the state
    this.setState(new TestState());
    
    // Set up a timer to update the state
    this.setSimulationInterval(() => {
      this.state.count++;
      console.log(`Count updated: ${this.state.count}`);
    }, 1000);
  }

  onJoin(client, options) {
    console.log(`Client ${client.sessionId} joined the test room`);
  }

  onLeave(client, consented) {
    console.log(`Client ${client.sessionId} left the test room`);
  }
}

module.exports = { TestRoom }; 