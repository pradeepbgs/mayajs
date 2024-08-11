import net from 'net'
import handleRequest from './parser/requestParser.js';

function startServer() {
  const server = net.createServer((socket) => {
    let buffer = Buffer.alloc(0);
    socket.on('data', (data) => {
      buffer = Buffer.concat([buffer, data]);
      
      if (buffer.includes(Buffer.from('\r\n\r\n'))) {
        const response  = handleRequest(buffer)

        if (response) {
          socket.write(response)
        } else {
          return socket.write("HTTP/1.1 500 Internal Server Error\r\n\r\n");
        }
        buffer = Buffer.alloc(0);
        socket.end()
      }
    });


    socket.on('error',(e)=>{
        console.log("error on socket: ",e);
    })
  });

  server.listen(3000, 'localhost',() => {
    console.log(`Server running on port:3000`);
  });
}



startServer();
