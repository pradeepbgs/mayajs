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

  const [url, queryString] = path.split("?");
  const queryParams = new URLSearchParams(queryString);

  // parse headers
  const headers = {};
  for (const line of headerLine) {
    const [key, value] = line.split(": ");
    headers[key.toLowerCase()] = value;
  }

  let parsedBody;
  try {
    if (headers["content-type"] === "application/json") {
      parsedBody = JSON.parse(body);
    } else if (headers["content-type"] === "application/x-www-form-urlencoded") {
      parsedBody = Object.fromEntries(new URLSearchParams(body));
    } else {
      parsedBody = body; // Or handle other content types as needed
    }
  } catch (error) {
    return { error: "Invalid JSON format" };
  }

  const queryParamsObject = {};
  for (const [key, value] of queryParams.entries()) {
    queryParamsObject[key] = value;
  }
  //
  return {
    method,
    path: decodeURIComponent(path),
    version,
    headers,
    body: parsedBody,
    query: queryParams,
  };
}
