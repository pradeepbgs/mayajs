export  function parseRequest(requestBuffer){
    const req = requestBuffer.toString()
    
    // Split headers and body
    const [headerSection,body] = req.split('\r\n\r\n');

    // spit headers into two line
    const [requestLine, ...headerLine] = headerSection.split('\r\n');

    // parse request line
    const [method,path,version] = requestLine.split(' ')

  const [url, queryString] = path.split('?');
  const queryParams = new URLSearchParams(queryString);

    // parse headers
    const headers = {};
    for (const line of headerLine) {
      const [key, value] = line.split(': ');
      headers[key.toLowerCase()] = value;
    }

    let parsedBody;
  try {
    if (headers['content-type'] === 'application/json') {
      parsedBody = JSON.parse(body);
    } else {
      parsedBody = body; // Or handle other content types as needed
    }
  } catch (error) {
    parsedBody = body;
  }

  const queryParamsObject = {};
  for (const [key, value] of queryParams.entries()) {
    queryParamsObject[key] = value;
  }
    // 
    return {method,path,version,headers,body:parsedBody,query:queryParams}
}

