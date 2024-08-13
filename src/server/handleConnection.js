import { parseRequest } from "../parser/requestParser.js";
import { handleRequest } from "../requestHandler/requestHandler.js";
import ErrorHandler from "../responseHandler/errResponse.js";
import { Buffer } from 'buffer';

export function createConnectionHandler(maya) {
  return async function handleConnection(socket) {
    let buffer = Buffer.alloc(0)
    socket.on("data", async (data) => {
      buffer = Buffer.concat([buffer, data]);

      if (buffer.includes(Buffer.from("\r\n\r\n"))) {
        let parsedRequest = parseRequest(buffer);
        buffer = Buffer.alloc(0)
        if (parsedRequest.error) {
          console.error("Request parsing error:", parsedRequest.error);
          socket.write(ErrorHandler.badRequest(parsedRequest.error));
          socket.end();
          return;
        }

        const {middlewares,routes,ResponseHandler} = maya 

        // if (globalMiddleware) {
        //   try {
        //     const res = await globalMiddleware(parsedRequest, maya.ResponseHandler, () => {});
        //     if (res) {
        //       socket.write(res);
        //       buffer = Buffer.alloc(0)
        //       socket.end();
        //       return;
        //     }
        //   } catch (err) {
        //     console.error("Error in global middleware:", err);
        //     socket.write(ErrorHandler.internalServerError());
        //     socket.end();
        //     return;
        //   }
        // }

        // we can use global and path prefix midlleware in one loop

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
            socket.write(responseData || ErrorHandler.internalServerError())
            socket.end();
          })
          .catch((err) => {
            console.error("Error handling request:", err);
            socket.write(ErrorHandler.internalServerError());
            socket.end();
          });
      }
    });

    socket.on("error", (e) => {
      console.log("error on socket: ", e);
    });
  };
}
