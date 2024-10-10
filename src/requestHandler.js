const ErrorHandler = require("./errResponse.js");
const createContext = require('./context.js');

const cache = new Map()

module.exports = async function handleRequest(socket,request,maya) {
  if (request?.path === "/favicon.ico") {
    socket.end();  
    return;
  }

  const context = createContext(socket,request)

  // Parsing the request
  const { method, path } = request;
  // const [routerPath, queryString] = (path || "").split("?");
  // const query = new URLSearchParams(queryString || "");
  // request.query = Object.fromEntries(query.entries());

  // if  cors config is enabled then--->
  if (maya.corsConfig) {
    await applyCors(request, context, maya.corsConfig);
  }

  if (maya.hasMiddleware) {
    const midllewares = [
      ...(maya.globalMidlleware || []),
      ...(maya.midllewares.get(request.path) || [])
    ]
    await executeMiddleware(midllewares,context,socket);
  }

  // find the Handler based on req path
  const routeHandler = maya.trie.search(path.split("?")[0], method);
  if (!routeHandler || !routeHandler.handler) {
    return sendError(socket,ErrorHandler.RouteNotFoundError(routeHandler?.path ?? 'path'))
  }

  if (routeHandler?.method !== method) {
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

      if(result) return handleResponse(socket,result);
    } catch (error) {
      console.error("Error in handler:", error);
      return sendError(socket, 
        ErrorHandler.internalServerError(`Error in handler at ${request.path}: ${error.message}\nStack Trace: ${error.stack}`));
    }
};


function handleResponse(socket,result) {
  if (typeof result === 'string') {
    let res =`HTTP/1.1 200 ok\r\n`;
    res += `Content-Type: text/plain\r\n`; 
    res += "\r\n";
    res += result
    socket.write(res)
    socket.end()
    return;
  } else if (typeof result === 'object') {
    let res =`HTTP/1.1 200 ok\r\n`;
    res += `Content-Type: application/json\r\n`; 
    res += "\r\n";
    res += JSON.stringify(result)
    socket.write(res)
    socket.end()
    return
  }
}


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
      const result = await Promise.resolve(middleware(context, socket));
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