const net = require("net");

// You can use print statements as follows for debugging, they'll be visible when running tests.
console.log("Logs from your program will appear here!");

// Uncomment this to pass the first stage
const server = net.createServer((socket) => {
  // socket.on("data", (data) => {
  //   console.log(`client connect:\r\n , ${data.toString()}\r\n`);
  // });
  const responseBody = "hello from servers";
  // const responseHtml = `
  //     <html>
  //       <head><title>My TCP Server</title></head>
  //       <body><h1>Hello from the server!</h1></body>
  //     </html>
  //   `;
  socket.write("HTTP/1.1 200 OK\r\n");
  socket.write("Content-Type: text/html\r\n");
  socket.write("Pradeep\r\n");
  socket.write("Content-length: " + Buffer.byteLength(responseHtml) + "\r\n");
  socket.write("\r\n");
  socket.write(responseHtml);

  // Close the server and socket after sending the response
  socket.on("end", () => {
    console.log("Client disconnected");
    // Close the server after the client has disconnected
    server.close(() => {
      console.log("Server closed after sending response.");
    });
  });

  // Handle socket errors
  socket.on("error", (err) => {
    console.error(`Socket error: ${err.message}`);
    // Ensure server closes on error
    server.close(() => {
      console.log("Server closed due to error.");
    });
  });
});

server.listen(4221, "localhost");
