import ErrorHandler from "./errResponse.js";
import ResponseHandler from "./responseHandler.js";

export async function handleRequest(request, route , compiledMiddlewares) {
 
  for (const [pathPrefix, middleware] of compiledMiddlewares) {
    if (pathPrefix === "/" || request.path.startsWith(pathPrefix)) {
      const res = await middleware(request, ResponseHandler, () => {});
      if (res) {
        return res;
      }
    }
  }

  const { method, path } = request;
  const response = ResponseHandler;

  const [routerPath, queryString] = (path || "").split("?");
  const query = queryString ? new URLSearchParams(queryString) : new URLSearchParams();

  // Convert query parameters to an object
  const queryObject = Object.fromEntries(query.entries());
  request.query = queryObject;

  const routeHandlers = route[method] || [];
  const handler = routeHandlers.find(([path]) => path === routerPath)?.[1];

  if (handler) {
    try {
      const res = await handler(request, response);
      return res;
    } catch (error) {
      console.error("Error in handler:", error);
      return ErrorHandler.internalServerError();
    }
  } else {
    console.error(ErrorHandler.RouteNotFoundError())
    return ErrorHandler.RouteNotFoundError();
  }
}
