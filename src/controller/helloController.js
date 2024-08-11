import { jsonResponse } from "../responseHandler/reshandler.js"

const helloWorld  = () => {
    const data = {
        message: "custom controller"
    }
    return jsonResponse(data,200)
}


export {
    helloWorld
}