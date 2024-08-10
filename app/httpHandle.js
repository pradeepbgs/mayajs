const net = require("net");

const server = net.createServer((socket) => {
  let requestBuffer = "";
  socket.on("data", (data) => {
    // we will handle GET , POST ... method.
    requestBuffer += data.toString();
    // now we have client data from getting on Browser...
    if (requestBuffer.includes("\r\n\r\n")) {
      // spit this to get our http method like - GET,POST...
      const requestLine = requestBuffer.split("\r\n")[0];
      const [method, path] = requestLine.split(" ");
      console.log(method);
      // prepare the response
      let responseBody;
      let statusCode;
      let contentType;

      if (method == "GET") {
        statusCode = 200;
        contentType = "text/plain";
        responseBody = "We are getting GET request";
      } else if (method === "POST") {
        statusCode = 200;
        responseBody = "We are processing POST request";
      } else {
        statusCode = 405; // Method Not Allowed
        responseBody = "Method Not Allowed";
      }

      socket.write(`HTTP/1.1 ${statusCode} OK\r\n`);
      socket.write(`Content-Type: ${contentType}\r\n`);
      socket.write("\r\n");
      socket.write(responseBody);
      socket.end();
    }
  });
  socket.on("error", (err) => {
    console.error(`Socket error: ${err.message}`);
  });
});

server.listen(3000, "localhost", () => {
  console.log("Server is listening on port 3000");
});
