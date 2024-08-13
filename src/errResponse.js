const errResponse = (statusCode, statusMessage, contentType = "text/plain", data = "") => {
  let errRes = "";
  errRes += `HTTP/1.1 ${statusCode} ${statusMessage} \r\n`;
  errRes += `Content-Type: ${contentType}\r\n\r\n`;
  errRes += data.toString();
  return errRes;
};

class ErrorHandler {
  invalidRequestError() {
    return errResponse(400, "Bad Request", "text/plain", "Invalid request format");
  }

  internalServerError() {
    return errResponse(500, "Internal Server Error", "text/plain", "Internal server error");
  }

  RouteNotFoundError() {
    return errResponse(404, "Not Found", "text/plain", "Route not found");
  }

  methodNotAllowedError() {
    return errResponse(405, "Method Not Allowed", "text/plain", "Method not allowed");
  }
}

export default new ErrorHandler();
