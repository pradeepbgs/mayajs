class ResponseHandler {
  constructor() {}

  _generateResponse(data, statusCode = 200, statusMessage = "OK", contentType = "text/plain", headers = {}) {
    let response = `HTTP/1.1 ${statusCode} ${statusMessage}\r\n`;
    response += `Content-Type: ${contentType}\r\n`;

    if (Object.keys(headers).length > 0) {
      for (const [key, value] of Object.entries(headers)) {
        response += `${key}: ${value}\r\n`;
      }
    }

    response += "\r\n"; // End of headers
    response += typeof data === "object" ? JSON.stringify(data) : data;
    return response;
  }
  jsonResponse(data, statusCode = 200, statusMessage = "OK") {
    return this._generateResponse(data, statusCode, statusMessage, "application/json");
  }

  end(data, statusCode = 200, statusMessage = "OK") {
    return this._generateResponse(data, statusCode, statusMessage);
  }
  send(data, statusCode = 200, statusMessage = "OK") {
    return this._generateResponse(data, statusCode, statusMessage);
  }

  redirect(url, statusCode = 302) {
    return this._generateResponse("", statusCode, "Found", "text/plain", { Location: url });
  }
}

export default new ResponseHandler();
