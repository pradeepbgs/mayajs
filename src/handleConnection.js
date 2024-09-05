import { parseRequest } from "./requestParser.js";
import { handleRequest } from "./requestHandler.js";
import ErrorHandler from "./errResponse.js";
import { Buffer } from "buffer";
import Cache from "./cache.js";

export function createConnectionHandler(maya, isBodyParse) {
  const cache = new Cache();
  return async function handleConnection(socket) {
    let buffer = Buffer.alloc(0);
    let parsedRequest;
    socket.on("data", async (data) => {
      if (isBodyParse) {
        buffer = Buffer.concat([buffer, data]);
        if (buffer.includes(Buffer.from("\r\n\r\n"))) {
          parsedRequest = await parseRequest(buffer,cache);
          buffer = Buffer.alloc(0);
        } else {
          return;
        }
      } else {
        parsedRequest = parseRequestWithoutBody(data);
        buffer = Buffer.alloc(0);
      }
      
      if (parsedRequest.error) return parsedRequestError(socket, parsedRequest.error);


      handleRequest(parsedRequest,maya)
        .then((responseData) => {
          socket.write(responseData || ErrorHandler.internalServerError());
          socket.end();
        })
        .catch((err) => {
          console.error("Error handling request:", err);
          socket.write(ErrorHandler.internalServerError());
          socket.end();
        });
    });

    socket.on("error", (e) => {
      console.log("error on socket: ", e);
    });
  };
}

function parseRequestWithoutBody(data) {
  const [method, path] = data.toString()
  .split("\r\n")[0].requestLine.split(" ");
  return {
    method,
    path,
    headers: {},
  };
}

function parsedRequestError(socket, error) {
  console.error("Request parsing error:", error);
  socket.write(ErrorHandler.badRequest(error));
  socket.end();
}
