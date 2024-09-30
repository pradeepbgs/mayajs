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
    // const cacheKey = `${statusCode}-${contentType}-${data}`;
    // const cached = this.cache.get(cacheKey);
    // if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    //   return cached.value;
    // }

    let response = `HTTP/1.1 ${statusCode} ${statusMessage}\r\n`;
    response += `Content-Type: ${contentType}\r\n`;

    if (Object.keys(this.headers).length > 0) {
      for (const [key, value] of Object.entries(this.headers)) {
        if (Array.isArray(value)) {
          value.forEach((cookie) => {
            response += `${key}: ${cookie}\r\n`;
          });
        } else if (key === "Set-Cookie") {
          // Split Set-Cookie header by comma
          const cookies = value.split(",");
          cookies.forEach((cookie) => {
            response += `${key}: ${cookie.trim()}\r\n`;
          });
        } else {
          response += `${key}: ${value}\r\n`;
        }
      }
    }

    response += "\r\n"; // End of headers
    response += data;

    // set the res in cache
    // const timeStamp = Date.now();
    // if (this.cache.size >= MAX_CACHE_SIZE) {
    //   const oldestKey = cache.keys().next().value;
    //   this.cache.delete(oldestKey);
    // }
    // this.cache.set(cacheKey, { response, timeStamp });
      if(this.socket.writable){
      this.socket.write(response)
      // this.socket.end()
     }
  }

  json(data, statusCode = 200, statusMessage = "OK", contentType = "application/json") {
    return this._generateResponse(JSON.stringify(data),
     statusCode, statusMessage, "application/json");
  }

  send(data, statusCode = 200, statusMessage = "OK") {
    return this._generateResponse(data, statusCode, statusMessage);
  }

  async render(filePath,templatePath, data = {}, statusCode = 200, statusMessage = "OK", contentType = "text/html") {
    const extname = path.extname(templatePath);
    const RealPath = path.join(filePath,templatePath)
    if (extname === ".html") {
      try {
        const file = await fs.promises.readFile(RealPath,'utf-8')
        return this._generateResponse(file, statusCode, statusMessage, contentType);
      } catch (error) {
        return this._generateResponse("Internal Server Error", 500, "Internal Server Error");
      }
    }
    // Handle unsupported file types
    else {
    return this._generateResponse("Unsupported file type, give HTML", 415, "Unsupported Media Type");
    }
  }

  redirect(url, statusCode = 302) {
    this.setHeader("Location", url);
    return this._generateResponse("", statusCode, "Found", "text/plain");
  }

  cookie(name, value, options = {}) {
    const defaults = {
      secure: true,
      httpOnly: true,
      sameSite: 'Lax',
    };
  
    options = { ...defaults, ...options };
  
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
  
    if (options.sameSite) {
      cookie += ` SameSite=${options.sameSite};`;
    }
  
    if (this.headers["Set-Cookie"]) {
      const existingCookies = Array.isArray(this.headers["Set-Cookie"])
      ? this.headers["Set-Cookie"]
      : [this.headers["Set-Cookie"]];

    // Add new cookie to the array
    existingCookies.push(cookie);

    // Update Set-Cookie header
    this.headers["Set-Cookie"] = existingCookies;
    } else {
      this.headers["Set-Cookie"] = cookie;
    }
  }
}

module.exports = ResponseHandler;
