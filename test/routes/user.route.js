
export const userRoutes =  (maya,path) => {
    maya.get(`${path}/register`).handler((req,res) => {
        return res.json({msg:"hii"})
    })

    maya.get(`${path}/login`).handler((req,res) => {
        return res.json({msg:"hii"})
    })
}