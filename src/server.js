import net from 'net'
import handleRequest from './handleRequest.js';

function startServer() {
  const server = net.createServer((socket) => {
    socket.on('data', (data) => {
      const request = data.toString();
      const response = handleRequest(request);
      socket.write(response);
      socket.end();
    });
  });

  server.listen(3000, () => {
    console.log(`Server running on port 3000 - Worker ${process.pid}`);
  });
}



startServer();
