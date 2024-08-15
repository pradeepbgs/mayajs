import Cache from "./cache.js";

export function parseRequest(requestBuffer) {
  const cache = new Cache();
  // console.log(requestBuffer)
  const req = requestBuffer.toString();
  // console.log(requestBuffer)

  // Split headers and body
  const [headerSection, body] = req.split("\r\n\r\n", 2);

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
  const cacheKey = `${method}:${url}?${queryString}:${JSON.stringify(headerLine)}`;

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
  const contentType = headers["content-type"];
  if (body) {
    if (contentType === "application/json") {
      try {
        parsedBody = JSON.parse(body);
      } catch (error) {
        return { error: "Invalid JSON format" };
      }
    } else if (contentType === "application/x-www-form-urlencoded") {
      parsedBody = Object.fromEntries(new URLSearchParams(body));
    } else {
      parsedBody = body;
    }
  }

  const queryParamsObject = {};
  for (const [key, value] of queryParams.entries()) {
    queryParamsObject[key] = value;
  }

  const res = {
    method,
    path: decodeURIComponent(path),
    version,
    headers,
    body: parsedBody,
    query: queryParams,
    Cookies,
  };

  if (method === "GET") {
    cache.setCache(cacheKey, res);
  }
  return res;
}
