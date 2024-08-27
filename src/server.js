import net from "net";
import tls from "tls";
import fs from "fs";

import ResponseHandler from "./responseHandler.js";
import { createConnectionHandler } from "./handleConnection.js";

/**
 * @class Maya
 * A custom HTTP/S server framework.
 */

class Maya {
  /**
   * Initializes the Maya server with default configurations.
   */

  constructor() {
    this.sslOptions = null;
    this.routes = {
      GET: {},
      POST: {},
      PUT: {},
      DELETE: {},
      PATCH: {},
    };
    this.middlewares = {};
    this.ResponseHandler = ResponseHandler;
    this.isBodyParse = false;
    this.compiledMiddlewares = [];
    this.compiledRoutes = {};
  }

  /**
   * Configures SSL/TLS for the server.
   * 
   * @param {Object} options - The SSL/TLS options.
   * @param {string} options.keyPath - Path to the SSL/TLS key file.
   * @param {string} options.certPath - Path to the SSL/TLS certificate file.
   */
  useHttps(options = {}) {
    if (options.keyPath && options.certPath) {
      try {
        this.sslOptions = {
          key: fs.readFileSync(options.keyPath),
          cert: fs.readFileSync(options.certPath)
        }
      } catch (error) {
        console.error('Error reading SSL certificate or key:', error);
        this.sslOptions = null;
      }
    } else {
      console.warn("SSL options not provided. Server will default to HTTP.");
      this.sslOptions = null;
    }
  }
 
  /**
   * Compiles and sorts routes and middlewares for optimized processing.
   */
  compile() {
    this.compiledMiddlewares = Object.entries(this.middlewares).sort(([a], [b]) => b.length - a.length);

    for (const method in this.routes) {
      this.compiledRoutes[method] = Object.entries(this.routes[method]).sort(([a, routeA], [b, routeB]) => {
        // Prioritize important routes, then by path length
        if (routeA.isImportant && !routeB.isImportant) return -1;
        if (!routeA.isImportant && routeB.isImportant) return 1;
        return b.length - a.length;
      });
    }
  }

   /**
   * Creates a server instance based on the SSL/TLS configuration.
   * 
   * @param {Function} handleConnection - The function to handle incoming connections.
   * @returns {net.Server|tls.Server} - The created server instance.
   */
  _createServer(handleConnection) {
    return  this.sslOptions 
      ?  tls.createServer(this.sslOptions, (socket) => handleConnection(socket))
      : net.createServer((socket) => handleConnection(socket));
  }

  /**
   * Starts the server and begins listening on the specified port.
   * 
   * @param {number} [port=3000] - The port number to listen on.
   * @param {Function} [callback] - The callback to be invoked when the server starts.
   * @returns {Promise<net.Server|tls.Server>} - A promise that resolves to the server instance.
   */
  async listen(port = 3000, callback) {
    this.compile();
    const handleConnection = createConnectionHandler(this, this.isBodyParse);

    const server = this._createServer(handleConnection);

    server.listen(port, () => { 
      if (typeof callback === "function") return callback();
        console.log(`Server is running on ${this.sslOptions ? 'https' : 'http'}://localhost:${port}`);
    });
    return server;    
  }

  /**
   * Adds a middleware function to the server.
   * 
   * @param {string|Function} pathORhandler - The path to apply the middleware or the middleware function directly.
   * @param {Function} [handler] - The middleware function if the path is specified.
   */

  use(pathORhandler, handler) {
    const path = typeof pathORhandler === "string" ? pathORhandler : "/";
    this.middlewares[path] = this.middlewares[path] || [];
    this.middlewares[path].push(handler || pathORhandler);
  }

   /**
   * Enables body parsing for the server.
   */
  bodyParse() {
    this.isBodyParse = true;
  }

  /**
   * Defines a route handler for a specified HTTP method and path.
   * 
   * @param {string} method - The HTTP method (e.g., GET, POST).
   * @param {string} path - The route path.
   * @returns {Object} - An object with methods to set route importance and handler.
   */
  _defineRoute(method, path) {
    let isImportant = false;
    const chain = {
      /**
       * Marks the route as important.
       * 
       * @returns {Object} - The chainable object.
       */

      isImportant: () => {
        isImportant = true;
        return chain;
      },
      /**
       * Sets the handler for the route.
       * 
       * @param {Function} handler - The route handler function.
       */
      handler: (handler) => {
        this.routes[method][path] = { handler, isImportant };
      },
    };
    return chain;
  }

  /**
   * Defines a GET route.
   * 
   * @param {string} path - The route path.
   * @returns {Object} - The route definition chain.
   */
  get(path) {
    return this._defineRoute("GET", path);
  }

  /**
   * Defines a POST route.
   * 
   * @param {string} path - The route path.
   * @returns {Object} - The route definition chain.
   */
  post(path) {
    return this._defineRoute("POST", path);
  }

  /**
   * Defines a PUT route.
   * 
   * @param {string} path - The route path.
   * @returns {Object} - The route definition chain.
   */
  put(path) {
    return this._defineRoute("PUT", path);
  }

  /**
   * Defines a DELETE route.
   * 
   * @param {string} path - The route path.
   * @returns {Object} - The route definition chain.
   */
  delete(path) {
    return this._defineRoute("DELETE", path);
  }

  /**
   * Defines a PATCH route.
   * 
   * @param {string} path - The route path.
   * @returns {Object} - The route definition chain.
   */
  patch(path) {
    return this._defineRoute("PATCH", path);
  }
}

export default Maya;
