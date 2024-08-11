
export const errhandler = () => {
    let errRes = "";
    errRes += "HTTP/1.1 400 OK \r\n"
    errRes += "Content-Type: text/plain\r\n\r\n"
    errRes += "Internal server error"
    return errRes;
}