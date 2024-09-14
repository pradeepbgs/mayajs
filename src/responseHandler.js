import path from 'path';
import fs from 'fs'
class ResponseHandler {
  constructor() {
    this.headers={}
  }

  setHeader(key,value){
    this.headers[key] = value;
  }

  _generateResponse(data, statusCode = 200, statusMessage = "OK", contentType = "text/plain") {
    let response = `HTTP/1.1 ${statusCode} ${statusMessage}\r\n`;
    response += `Content-Type: ${contentType}\r\n`;

    if (Object.keys(this.headers).length > 0) {
      for (const [key, value] of Object.entries(this.headers)) {
        response += `${key}: ${value}\r\n`;
      }
    }

    response += "\r\n"; // End of headers
    response += typeof data === "object" ? JSON.stringify(data) : data;
    return response;
  }


  json(data, statusCode = 200, statusMessage = "OK") {
     this._generateResponse(data, statusCode, statusMessage, "application/json");
  }


  send(data, statusCode = 200, statusMessage = "OK") {
     this._generateResponse(data, statusCode, statusMessage);
  }

  render(templatePath, data = {}, statusCode = 200, statusMessage = "OK", contentType = "text/html") {
    const extname = path.extname(templatePath);
    // Handle EJS templates
    if (extname === '.ejs') {
      return ejs.renderFile(templatePath, data)
        .then(renderedHtml => this._generateResponse(renderedHtml, statusCode, statusMessage, contentType))
        .catch(error => {
          console.error('Error rendering EJS template:', error);
          return this._generateResponse(err, 500, 'Internal Server Error');
        });
    }
    // Handle static HTML files
    else if (extname === '.html') {
      return new Promise((resolve, reject) => {
        fs.readFile(templatePath, 'utf8', (err, content) => {
          if (err) {
            console.error('Error reading HTML file:', err);
            resolve(this._generateResponse(err, 500, 'Internal Server Error'));
          } else {
            resolve(this._generateResponse(content, statusCode, statusMessage, contentType));
          }
        });
      });
    }
    // Handle unsupported file types
    else {
      return this._generateResponse('Unsupported file type', 415, 'Unsupported Media Type');
    }
  }

  
  redirect(url, statusCode = 302) {
    return this._generateResponse("", statusCode, "Found", "text/plain", { Location: url });
  }

  cookie(name,value,options={}){
    let cookie = `${name}=${value}`
    if (options.expires) {
      cookie += ` Expires=${options.expires.toUTCString()};`;
    }

    if (options.maxAge) {
      cookie += ` Max-Age=${options.maxAge};`;
    }

    if (options.domain) {
      cookie += ` Domain=${options.domain};`;
    }

    if (options.path) {
      cookie += ` Path=${options.path};`;
    }

    if (options.secure) {
      cookie += ` Secure;`;
    }

    if (options.httpOnly) {
      cookie += ` HttpOnly;`;
    }
    this.headers["Set-Cookie"] = cookie;
  }
}

export default new ResponseHandler();
