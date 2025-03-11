const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/',
  method: 'GET'
};

console.log('Testing connection to server...');

const req = http.request(options, (res) => {
  console.log(`Server response status code: ${res.statusCode}`);
  
  if (res.statusCode === 200) {
    console.log('Server is running correctly!');
  } else {
    console.log('Server returned an unexpected status code');
  }
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Connection test completed');
  });
});

req.on('error', (error) => {
  console.error('Error connecting to server:', error.message);
  console.log('Make sure the server is running on port 3000');
});

req.end(); 