import { handleRequest } from "./requestHandler.js";
import ErrorHandler from "./errResponse.js";
import { Buffer } from "buffer";
import {Cache} from "./cache.js";
import { parseMultipartFormData } from "./multipartFormDataParser.js";


const MAX_BUFFER_SIZE = 10 * 1024 * 1024;
const cache = new Cache();

export function createConnectionHandler(maya, isBodyParse) {
  return async function handleConnection(socket) {
    let buffer = Buffer.alloc(0);
    let bodyBuffer = Buffer.alloc(0);
    let parsedHeader;
    let isHeaderParsed = false;

    socket.on("data", async (chunk) => {
      buffer = Buffer.concat([buffer, chunk]);

      if (buffer.length > MAX_BUFFER_SIZE){
        return ErrorHandler.requestSize_to_large();
      }

      if (!isHeaderParsed) {
        const headerEndIndex = buffer.indexOf("\r\n\r\n");
        if (headerEndIndex !== -1) {
          const headerPart = buffer.slice(0, headerEndIndex + 4);
          parsedHeader = parseRequestHeader(headerPart);
          if (parsedHeader.error) {
            return parsedRequestError(socket, parsedHeader.error);
          }

          isHeaderParsed = true;
          const contentLength = parseInt(
            parsedHeader?.headers["content-length"] || 0,
            10
          );

          // remove header portion from buffer
          buffer = buffer.slice(headerEndIndex + 4);
          if (parsedHeader.method === "GET" || !isBodyParse) {
            // call the reqHandler because we dont need to parse body
            handleRequest(parsedHeader, maya)
              .then((responseData) => {
                socket.write(
                  responseData || ErrorHandler.internalServerError()
                );
                socket.end();
              })
              .catch((err) => {
                socket.write(ErrorHandler.internalServerError());
                socket.end();
              });
            return;
          }
        }
      }

      if (isHeaderParsed && isBodyParse) {
        // now we parse body
        bodyBuffer = Buffer.concat([bodyBuffer, buffer]);
        // clear the buffer which holds header
        buffer = Buffer.alloc(0);
        if (bodyBuffer.length > 0) {
          const parsedBody = await parseRequestBody(
            bodyBuffer,
            parsedHeader?.headers
          );

          if (parsedBody?.error) {
            return parsedRequestError(socket, parsedBody.error);
          }
          const finalResult = {
            ...parsedHeader,
            body: parsedBody,
          };
          handleRequest(finalResult, maya)
            .then((responseData) => {
              socket.write(responseData || ErrorHandler.internalServerError());
              socket.end();
            })
            .catch((err) => {
              socket.write(ErrorHandler.internalServerError());
              socket.end();
            });
        }
      }
    });

    socket.on("error", (e) => {
      console.log("error on socket: ", e);
    });
  };
}

function parseRequestHeader(requestBuffer) {
  const request = requestBuffer.toString();
  const [headerSection] = request.split("\r\n\r\n");
  if (!headerSection) {
    return error({ error: "Invalid request format: Missing header section" });
  }

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

  let user, params;
  const res = {
    method,
    path,
    version,
    headers,
    query: queryParams,
    cookies: Cookies,
    params,
    user,
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

  return {
    ...parsedBody,
    files,
  };
}

function parseRequestWithoutBody(data) {
  const requestLine = data.toString().split("\r\n")[0];
  const [method, path] = requestLine.split(" ");
  return {
    method,
    path,
    headers: {},
  };
}

function parsedRequestError(socket, error) {
  console.error("Request parsing error:", error);
  socket.write(ErrorHandler.badRequest(error));
  socket.end();
}
