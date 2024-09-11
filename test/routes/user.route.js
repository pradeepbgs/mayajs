import Router from '../../src/router.js'

const maya = new Router()
// export const userRoutes =  (maya,path) => {
    maya.get(`/register`).handler((req,res) => {
        return res.json({msg:"hii im register route"})
    })

    maya.get(`/login`).handler((req,res) => {
        return res.json({msg:"hii im login route"})
    })

// }

export default maya;