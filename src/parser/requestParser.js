export function parseRequest(requestBuffer) {
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

  // parse headers and cookie
  const headers = {};
  const Cookies = {};
  for (const line of headerLine) {
    const [key, value] = line.split(": ");
    headers[key.toLowerCase()] = value;
    if (key === "cookie") {
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
      parsedBody = body; // Or handle other content types as needed
    }
  }

  const queryParamsObject = {};
  for (const [key, value] of queryParams.entries()) {
    queryParamsObject[key] = value;
  }

  return {
    method,
    path: decodeURIComponent(path),
    version,
    headers,
    body: parsedBody,
    query: queryParams,
    Cookies,
  };
}
