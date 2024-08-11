export function handleRequest(request,route) {
    const {method,path } = request
    const handler = route[method][path]
    if (handler) {
        return handler((data) => {return data})
    } else {
        return null;
    }
}