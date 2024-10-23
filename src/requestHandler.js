const ErrorHandler = require("./errResponse.js");
const createContext = require("./context.js");

// const cache = new Map();

module.exports = async function handleRequest(request, maya) {
  if (request?.path === "/favicon.ico") {
    return;
  }

  const context = createContext(request);

  // find the Handler based on req path
  const routeHandler = maya.trie.search(
    request.path.split("?")[0],
    request.method
  );
  if (!routeHandler || routeHandler?.method !== request.method) {
    return routeHandler 
    ? ErrorHandler.methodNotAllowedError() 
    : ErrorHandler.RouteNotFoundError(routeHandler?.path ?? "path");
  }

  if (routeHandler.isDynamic) {
    request.routePattern = routeHandler.path;
  } 

  // if  cors config is enabled then--->
  if (maya.corsConfig) {
    const corsResult = await applyCors(request, context, maya.corsConfig);
    if (corsResult) return corsResult;
  }

  // OnReq hook 1
  if (maya.hasOnReqHook) {
    await maya.hooks.onRequest(context);
  }

  if (maya.hasFilterEnabled) {
    const path = request.routePattern ??  request.path.split("?")[0]
    const hasRoute = maya.filters.includes(path)
    if (hasRoute === false) {
      if (maya.filterFunction) {
        const filterResult = await maya?.filterFunction(ctx, server)
        if (filterResult) return filterResult
      } else {
        return context.json({
          message: "Authentication required"
        },400)
      }
  }
}


  if (maya.hasMiddleware) {
    const midllewares = [
      ...maya.globalMidlleware,
      ...(maya.midllewares.get(request.path) || []),
    ];
    const middlewareResult = await executeMiddleware(midllewares, context);
    if (middlewareResult) return middlewareResult;
  }

  // Run preHandler hooks 2
  if (maya.hasPreHandlerHook) {
    const Hookresult = await diesel.hooks.preHandler(ctx);
    if (Hookresult) return Hookresult;
  }


  // if we found handler then call the handler(means controller)
  try {
    const result = await routeHandler.handler(context);

    // 3. run the postHandler hooks
    if (maya.hasPostHandlerHook) {
      await maya.hooks.postHandler(ctx);
    }

    // 4. Run onSend hooks before sending the response
    if (maya.hasOnSendHook) {
      const hookResponse = await diesel.hooks.onSend(ctx, result);
      if (hookResponse) return hookResponse;
    }

    return (
      result ||
      ErrorHandler.internalServerError("No Response from this handler")
    );
  } catch (error) {
    // console.error("Error in handler:", error);
    return ErrorHandler.internalServerError(
      `Error in handler at ${request.path}: ${error.message}\nStack Trace: ${error.stack}`
    );
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
  ctx.setHeader("Access-Control-Allow-Credentials", allowCredentials);

  if (exposeHeaders.length) {
    ctx.setHeader("Access-Control-Expose-Headers", exposeHeaders);
  }

  if (allowCredentials) {
    ctx.setHeader("Access-Control-Allow-Credentials", "true");
  }
  if (exposeHeaders.length) {
    ctx.setHeader("Access-Control-Expose-Headers", exposeHeaders.join(", "));
  }

  if (allowedOrigins === '*') {
    ctx.setHeader("Access-Control-Allow-Origin", "*")
  } else if (Array.isArray(allowedOrigins)) {
    if (origin && allowedOrigins.includes(origin)) {
      ctx.setHeader("Access-Control-Allow-Origin", origin)
    } else if (allowedOrigins.includes('*')) {
      ctx.setHeader("Access-Control-Allow-Origin", '*')
    }
    else {
      return ctx.status(403).json({ message: "CORS not allowed" })
    }
  } else if (typeof allowedOrigins === 'string') {
    if (origin === allowedOrigins) {
      ctx.setHeader("Access-Control-Allow-Origin", origin)
    }
    else {
      return ctx.status(403).json({ message: "CORS not allowed" });
    }
  } else {
    return ctx.status(403).json({ message: "CORS not allowed" })
  }

  // Set Access-Control-Allow-Origin
  ctx.setHeader("Access-Control-Allow-Origin",origin);

  // Handle preflight request
  if (req.method === "OPTIONS") {
    ctx.setHeader("Access-Control-Max-Age", "86400");
    return ctx.text("", 204);
  }

  return null;
};

async function executeMiddleware(middlewares, context, socket) {
  for (let i = 0; i < middlewares.length; i++) {
    const middleware = middlewares[i];
    try {
      const result = await Promise.resolve(middleware(context, socket));
      if (result) {
        return result;
      }
    } catch (error) {
      return ErrorHandler.internalServerError("Error while executing error");
    }
  }
}
