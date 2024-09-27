const handleRequest = require("./requestHandler.js");
const ErrorHandler = require("./errResponse.js");
const { Buffer } = require("buffer");
const Cache = require("./cache.js");
const {parseRequestBody,parseRequestHeader} = require("./requestParser.js");
const ResponseHandler = require("./responseHandler.js");
// const { cc } = require("bun:ffi");
// const { join } = require("path");

// const pathToCFile = join(__dirname, "headerParser.c");

const cache = new Cache();

// module.exports = {
//   symbols: { parse_headers },
// } = cc({
//   source: pathToCFile,
//   symbols: {
//     parse_headers: {
//       returns: "cstring",
//       args: ["cstring"],
//     },
//   },
// });

module.exports = async function handleConnection(socket, maya) {
  let buffer = Buffer.alloc(0);
  let bodyBuffer = Buffer.alloc(0);
  let parsedHeader;
  let isHeaderParsed = false;
  const responseHandler = new ResponseHandler(socket)
  socket.on("data", async (chunk) => {
    // const startTime = Date.now();

    buffer = Buffer.concat([buffer, chunk]);

    // we did setImmediate so if it takes times so it doesnt block the main thread
    // setImmediate(async()=>{
    if (!isHeaderParsed) {
      const headerEndIndex = buffer.indexOf("\r\n\r\n");
      if (headerEndIndex !== -1) {

        const headerPart = buffer.slice(0, headerEndIndex + 4);
        parsedHeader = parseRequestHeader(headerPart,cache);

        if (parsedHeader.error) {
          return parsedRequestError(socket, parsedHeader.error);
        }

        isHeaderParsed = true;
        // const contentLength = parseInt(
        //   parsedHeader?.headers["content-length"] || 0,
        //   10
        // );

        // remove header portion from buffer
        buffer = buffer.slice(headerEndIndex + 4);
        if (parsedHeader.method === "GET") {
          // call the reqHandler because we dont need to parse body
          handleRequest(socket, parsedHeader, maya,responseHandler);
          return;
        }
      }
    }

    if (isHeaderParsed) {
      // now we parse body
      bodyBuffer = Buffer.concat([bodyBuffer, buffer]);
      // clear the buffer which holds header
      buffer = Buffer.alloc(0);
      if (bodyBuffer.length > 0) {
        const parsedBody = await parseRequestBody(bodyBuffer, parsedHeader?.headers);
        if (parsedBody?.error) {
          return parsedRequestError(socket, parsedBody.error);
        }
        const finalResult = {
          ...parsedHeader,
          ...parsedBody
        };
        handleRequest(socket, finalResult, maya,responseHandler);
      }
    }
  // });
  });

  socket.on('close', () => {
    // console.log('Socket has been closed.');
    socket.end()
  });

  socket.on("error", (e) => {
    console.log("error on socket: ", e);
    socket.end()
  });
};

function parsedRequestError(socket, error) {
  console.error("Request parsing error:", error);
  socket.write(ErrorHandler.badRequest(error));
  socket.end();
}
