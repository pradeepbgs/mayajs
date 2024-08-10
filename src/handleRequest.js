
function handleRequest(request) {
    const [method,path] = parseRequest(request);

    if (method == "GET" && path == '/') {
        return jsonResponse({message: 'Hello, World!' })
    }
}


function parseRequest(requestBuffer){
    const requestLine = requestBuffer.split("\r\n")[0];
    const [method, path] = requestLine.split(" ");
    return [method,path]
}

function jsonResponse(data, statusCode = 200) {
    const response = `HTTP/1.1 ${statusCode} OK\r\n
    Content-Type: application/json\r\n\r\n
    ${JSON.stringify(data)
    }`;
    return response;
}

export default handleRequest