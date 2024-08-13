import net from "net";
import { parseRequest } from "./requestParser.js";
import ResponseHandler from "./responseHandler.js";
import { createConnectionHandler } from "./handleConnection.js";

class Maya {
  constructor() {
    this.routes = {
      GET: {},
      POST: {},
      PUT: {},
      DELETE: {},
    };
    this.middlewares = {};
    this.ResponseHandler = ResponseHandler;
  }
  listen(port = 3000, callback) {
    const handleConnection = createConnectionHandler(this);
    const server = net.createServer(handleConnection);

    server.listen(port, () => {
      if (typeof callback === "function") {
        return callback();
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

  bodyParse() {
    console.log("body parse func");
    return parseRequest(this.buffer);
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
