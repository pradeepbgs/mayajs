// we are encapsulating necessary context such as ParsedRequest,...
// so we dont have to give ->> await handler(request, responseHandler, () => {})
// like this we can just ->>> await handleRequest(xl)

const path = require("path");
const fs = require("fs");
const CACHE_TTL = 1 * 60 * 1000;
const MAX_CACHE_SIZE = 100;
const cache = new Map();

module.exports = function createContext(
  request,
  staticFileServeLocation
) {
  const headers = {};
  function _generateResponse(
    data,
    statusCode = 200,
    statusMessage = "OK",
    contentType = "text/plain"
  ) {
    // cehck if cache has this cache key data then give this cached data;
    const cacheKey = `${statusCode}-${contentType}-${data}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.response;
    }

    let response = `HTTP/1.1 ${statusCode} ${statusMessage}\r\n`;
    response += `Content-Type: ${contentType}\r\n`;

    if (Object.keys(headers).length > 0) {
      for (const [key, value] of Object.entries(headers)) {
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
    const timeStamp = Date.now();
    if (cache.size >= MAX_CACHE_SIZE) {
      const oldestKey = cache.keys().next().value;
      cache.delete(oldestKey);
    }
    cache.set(cacheKey, { response, timestamp: timeStamp });
    return response;
  }

  return {
    req: request,
    settedValue: {},
    isAuthenticated: false,
    _parsedCookie:null,
    _parsedQuery : null,
    _parsedParams:null,
    next: () => {},
    //
    setHeader(key, value) {
      headers[key] = value;
    },

    set(key, value) {
      this.settedValue[key] = value;
    },

    get(key) {
      return this.settedValue[key];
    },

    setAuthentication(isAuthenticated) {
      this.isAuthenticated = isAuthenticated;
    },

    checkAuthentication() {
      return this.isAuthenticated;
    },

    json(data, statusCode = 200) {
      try {
        return _generateResponse(
          JSON.stringify(data || {}),
          statusCode,
          "ok",
          "application/json"
        );
      } catch (error) {
        console.error("Error serializing JSON:", error);
        return _generateResponse(
          '{"error":"Error serializing JSON"}',
          500,
          "Internal Server Error",
          "application/json"
        );
      }
    },

    send(data, statusCode = 200) {
      return _generateResponse(data, statusCode);
    },

    text(data, statusCode = 200) {
      return _generateResponse(data, statusCode);
    },

    async html(filename, statusCode = 200) {
      const extname = path.extname(filename);
      const RealPath = path.join(staticFileServeLocation, filename);

      if (extname === ".html") {
        try {
          const file = await fs.promises.readFile(RealPath, "utf-8");
          return _generateResponse(file, statusCode);
        } catch (error) {
          return _generateResponse(
            "Internal Server Error",
            500,
            "Internal Server Error"
          );
        }
      }
      // Handle unsupported file types
      else {
        return _generateResponse(
          "Unsupported file type, give HTML",
          415,
          "Unsupported Media Type"
        );
      }
    },

    async render(
      templatePath,
      data = {},
      statusCode = 200,
      statusMessage = "OK",
      contentType = "text/html"
    ) {
      const extname = path.extname(templatePath);
      const RealPath = path.join(staticFileServeLocation, templatePath);

      if (extname === ".html") {
        try {
          const file = await fs.promises.readFile(RealPath, "utf-8");
          return _generateResponse(
            file,
            statusCode,
            statusMessage,
            contentType
          );
        } catch (error) {
          return _generateResponse(
            "Internal Server Error",
            500,
            "Internal Server Error"
          );
        }
      }
      // Handle unsupported file types
      else {
        return _generateResponse(
          "Unsupported file type, give HTML",
          415,
          "Unsupported Media Type"
        );
      }
    },

    redirect(url, statusCode = 302) {
      this.setHeader("Location", url);
      return _generateResponse("", statusCode, "Found", "text/plain");
    },

    cookie(name, value, options = {}) {
      const defaults = {
        secure: true,
        httpOnly: true,
        sameSite: "Lax",
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

      if (headers["Set-Cookie"]) {
        const existingCookies = Array.isArray(headers["Set-Cookie"])
          ? headers["Set-Cookie"]
          : [headers["Set-Cookie"]];

        // Add new cookie to the array
        existingCookies.push(cookie);

        // Update Set-Cookie header
        headers["Set-Cookie"] = existingCookies;
      } else {
        headers["Set-Cookie"] = cookie;
      }
    },

    getCookie(cookieName) {
      if (!this._parsedCookie) {
        this._parsedCookie = parseCookie(request.headers['cookie'])
      }
      return cookieName ? this._parsedCookie[cookieName] : this._parsedCookie;
    },

    getQuery(queryKey) {
      if (!this._parsedQuery) {
        const queryString = request.path.split("?")[1] || "";
        this._parsedQuery = new URLSearchParams(queryString);
      }
      return queryKey ? this._parsedQuery[queryKey] || null : this._parsedQuery;
    },

    getParams(paramsName) {
      if (!this._parsedParams) {
        this._parsedParams = extractDynamicParams(request.routePattern,request.path)
      }
      return paramsName ? this._parsedParams[paramsName] || null : this._parsedParams;
    },
  };
};

function parseCookie(header){
  const cookies = {}
  if (!header) return cookies;

  const cookieArray = header.split(";")
  cookieArray.forEach(cookie =>{
    const [cookieName,cookievalue] = cookie.trim().split("=")
    cookies[cookieName] = cookievalue.split(" ")[0]
  })
  return cookies;
}


const extractDynamicParams = (routePattern, path) => {
  if(!routePattern) return {};
  const cacheKey = `${routePattern}-${path}`

  if (cache.has(cacheKey)) {
    return cache.get(cacheKey)
  }

  const object = {};
  const routeSegments = routePattern?.split("/");
  const [pathWithoutQuery] = path.split("?"); // Ignore the query string in the path
  const pathSegments = pathWithoutQuery.split("/"); // Re-split after removing query

  if (routeSegments.length !== pathSegments.length) {
    return null; // Path doesn't match the pattern
  }

  routeSegments.forEach((segment, index) => {
    if (segment.startsWith(":")) {
      const dynamicKey = segment.slice(1); // Remove ':' to get the key name
      object[dynamicKey] = pathSegments[index]; // Map the path segment to the key
    }
  });
  cache.set(cacheKey,object)
  return object;
};