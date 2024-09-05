import ErrorHandler from "./errResponse.js";
import ResponseHandler from "./responseHandler.js";


export async function handleRequest(request, maya) {
  // Parsing the request
  const { method, path } = request;
  const [routerPath, queryString] = (path || "").split("?");
  const query = new URLSearchParams(queryString || "");
  request.query = Object.fromEntries(query.entries());

  // Global middleware runs here
  const globalMiddleware = maya.middlewares['/'] || []
  if (globalMiddleware) {
    for (const handler of globalMiddleware) {
      const res = await handler(request, ResponseHandler, () => {});
      if (res) return res;
    }
  }

  // Path prefix middleware runs here
  const exactPathMiddleware = maya.middlewares[request.path] || []
  if (exactPathMiddleware) {
    for (const handler of exactPathMiddleware){
      const res = await handler(request,ResponseHandler,() => {})
      if (res) return res;
    }
  }

  // Route handling
  const routeHandler = maya.trie.search(routerPath);
  if (!routerPath) {
    return ErrorHandler.RouteNotFoundError();
  }
  let handler;
  let dynamicParams = {};

  if (routeHandler?.isDynamic) {
      dynamicParams = extractDynamicParams(routeHandler.path, path);
      if (dynamicParams) {
        request.query = { ...request.query, ...dynamicParams };
        handler = routeHandler.handler;
      }
    } else if (routeHandler?.path === routerPath) {
      handler = routeHandler.handler;
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
