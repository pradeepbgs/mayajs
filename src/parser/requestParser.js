export  function parseRequest(requestBuffer){
    const req = requestBuffer.toString()
    
    // Split headers and body
    const [headerSection,body] = req.split('\r\n\r\n');

    // spit headers into two line
    const [requestLine, ...headerLine] = headerSection.split('\r\n');

    // parse request line
    const [method,path,version] = requestLine.split(' ')

    // parse headers
    const headers = {};
    for (const line of headerLine) {
      const [key, value] = line.split(': ');
      headers[key.toLowerCase()] = value;
    }

    // 
    return {method,path,version,headers,body}
}

