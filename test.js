import Maya from "./src/server.js";
import { hello } from "./hello.js";

const maya = new Maya();
const port = 3000;


maya.use(hello);

maya.bodyParse()


maya.post("/", async (request, res) => {
  const data = {
    body: request.body,
  };
  return res.json(data);
});
maya.get("/async-test", async (request, res) => {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return res.json({ message: "Async operation completed" });
});

maya.get("/error-test", async (request, res) => {
  return res.send("Hello");
});

maya.get("/rediret", (req, res) => {
  return res.redirect("/");
});

maya.get('/hello/:id',(rek,res)=>{
  const id  = rek.query.id;
  return res.json({msg:"hello",id})
})

maya.get("/", (req, res) => {
  // const number = Math.random()
  return res.json({ msg: "hii"});
});

maya.listen(port, () => {
  console.log(`hey my Mayajs server is running..!! on port: ${port}`);
});
