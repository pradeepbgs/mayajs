import net from "net";
import { handleRequest } from "./requestHandler/requestHandler.js";
import { parseRequest } from "./parser/requestParser.js";
import ErrorHandler from "./responseHandler/errResponse.js";
class Maya {
  constructor() {
    this.routes = {
      GET: {},
      POST: {},
      PUT: {},
      DELETE: {},
    };
    this.middlewares = {};
  }

  listen(port = 3000, callback) {
    const server = net.createServer((socket) => {
      let buffer = Buffer.alloc(0);
      socket.on("data", (data) => {
        buffer = Buffer.concat([buffer, data]);

        if (buffer.includes(Buffer.from("\r\n\r\n"))) {
          const parsedRequest = parseRequest(buffer);

          if (parsedRequest.error) {
            console.error("Request parsing error:", parsedRequest.error);
            socket.write(ErrorHandler.badRequest(parsedRequest.error));
            socket.end();
            return;
          }

          handleRequest(parsedRequest, this.routes, this.middlewares)
            .then((responseData) => {
              if (responseData) {
                socket.write(responseData);
              } else {
                socket.write(ErrorHandler.internalServerError());
              }
              socket.end();
            })
            .catch((err) => {
              console.error("Error handling request:", err);
              socket.write(ErrorHandler.internalServerError());
              socket.end();
            });
          buffer = Buffer.alloc(0);
        }
      });

      socket.on("error", (e) => {
        console.log("error on socket: ", e);
      });
    });

    server.listen(port, "localhost", () => {
      if (typeof callback === "function") {
        return callback();
      } else {
        console.log(`Server is running on port ${port}`);
      }
    });
  }

  use(pathORhandler, handler) {
    if (typeof pathORhandler === "string") {
      this.middlewares[pathORhandler] = handler;
    } else {
      this.middlewares["/"] = pathORhandler;
    }
  }

  get(path, handler) {
    this.routes.GET[path] = handler;
  }

  post(path, handler) {
    this.routes.POST[path] = handler;
  }

  put(path, handler) {
    this.routes.PUT[path] = handler;
  }

  delete(path, handler) {
    this.routes.DELETE[path] = handler;
  }
}

export default Maya;
