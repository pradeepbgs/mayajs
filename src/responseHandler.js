const path = require("path");
const fs = require("fs");

const CACHE_TTL = 1 * 60 * 1000;
const MAX_CACHE_SIZE = 100;

class ResponseHandler{
  constructor(socket) {
    this.headers = {};
    this.cache = new Map();
    this.socket = socket;
  }

  setHeader(key, value) {
    this.headers[key] = value;
  }

  _generateResponse(data, statusCode = 200, statusMessage = "OK", contentType = "text/plain") {
    // cehck if cache has this cache key data then give this cached data;
    const cacheKey = `${statusCode}-${contentType}-${data}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.value;
    }

    let response = `HTTP/1.1 ${statusCode} ${statusMessage}\r\n`;
    response += `Content-Type: ${contentType}\r\n`;

    if (Object.keys(this.headers).length > 0) {
      for (const [key, value] of Object.entries(this.headers)) {
        response += `${key}: ${value}\r\n`;
      }
    }

    response += "\r\n"; // End of headers
    response += data;

    // set the res in cache
    const timeStamp = Date.now();
    if (this.cache.size >= MAX_CACHE_SIZE) {
      const oldestKey = cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
    this.cache.set(cacheKey, { response, timeStamp });

    return response;
  }

  json(data, statusCode = 200, statusMessage = "OK", contentType = "application/json") {
    const response =  this._generateResponse(JSON.stringify(data),
     statusCode, statusMessage, "application/json");
     if(this.socket.writable){
      this.socket.write(response)
      this.socket.end()
     }
  }

  send(data, statusCode = 200, statusMessage = "OK") {
    return this._generateResponse(data, statusCode, statusMessage);
  }

  render(filePath,templatePath, data = {}, statusCode = 200, statusMessage = "OK", contentType = "text/html") {
    const extname = path.extname(templatePath);
    const RealPath = path.join(filePath,templatePath)
    if (extname === ".html") {
      return new Promise((resolve, reject) => {
        fs.readFile(RealPath, "utf8", (err, content) => {
          if (err) {
            console.error("Error reading HTML file:", err);
            resolve(this._generateResponse(err, 500, "Internal Server Error"));
          } else {
            resolve(this._generateResponse(content, statusCode, statusMessage, contentType));
          }
        });
      });
    }
    // Handle unsupported file types
    else {
      return this._generateResponse("Unsupported file type", 415, "Unsupported Media Type");
    }
  }

  redirect(url, statusCode = 302) {
    this.setHeader("Location", url);
    return this._generateResponse("", statusCode, "Found", "text/plain", { Location: url });
  }

  cookie(name, value, options = {}) {
    let cookie = `${name}=${value}`;
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

module.exports = ResponseHandler;
