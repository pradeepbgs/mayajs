export function jsonResponse(data, statusCode = 200,statusMessage='OK') {
    let response = ""
    response += `HTTP/1.1 ${statusCode} ${statusMessage} \r\n`
    response += "Content-Type: application/json\r\n"
    response += '\r\n'
    response += JSON.stringify(data)
    return response;
}