export function handleRequest(request,route) {
    const {method,path ,body,} = request

    const [routerPath,queryString] = path.split('?')
    const query = queryString ? new URLSearchParams(queryString) : new URLSearchParams();

    // Convert query parameters to an object
    const queryObject = Object.fromEntries(query.entries());
    request.query =queryObject

    const handler = route[method][routerPath]
    console.log(route[method][path])
    if (handler) {
        return handler(request)
    } else {
        return null;
    }
}