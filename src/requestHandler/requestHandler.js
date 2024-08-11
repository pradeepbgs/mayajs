import {jsonResponse} from '../responseHandler/reshandler.js'
import {parseRequest} from '../parser/requestParser.js'
import { helloWorld } from '../controller/helloController.js';

export function handleRequest(request) {
    const {method,path,body,headers} = parseRequest(request);

    if (!method || !path) {
        return null; // or return a 400 Bad Request response
      }

    if (method == "GET" && path == '/') {
        // needs to impprove
    }
}