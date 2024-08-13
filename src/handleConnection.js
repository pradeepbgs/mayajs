import { parseRequest } from "./requestParser.js";
import { handleRequest } from "./requestHandler.js";
import ErrorHandler from "./errResponse.js";
import { Buffer } from "buffer";

export function createConnectionHandler(maya,isBodyParse) {
  return async function handleConnection(socket) {
    let buffer = Buffer.alloc(0);
    socket.on("data", async (data) => {
      let parsedRequest ;
      if (isBodyParse) {
      buffer = Buffer.concat([buffer, data]);
      if (buffer.includes(Buffer.from("\r\n\r\n"))) {
          parsedRequest = await parseRequest(buffer)
          buffer = Buffer.alloc(0);
        } else {
          return;
        }
      }else{
        parseRequest = parseRequestWithoutBody(data)
      };
        if (parsedRequest.error) {
          console.error("Request parsing error:", parsedRequest.error);
          socket.write(ErrorHandler.badRequest(parsedRequest.error));
          socket.end();
          return;
        }

        const { middlewares, routes, ResponseHandler } = maya;

        for (const [pathPrefix, middleware] of Object.entries(middlewares)) {
          if (pathPrefix === "/" || parsedRequest.path.startsWith(pathPrefix)) {
            const res = await middleware(parsedRequest, ResponseHandler, () => {});
            if (res) {
              socket.write(res);
              socket.end();
              return;
            }
          }
        }

        handleRequest(parsedRequest, routes, middlewares)
          .then((responseData) => {
            socket.write(responseData || ErrorHandler.internalServerError());
            socket.end();
          })
          .catch((err) => {
            console.error("Error handling request:", err);
            socket.write(ErrorHandler.internalServerError());
            socket.end();
          });
      }
    );

    socket.on("error", (e) => {
      console.log("error on socket: ", e);
    });
  };
}

function parseRequestWithoutBody(data) {
  const requestLine = data.toString().split("\r\n")[0];
  const [method, path] = requestLine.split(" ");
  return {
    method,
    path,
    headers: {},
  };
}