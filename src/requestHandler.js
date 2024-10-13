const ErrorHandler = require("./errResponse.js");
const createContext = require('./context.js');

const cache = new Map()

module.exports = async function handleRequest(request,maya) {
  if (request?.path === "/favicon.ico") {
    return;
  }

  const context = createContext(request)

  // OnReq hook 1
  if (maya.hasOnReqHook) {
    for (const hook of maya.hooks.onRequest) {
      await hook(context);
    }
  }

  // if  cors config is enabled then--->
  if (maya.corsConfig) {
   const corsResult = await applyCors(request, context, maya.corsConfig);
   if(corsResult) return corsResult;
  }


  if (maya.hasMiddleware) {
    const midllewares = [
      ...(maya.globalMidlleware || []),
      ...(maya.midllewares.get(request.path) || [])
    ]
    const middlewareResult = await executeMiddleware(midllewares,context);
    if(middlewareResult) return middlewareResult;
  }

  // Run preHandler hooks 2
  if (maya.hasPreHandlerHook) {
    for (const hook of maya.hooks.preHandler) {
      const res = await hook(context);
      if(res) return;
    }
  }

  // find the Handler based on req path
  const routeHandler = maya.trie.search(request.path.split("?")[0], request.method);
  if (!routeHandler || !routeHandler.handler) {
    return sendError(socket,ErrorHandler.RouteNotFoundError(routeHandler?.path ?? 'path'))
  }

  if (routeHandler?.method !== request.method) {
    return sendError(socket, ErrorHandler.methodNotAllowedError());
  }

  // we storing routePatter here so if user call context.getParams()
  // we will just req.routePattern and request.path and call extractParams()
  // so by doing this we will avoid parsing params. only when user calll
  if (routeHandler.isDynamic) {
    request.routePattern = routeHandler.path
  }

  // if we found handler then call the handler(means controller)
    try {
     const result = await routeHandler.handler(context)

     // 3. run the postHandler hooks 
    if (maya.hasPostHandlerHook) {
      for (const hook of maya.hooks.postHandler) {
        await hook(context);
      }
    }

    // 4. Run onSend hooks before sending the response
    if (maya.hasOnSendHook) {
      for (const hook of maya.hooks.onSend) {
        const res = await hook(result, context);
        if(res) return;
      }
    }

      if(result) return result;

    } catch (error) {
      console.error("Error in handler:", error);
      return ErrorHandler.internalServerError(`Error in handler at ${request.path}: ${error.message}\nStack Trace: ${error.stack}`)
    }
};


// function handleResponse(result) {
//   if (typeof result === 'string') {
//     let res =`HTTP/1.1 200 ok\r\n`;
//     res += `Content-Type: text/plain\r\n`; 
//     res += "\r\n";
//     res += result;
//     return res;
//   } else if (typeof result === 'object') {
//     let res =`HTTP/1.1 200 ok\r\n`;
//     res += `Content-Type: application/json\r\n`; 
//     res += "\r\n";
//     res += JSON.stringify(result);
//     return res;
//   }
//   return result;
// }


// we are applying cors here
// needs to work here more
const applyCors = (req, ctx, config = {}) => {
  const origin = req.headers["origin"];
  const allowedOrigins = config.origin || ["*"];
  const allowedMethods = config.methods || "GET,POST,PUT,DELETE,OPTIONS";
  const allowedHeaders = config.headers || ["Content-Type", "Authorization"];
  const allowCredentials = config.credentials || false;
  const exposeHeaders = config.exposeHeaders || [];

  // Set CORS headers
  ctx.setHeader("Access-Control-Allow-Methods", allowedMethods);
  ctx.setHeader("Access-Control-Allow-Headers", allowedHeaders);

  if(allowCredentials){
    ctx.setHeader("Access-Control-Allow-Credentials","true")
  }
  if (exposeHeaders.length) {
    ctx.setHeader("Access-Control-Expose-Headers", exposeHeaders.join(", "));
  }

  // Check if the origin is allowed
  if (!allowedOrigins.includes("*") && !allowedOrigins.includes(origin)) {
    return ctx.text("CORS not allowed",403);
  }

  // Set Access-Control-Allow-Origin
  ctx.setHeader("Access-Control-Allow-Origin", allowedOrigins.includes("*") ? "*" : origin);

  // Handle preflight request
  if (req.method === "OPTIONS") {
    ctx.setHeader("Access-Control-Max-Age", "86400");
    return ctx.text('',204)
  }

  return null;
};


async function executeMiddleware(middlewares,context,socket) {
  for (let i = 0; i < middlewares.length; i++) {
    const middleware = middlewares[i];
    try {
      // our resHandler is designed to socket.write the res itself
        // but if any midl gives res so we need to break the code that why 
        // in resHandler class we are returning true in res so 
        // if midl socket has wrote the res then return from here
      const result = await Promise.resolve(middleware(context, socket));
        // here in res we will get true
      if (result || !socket.writable) {
        return;
      }
    } catch (error) {
      // console.error("Middleware error:", error);
      sendError(socket,ErrorHandler.internalServerError(error))
      break; 
    }
  }
}

function sendError(socket, error) {
  socket.write(error);
  socket.end();
  return;
}