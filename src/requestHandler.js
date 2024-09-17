const ErrorHandler =  require("./errResponse.js");
const ResponseHandler =  require("./responseHandler.js");


module.exports = async function handleRequest(socket,request, maya) {
  // Parsing the request
  const { method, path } = request;
  const [routerPath, queryString] = (path || "").split("?");
  const query = new URLSearchParams(queryString || "");
  request.query = Object.fromEntries(query.entries());

  // if  cors config is enabled then--->
  if(maya.corsConfig){
    const res = await applyCors(request,ResponseHandler,maya.corsConfig)
    if(res) {
      socket.write(res);
      socket.end()
    }
  }

  // // Global middleware runs here
  // const globalMiddleware = maya.middlewares['/'] || []
  // if (globalMiddleware) {
  //   for (const handler of globalMiddleware) {
  //     const res = await handler(request, ResponseHandler, () => {});
  //     if (res) return res;
  //   }
  // }

  // // Path prefix middleware runs here
  // const exactPathMiddleware = maya.middlewares[request.path] || []
  // if (exactPathMiddleware) {
  //   for (const handler of exactPathMiddleware){
  //     const res = await handler(request,ResponseHandler,() => {})
  //     if (res) return res;
  //   }
  // }

  // we can combine all midl in one 
  const globalMiddleware = await maya.middlewares['/'] || [];
  const exactPathMiddleware = await maya.middlewares[request.path] || [];
  const allMiddlewares = [...globalMiddleware, ...exactPathMiddleware];

  await executeMiddleware(allMiddlewares,request,ResponseHandler)
 

  // find the Handler based on req path 
  const routeHandler = maya.trie.search(routerPath);

  if (!routerPath || !routeHandler) {
    return ErrorHandler.RouteNotFoundError();
  }

  if (routeHandler?.method !== method) {
    return ErrorHandler.methodNotAllowedError();
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
      const res = await handler(request, ResponseHandler, () =>{});
      if (res) {
        socket.write(res)
      }
    } catch (error) {
      console.error("Error in handler:", error);
      return ErrorHandler.internalServerError();
    } finally {
      socket.end();
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
const applyCors = (req, res, config={}) => {
  const origin = req.headers['origin']
  const allowedOrigins = config.origin || '*'; 
  const allowedMethods = config.methods || 'GET,POST,PUT,DELETE,OPTIONS';
  const allowedHeaders = config.headers || ['Content-Type', 'Authorization'];

  res.setHeader('Access-Control-Allow-Methods', allowedMethods);
  res.setHeader('Access-Control-Allow-Headers', allowedHeaders);

  if (!allowedOrigins.includes('*') || !allowedOrigins === '*' &&
  !allowedOrigins.includes(origin)
  ) {
    return res.send("cors not allowed")
  }

  if (origin === "OPTIONS") {
    res.setHeader('Access-Control-Max-Age', '86400');
    return res.send('',204);
  }
  
  return null;
};

async function executeMiddleware(middlewares, req, res) {
  for (const handler of middlewares) {
    const result = await handler(req, res, () => {});
    if (result){
      socket.write(result)
      socket.end()
      return;
    }
  }
  return null;
}
