import net from 'net'
import { handleRequest } from './requestHandler/requestHandler.js';


class porny {
  constructor (){
    this.routes = {
      GET: {},
      POST: {},
      PUT: {},
      DELETE: {}
    }
  }

  listen (port = 3000){
    const server = net.createServer((socket) => {
      let buffer = Buffer.alloc(0);
      socket.on('data', (data) => {
        buffer = Buffer.concat([buffer, data]);
        
        if (buffer.includes(Buffer.from('\r\n\r\n'))) {
          const response  = handleRequest(buffer)
          if (response) {
            socket.write(response)
          }
          buffer = Buffer.alloc(0);
          socket.end()
        }
      });
  
  
      socket.on('error',(e)=>{
          console.log("error on socket: ",e);
      })
    });
  
    server.listen(port, 'localhost',() => {
      console.log(`server is running on port ${port}`);
    });
  }
  handleRequest(buffer) {
    const { method, path, body, headers } = parseRequest(buffer);

    if (!method || !path) {
      return 'HTTP/1.1 400 Bad Request\r\n\r\n';
    }

    const routeHandler = this.routes[method]?.[path];
    if (routeHandler) {
      return routeHandler({ method, path, body, headers });
    }

    return 'HTTP/1.1 404 Not Found\r\n\r\n';
  }

  get(path, handler) {
    this.routes.GET[path] = handler;
  }

  post(path, handler) {
    this.routes.POST[path] = handler;
  }

  put(path, handler) {
    this.routes.PUT[path] = handler;
  }

  delete(path, handler) {
    this.routes.DELETE[path] = handler;
  }

  jsonResponse(data, statusCode = 200, statusMessage = 'OK') {
    return jsonResponse(data, statusCode, statusMessage);
  }
}

export default  porny;

