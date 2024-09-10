import Maya from '../src/server.js';
import Router from '../src/router.js';

const maya = new Maya()
const userRouter = new Router()

maya.get('/').handler((req,res) => {
  return res.send("m")
})

userRouter.get('/profile').handler((req, res) => {
  return res.json({msg:"hhh"})
})

userRouter.post('/login', (req, res) => {
  // Handle POST /users/login
});

maya.use('/users', userRouter);


maya.listen(3000)
