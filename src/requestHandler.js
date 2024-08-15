import ErrorHandler from "./errResponse.js";
import ResponseHandler from "./responseHandler.js";

export async function handleRequest(request, route, compiledMiddlewares) {
  for (const [pathPrefix, middleware] of compiledMiddlewares) {
    if (pathPrefix === "/" || request.path.startsWith(pathPrefix)) {
      const res = await middleware(request, ResponseHandler, () => { });
      if (res) {
        return res;
      }
    }
  }

  const { method, path } = request;
  const response = ResponseHandler;
  const [routerPath, queryString] = (path || "").split("?");
  const query = queryString
    ? new URLSearchParams(queryString)
    : new URLSearchParams();
  // Convert query parameters to an object
  const queryObject = Object.fromEntries(query.entries());
  request.query = queryObject;

  const routeHandlers = route[method] || [];
  let handler;
  let dynamicParams = {};
  for (const [routePattern, routeHandler] of routeHandlers) {
    if (routePattern.includes(":")) {
      dynamicParams = extractDynamicParams(routePattern, path);
      if (dynamicParams) {
        handler = routeHandler;
        break;
      }
    } else if (routePattern === routerPath) {
      handler = routeHandler;
      break;
    }
  }

  if (dynamicParams && Object.keys(dynamicParams).length > 0) {
    request.query = { ...request.query, ...dynamicParams };
  }

  if (handler) {
    try {
      const res = await handler(request, response);
      return res;
    } catch (error) {
      console.error("Error in handler:", error);
      return ErrorHandler.internalServerError();
    }
  } else {
    console.error(ErrorHandler.RouteNotFoundError());
    return ErrorHandler.RouteNotFoundError();
  }
}

const extractDynamicParams = (routePattern, path) => {
  const object = {};
  const routeSegments = routePattern.split('/');
  const pathSegments = path.split('/');

  if (routeSegments.length !== pathSegments.length) {
    return null; // Path doesn't match the pattern
  }

  routeSegments.forEach((segment, index) => {
    if (segment.startsWith(':')) {
      const dynamicKey = segment.slice(1); // Remove ':' to get the key name
      object[dynamicKey] = pathSegments[index]; // Map the path segment to the key
    }
  });

  return object;

};
