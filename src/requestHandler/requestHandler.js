import ErrorHandler from "../responseHandler/errResponse.js";
export async function handleRequest(request, route) {
  const { method, path } = request;

  const [routerPath, queryString] = (path || "").split("?");
  const query = queryString ? new URLSearchParams(queryString) : new URLSearchParams();

  // Convert query parameters to an object
  const queryObject = Object.fromEntries(query.entries());
  request.query = queryObject;

  const handler = route[method][routerPath];
  if (handler) {
    try {
      const res = await handler(request);
      return res;
    } catch (error) {
      console.error("Error in handler:", error);
      return ErrorHandler.internalServerError();
    }
  } else {
    return ErrorHandler.RouteNotFoundError();
  }
}
