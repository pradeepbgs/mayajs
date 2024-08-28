import ErrorHandler from "./errResponse.js";
import ResponseHandler from "./responseHandler.js";

/**
 * @typedef {Object} Request
 * @property {string} method - The HTTP method of the request (e.g., 'GET', 'POST').
 * @property {string} path - The request path, including query string.
 * @property {Object} query - Parsed query parameters as an object.
 */

/**
 * @typedef {Object} Route
 * @property {Object.<string, Array<{handler: Function, isImportant?: boolean}>>} [method] - Route handlers grouped by HTTP method.
 */

/**
 * @typedef {Array<[string, Array<Function>]>} CompiledMiddlewares
 * @description An array of middleware definitions where each entry is a tuple with a path prefix and an array of middleware functions.
 */

/**
 * Handles an incoming request by applying middleware and routing to the appropriate handler.
 * @param {Request} request - The incoming request object.
 * @param {Route} route - The route definitions for different HTTP methods.
 * @param {CompiledMiddlewares} compiledMiddlewares - An array of middleware definitions.
 * @returns {Promise<any>} - The result of the request handling.
 */
export async function handleRequest(request, route, compiledMiddlewares) {
  // Parsing the request
  const { method, path } = request;
  const [routerPath, queryString] = (path || "").split("?");
  const query = new URLSearchParams(queryString || "");
  request.query = Object.fromEntries(query.entries());

  // Global middleware runs here
  const globalMiddleware = compiledMiddlewares.find(([pathPrefix]) => pathPrefix === '/');
  if (globalMiddleware) {
    for (const handler of globalMiddleware[1]) {
      const res = await handler(request, ResponseHandler, () => {});
      if (res) return res;
    }
  }

  // Path prefix middleware runs here
  const exactPathMiddleware = compiledMiddlewares
  .find(([pathPrefix]) => pathPrefix === request.path);
  if (exactPathMiddleware) {
    for (const handler of exactPathMiddleware[1]){
      const res = await handler(request,ResponseHandler,() => {})
      if (res) return res;
    }
  }

  // Route handling
  const routeHandlers = route[method] || [];
  let handler;
  let dynamicParams = {};

  for (const [routePattern, routeHandler] of routeHandlers) {
    if (routePattern.includes(":")) {
      dynamicParams = extractDynamicParams(routePattern, path);
      if (dynamicParams) {
        handler = routeHandler.handler;
        break;
      }
    } else if (routePattern === routerPath) {
      handler = routeHandler.handler;
      break;
    }
  }

  if (dynamicParams && Object.keys(dynamicParams).length > 0) {
    request.query = { ...request.query, ...dynamicParams };
  }

  if (handler) {
    try {
      const res = await handler(request, ResponseHandler);
      return res;
    } catch (error) {
      console.error("Error in handler:", error);
      return ErrorHandler.internalServerError();
    }
  } else {
    return ErrorHandler.RouteNotFoundError();
  }
}

/**
 * Extracts dynamic parameters from the route pattern and path.
 * @param {string} routePattern - The route pattern with dynamic segments.
 * @param {string} path - The actual path to extract parameters from.
 * @returns {Object|null} - An object with dynamic parameters or null if the path does not match the pattern.
 */
const extractDynamicParams = (routePattern, path) => {
  const object = {};
  const routeSegments = routePattern.split("/");
  const pathSegments = path.split("/");

  if (routeSegments.length !== pathSegments.length) {
    return null; // Path doesn't match the pattern
  }

  routeSegments.forEach((segment, index) => {
    if (segment.startsWith(":")) {
      const dynamicKey = segment.slice(1); // Remove ':' to get the key name
      object[dynamicKey] = pathSegments[index]; // Map the path segment to the key
    }
  });

  return object;
};
