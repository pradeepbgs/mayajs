import { parseRequest } from "./requestParser.js";
import { handleRequest } from "./requestHandler.js";
import ErrorHandler from "./errResponse.js";
import { Buffer } from "buffer";
import responseHandler from "./responseHandler.js";

export function createConnectionHandler(maya, isBodyParse) {
  return async function handleConnection(socket) {
    // console.log("Handling new connection...");

    let buffer = Buffer.alloc(0);
    socket.on("data", async (data) => {
      // console.log("Received data:", data.toString());
      let parsedRequest;
      if (isBodyParse) {
        buffer = Buffer.concat([buffer, data]);
        if (buffer.includes(Buffer.from("\r\n\r\n"))) {
          parsedRequest = await parseRequest(buffer);
          // buffer = Buffer.alloc(0);
        } else {
          return;
        }
      } else {
        parsedRequest = parseRequestWithoutBody(data);
        buffer = Buffer.alloc(0);
      }
      if (parsedRequest.error) {
        return parsedRequestError(socket, parsedRequest.error);
      }

      const { compiledMiddlewares, compiledRoutes, ResponseHandler } = maya;

      // console.log("Using compiled middlewares:", compiledMiddlewares);
      // console.log("Using compiled routes:", compiledRoutes);


      for (const [pathPrefix, middleware] of compiledMiddlewares) {
        if (pathPrefix === "/" || parsedRequest.path.startsWith(pathPrefix)) {
          const res = await middleware(
            parsedRequest,
            ResponseHandler,
            () => {}
          );
          if (res) {
            socket.write(res);
            if (parsedRequest.headers['Connection']?.toLowerCase() !== 'keep-alive') {
              socket.end();
            }
            return;
          }
        }
      }

      const routeHandler = compiledRoutes[parsedRequest.method]?.find(([path]) =>
        parsedRequest.path.startsWith(path)
      )?.[1];
      
      if (routeHandler) {
        try {
          const responseData = await routeHandler(parsedRequest, ResponseHandler);
          socket.write(responseData || ErrorHandler.internalServerError());
          if (parsedRequest.headers['Connection']?.toLowerCase() !== 'keep-alive') {
            socket.end();
          }
        } catch (error) {
          console.error("Error handling request:", error);
          socket.write(ErrorHandler.internalServerError());
          if (parsedRequest.headers['Connection']?.toLowerCase() !== 'keep-alive') {
            socket.end();
          }
        }
      } else {
        socket.write(ErrorHandler.RouteNotFoundError());
        if (parsedRequest.headers['Connection']?.toLowerCase() !== 'keep-alive') {
          socket.end();
        }
      }
      
    /// this  is our old approach and better???
      // handleRequest(parsedRequest, compiledRoutes, maya.middlewares)
      //   .then((responseData) => {
      //     socket.write(responseData || ErrorHandler.internalServerError());
      //     socket.end();
      //   })
      //   .catch((err) => {
      //     console.error("Error handling request:", err);
      //     socket.write(ErrorHandler.internalServerError());
      //     socket.end();
      //   });
    });

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

function parsedRequestError(socket, error) {
  console.error("Request parsing error:", error);
  socket.write(ErrorHandler.badRequest(error));
  socket.end();
}
