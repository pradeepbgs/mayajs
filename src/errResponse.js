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

  RouteNotFoundError(path) {
    console.error(`looks like you forgot to add this route bro ${path}`);
    return errResponse(404, "Not Found", "text/plain", 
      `404 Not Found: The path ${path} leads to a black hole. It's lost in space!`);
  }

  methodNotAllowedError() {
    return errResponse(405, "Method Not Allowed", "text/plain", "Method not allowed");
  }

  requestSize_to_large(){
    return errResponse(400,'Bad Request','application/json','Request size too large')
  }
}

module.exports =  new ErrorHandler();
