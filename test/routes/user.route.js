import Router from '../../src/router.js'

const router = new Router()

    router.get(`/register`).handler((req,res) => {
        return res.json({msg:"hii im register route"})
    })

    router.get(`/login`).handler((req,res) => {
        return res.json({msg:"hii im login route"})
    })


export default router;