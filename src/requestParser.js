const parseMultipartFormData  =  require("./multipartFormDataParser.js");

function parseRequestHeader(requestBuffer,cache) {
  const request = requestBuffer.toString();

  const headerIndex = request.indexOf("\r\n\r\n");
  if (headerIndex === -1) {
    return { error: "Invalid request format: Missing header section" }
  }

  const headerSection = request.substring(0,headerIndex);

  const requestLineEndIndex = headerSection.indexOf('\r\n')
  if (requestLineEndIndex === -1) {
    return { error: "Invalid request format: Missing request line" };
  }

  const requestLine = headerSection.substring(0,requestLineEndIndex)
  const headerLine = headerSection.substring(requestLineEndIndex+2)

  // parse request line
  const [method, path, version] = requestLine.split(" ");

  if (!method || !path || !version) {
    return { error: "Invalid request format: Incomplete request line" }
  }
  // console.log(headerLine);
  // const queryParams = path.includes('?') ? path.split('?')[1] : ''; 
  // const cookies = headers["cookie"] || '';
  // const cacheKey = `${method}:${path.split('?')[0]}?${queryParams}:${cookies}`;

  // if (method === "GET") {
  //   console.log('object');
  //   const cachedResponse = cache.getCached(cacheKey);
  //   if (cachedResponse) return cachedResponse;
  // }

  // parse headers
  const headers = {};
  
  headerLine.split('\r\n').forEach(line =>{
    const separatorIndex = line.indexOf(": ")
    if (separatorIndex === -1) return;

    const key = line.substring(0,separatorIndex).toLowerCase()
    const value = line.substring(separatorIndex+2)

    headers[key] = value;
  })

  const res = {
    method,
    path,
    version,
    headers,
  };
  // if (method === "GET") {
  //   cache.setCache(cacheKey, res);
  // }
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