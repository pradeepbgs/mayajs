const errResponse = (statusCode, statusMessage, contentType = "text/plain", data = "") => {
  let errRes = "";
  errRes += `HTTP/1.1 ${statusCode} ${statusMessage} \r\n`;
  errRes += `Content-Type: ${contentType}\r\n\r\n`;
  errRes += data.toString();
  return errRes;
};

class ErrorHandler {
  invalidRequestError(err) {
    return errResponse(400, "Bad Request", "text/plain", `${err?err:"invalid request format"}`);
  }

  internalServerError() {
    return errResponse(500, "Internal Server Error", "text/plain", "Internal server error");
  }

  RouteNotFoundError(path) {
    // console.error(`looks like you forgot to add this route - "${path}" bro`);
    return errResponse(404, "Not Found", "text/plain", 
      `cannot get ${path}\n`);
  }

  methodNotAllowedError() {
    return errResponse(405, "Method Not Allowed", "text/plain", "Method not allowed");
  }

  requestSize_to_large(){
    return errResponse(400,'Bad Request','application/json','Request size too large')
  }
}

module.exports =  new ErrorHandler();
