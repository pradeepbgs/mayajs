
function handleRequest(request) {
    const [method,path] = parseRequest(request);

    if (!method || !path) {
        return null; // or return a 400 Bad Request response
      }
    if (method == "GET" && path == '/') {
        const data = {
            message: 'Hello, World!'
        }
        return jsonResponse(data,200)
    }
}


function parseRequest(requestBuffer){
    const req = requestBuffer.toString()
    const requestLine = req.split("\r\n")[0];
    const [method, path] = requestLine.split(" ");
    return [method,path]
}

function jsonResponse(data, statusCode = 200,statusMessage='OK') {
    let response = ""
    response += `HTTP/1.1 ${statusCode} ${statusMessage} \r\n`
    response += "Content-Type: application/json\r\n"
    response += '\r\n'
    response += JSON.stringify(data)
    return response;
}

export default handleRequest