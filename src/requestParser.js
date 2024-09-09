import { parseMultipartFormData } from "./multipartFormDataParser.js";

export function parseRequest(requestBuffer, cache) {
  // console.log(requestBuffer.toString());
  const req = requestBuffer.toString();
  // Split headers and body
  const [headerSection, body] = req.split("\r\n\r\n");

  if (!headerSection) {
    return error({ error: "Invalid request format: Missing header section" });
  }

  // spit headers into two line
  const [requestLine, ...headerLine] = headerSection.split("\r\n");
  if (!requestLine) {
    return error({ error: "Invalid request format: Missing request line" });
  }
  // parse request line
  const [method, path, version] = requestLine.split(" ");
  
  if (!method || !path || !version) {
    return error({ error: "Invalid request format: Incomplete request line" });
  }

  const [url, queryString] = path.split("?", 2);
  const queryParams = new URLSearchParams(queryString);
  //  generate cache key
  const cacheKey = `${method}:${url}?${queryParams}:${JSON.stringify(
    headerLine
  )}`;

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

  let parsedBody;
  let files = {};
  const contentType = headers["content-type"];
  if (body) {
    if (contentType.startsWith("application/json")) {
      try {
        parsedBody = JSON.parse(body);
      } catch (error) {
        return { error: "Invalid JSON format" };
      }
    } else if (contentType.startsWith("application/x-www-form-urlencoded")) {
      parsedBody = Object.fromEntries(new URLSearchParams(body));
    } else if (contentType.startsWith("multipart/form-data")) {
      const boundary = contentType.split("boundary=")[1];
      const { fields, files: parsedFiles } = parseMultipartFormData(
        req,
        boundary
      );
      parsedBody = fields;
      files = parsedFiles;
    } else {
      parsedBody = body;
    }
  }
  let user;
  let params
  const query = {...queryParams}
  const res = {
    method,
    path: path,
    version,
    headers,  
    body: parsedBody,
    query,
    params,
    cookies:Cookies,
    user,
    files,
  };
  if (method === "GET") {
    cache.setCache(cacheKey, res);
  }
  return res;
}
