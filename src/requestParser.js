const parseMultipartFormData  =  require("./multipartFormDataParser.js");
// const {ptr, CString } = require("bun:ffi");
// we are using this

function parseRequestHeader(requestBuffer,cache) {
  const request = requestBuffer.toString();
  // const buffer = Buffer.from(request + "\0");

  // const responsePtr = parse_headers(ptr(buffer));
  // const response = new CString(responsePtr);

  // console.log(JSON.parse(response))

  const [headerSection] = request.split("\r\n\r\n");
  if (!headerSection) {
    return { error: "Invalid request format: Missing header section" }
  }

  const [requestLine, ...headerLine] = headerSection.split("\r\n");
  if (!requestLine) {
    return { error: "Invalid request format: Missing request line" }
  }

  // parse request line
  const [method, path, version] = requestLine.split(" ");

  if (!method || !path || !version) {
    return { error: "Invalid request format: Incomplete request line" }
  }

  const [url, queryString] = path.split("?", 2);
  const queryParams = new URLSearchParams(queryString);
  //  generate cache key
  const cacheKey = `${method}:${url}?${queryParams}:${JSON.stringify(headerLine)}`;
  if (method === "GET") {
    const cachedResponse = cache.getCached(cacheKey);
    if (cachedResponse) {
      return cachedResponse;
    }
  }

  // parse headers and cookie
  const headers = {};
  const Cookies = {};
  for (const line of headerLine) {
    const [key, value] = line.split(": ");
    headers[key.toLowerCase()] = value;
    if (key.toLowerCase() === "cookie") {
      value.split(";").forEach((cookie) => {
        const [Cookiekey, Cookievalue] = cookie.trim().split("=");
        Cookies[Cookiekey] = decodeURIComponent(Cookievalue);
      });
    }
  }

  let params;
  const res = {
    method,
    path,
    version,
    headers,
    query: queryParams,
    cookies: Cookies,
    params,
  };
  if (method === "GET") {
    cache.setCache(cacheKey, res);
  }
  return res;
}

function parseRequestBody(bodyBuffer, headers = {}) {
  const body = bodyBuffer.toString();
  let parsedBody;
  let files = {};
  const contentType = headers["content-type"];
  if (body) {
    if (contentType?.startsWith("application/json")) {
      try {
        parsedBody = JSON.parse(body);
      } catch (error) {
        return { error: "Invalid JSON format" };
      }
    } else if (contentType?.startsWith("application/x-www-form-urlencoded")) {
      parsedBody = Object.fromEntries(new URLSearchParams(body));
    } else if (contentType?.startsWith("multipart/form-data")) {
      const boundary = contentType.split("boundary=")[1];
      const { fields, files: parsedFiles } = parseMultipartFormData(bodyBuffer, boundary);
      // console.log(`this is fields`, fields);
      // console.log(files);
      parsedBody = fields;
      files = parsedFiles;
    } else {
      parsedBody = body;
    }
  }
  return {
    body : parsedBody || [],
    files,
  };
}

module.exports = {
  parseRequestBody,
  parseRequestHeader
}