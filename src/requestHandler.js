import ErrorHandler from "./errResponse.js";
import ResponseHandler from "./responseHandler.js";


export async function handleRequest(request, maya) {
  // Parsing the request
  const { method, path } = request;
  const [routerPath, queryString] = (path || "").split("?");
  const query = new URLSearchParams(queryString || "");
  request.query = Object.fromEntries(query.entries());


  // if  corsconfig is enabled then--->
  if(maya.corsConfig){
    const res = await applyCors(request,ResponseHandler,maya.corsConfig)
    if(res) return res;
  }

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

  // find the Handler based on req path 
  const routeHandler = maya.trie.search(routerPath);

  if (routeHandler?.method !== method) {
    return ErrorHandler.methodNotAllowedError();
  }

  if (!routerPath) {
    return ErrorHandler.RouteNotFoundError();
  }
  let handler;
  let dynamicParams = {};

  if (routeHandler?.isDynamic) {
      dynamicParams = extractDynamicParams(routeHandler.path, path);
      if (dynamicParams) {
        request.params = dynamicParams;
        handler = routeHandler.handler;
      }
    } else if (routeHandler?.path === routerPath) {
      handler = routeHandler.handler;
    }
  

// if we found handler then call the handler(means controller)
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

// if user made dynamic rooute -> /route/:id then extract it
const extractDynamicParams = (routePattern, path) => {
  const object = {};
  const routeSegments = routePattern.split("/");
  const [pathWithoutQuery] = path.split('?'); // Ignore the query string in the path
  const pathSegments = pathWithoutQuery.split("/"); // Re-split after removing query


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



// we are applying cors here 
const applyCors = (req, res, config) => {
  const origin = req.headers['origin']; // Get the origin of the request
  const allowedOrigins = config?.origin ?? '*'; // Default to '*' if not provided
  const allowedMethods = config?.methods ?? 'GET,POST,PUT,DELETE,OPTIONS';
  const allowedHeaders = config?.headers ?? ['Content-Type', 'Authorization'];

  // If allowedOrigins is '*', you can directly allow the request
  if (allowedOrigins.includes('*') || allowedOrigins === '*') {
    res.setHeader('Access-Control-Allow-Origin', '*'); // Allow any origin
  } else {
    // If specific origins are allowed, check if the origin is in the list
    if (!origin || !allowedOrigins.includes(origin)) {
      return res.send('Not allowed by CORS'); // Block if origin not allowed
    }
    res.setHeader('Access-Control-Allow-Origin', origin); // Set specific origin
  }

  res.setHeader('Access-Control-Allow-Methods', allowedMethods);
  res.setHeader('Access-Control-Allow-Headers', allowedHeaders);

  // Preflight request handling (OPTIONS method)
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Max-Age', '86400'); // Cache the preflight response for 24 hours
    return res.send('',204); // Send 204 (No Content) for preflight requests
  }

  // Proceed with the actual request (GET, POST, PUT, DELETE)
  return null;
};
