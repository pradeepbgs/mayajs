const ErrorHandler = require("./errResponse.js");
const createContext = require('./context.js');


module.exports = async function handleRequest(
  socket,
  request,
  maya,
  responseHandler
) {
  if (request?.path === "/favicon.ico") {
    return socket.end();  
  }
  const context = createContext(request,responseHandler)

  // Parsing the request
  const { method, path } = request;
  const [routerPath, queryString] = (path || "").split("?");
  const query = new URLSearchParams(queryString || "");
  request.query = Object.fromEntries(query.entries());

  // if  cors config is enabled then--->
  if (maya.corsConfig) {
    const res = await applyCors(request, responseHandler, maya.corsConfig);
    if (res) {
      socket.write(res);
      socket.end();
    }
  }

  // execute midlleware here
  const midllewares = [
    ...(maya.globalMidlleware || []),
    ...(maya.midllewares.get(request.path) || [])
  ]
  
  await executeMiddleware(midllewares,context,socket);

  // find the Handler based on req path
  const routeHandler = maya.trie.search(routerPath, method);
  if (!routerPath || !routeHandler || !routeHandler.handler) {
    return sendError(socket,ErrorHandler.RouteNotFoundError())
  }

  if (routeHandler?.method !== method) {
    return sendError(socket, ErrorHandler.methodNotAllowedError());
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
      const isAsync = handler.constructor.name === "AsyncFunction";

      if (isAsync) {
        const result  = await handler(context)
        if(result) return handleResponse(result,responseHandler)
      }else{
        const result = handler(context)
        if(result) return handleResponse(result,responseHandler)
      }
    } catch (error) {
      console.error("Error in handler:", error);
      return ErrorHandler.internalServerError(`Error in handler: ${error}`);
    }
  } else {
    socket.write(ErrorHandler.RouteNotFoundError());
  }
};


function handleResponse(result, responseHandler) {
  if (typeof result === 'string') {
    return responseHandler.send(result);
  } else if (typeof result === 'object') {
    return responseHandler.json(result);
  }
  return null;
}

function sendError(socket, error) {
  socket.write(error);
  socket.end();
}

// if user made dynamic rooute -> /route/:id then extract it
const extractDynamicParams = (routePattern, path) => {
  const object = {};
  const routeSegments = routePattern.split("/");
  const [pathWithoutQuery] = path.split("?"); // Ignore the query string in the path
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
const applyCors = (req, res, config = {}) => {
  const origin = req.headers["origin"];
  const allowedOrigins = config.origin || "*";
  const allowedMethods = config.methods || "GET,POST,PUT,DELETE,OPTIONS";
  const allowedHeaders = config.headers || ["Content-Type", "Authorization"];

  res.setHeader("Access-Control-Allow-Methods", allowedMethods);
  res.setHeader("Access-Control-Allow-Headers", allowedHeaders);

  if (
    !allowedOrigins.includes("*") ||
    (!allowedOrigins === "*" && !allowedOrigins.includes(origin))
  ) {
    return res.send("cors not allowed");
  }

  if (origin === "OPTIONS") {
    res.setHeader("Access-Control-Max-Age", "86400");
    return res.send("", 204);
  }

  return null;
};

async function executeMiddleware(middlewares,context,socket) {
  for (let i = 0; i < middlewares.length; i++) {
    const middleware = middlewares[i];
    try {
      const result = await Promise.resolve(middleware(context, socket));
      if (result || !socket.writable) {
        break;
      }
    } catch (error) {
      console.error("Middleware error:", error);
      socket.write(JSON.stringify({ message: "Middleware error", status: 500 }));
      socket.end();
      break; 
    }
  }
}
