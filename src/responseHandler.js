
class ResponseHandler {
  constructor() {
    this.headers={}
  }

  setHeader(key,value){
    this.headers[key] = value;
  }

  _generateResponse(data, statusCode = 200, statusMessage = "OK", contentType = "text/plain") {
    let response = `HTTP/1.1 ${statusCode} ${statusMessage}\r\n`;
    response += `Content-Type: ${contentType}\r\n`;

    if (Object.keys(this.headers).length > 0) {
      for (const [key, value] of Object.entries(this.headers)) {
        response += `${key}: ${value}\r\n`;
      }
    }

    response += "\r\n"; // End of headers
    response += typeof data === "object" ? JSON.stringify(data) : data;
    return response;
  }


  json(data, statusCode = 200, statusMessage = "OK") {
    return this._generateResponse(data, statusCode, statusMessage, "application/json");
  }


  send(data, statusCode = 200, statusMessage = "OK") {
    return this._generateResponse(data, statusCode, statusMessage);
  }

  render(){
    // it can render html solo and ejs with some data ->
    
  }

  
  redirect(url, statusCode = 302) {
    return this._generateResponse("", statusCode, "Found", "text/plain", { Location: url });
  }

  cookie(name,value,options={}){
    let cookie = `${name}=${value}`
    if (options.expires) {
      cookie += ` Expires=${options.expires.toUTCString()};`;
    }

    if (options.maxAge) {
      cookie += ` Max-Age=${options.maxAge};`;
    }

    if (options.domain) {
      cookie += ` Domain=${options.domain};`;
    }

    if (options.path) {
      cookie += ` Path=${options.path};`;
    }

    if (options.secure) {
      cookie += ` Secure;`;
    }

    if (options.httpOnly) {
      cookie += ` HttpOnly;`;
    }
    this.headers["Set-Cookie"] = cookie;
  }
}

export default new ResponseHandler();
