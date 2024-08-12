import ErrorHandler from "../responseHandler/errResponse.js";
import ResponseHandler from "../responseHandler/responseHandler.js";

export async function handleRequest(request, route, middlewares) {
  const { method, path } = request;
  const response = ResponseHandler;

  // global hande execution
  const globalMiddleware = middlewares["/"];
  if (globalMiddleware) {
    try {
      const res = await globalMiddleware(request, response, () => {});
      if (res) {
        return res;
      }
    } catch (err) {
      console.error("Error in global middleware:", err);
      return ErrorHandler.internalServerError();
    }
  }

  for (const [pathPrefix, middleware] of Object.entries(middlewares)) {
    if (path.startsWith(pathPrefix) && pathPrefix !== "/") {
      await new Promise((resolve) => {
        middleware(request, response, () => resolve()); // Passing next function
      });
      // If the middleware has sent a response, exit early
      if (response.finished) {
        console.log('req has finished')
        return;
      }
    }
  }

  //
  const [routerPath, queryString] = (path || "").split("?");
  const query = queryString ? new URLSearchParams(queryString) : new URLSearchParams();

  // Convert query parameters to an object
  const queryObject = Object.fromEntries(query.entries());
  request.query = queryObject;

  const handler = route[method][routerPath];
  if (handler) {
    try {
      const res = await handler(request, response);
      return res;
    } catch (error) {
      console.error("Error in handler:", error);
      return ErrorHandler.internalServerError();
    }
  } else {
    return ErrorHandler.RouteNotFoundError();
  }
}
