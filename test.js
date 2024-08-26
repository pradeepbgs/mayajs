import Maya from "./src/server.js";
import { hello, sm, user1, user2 } from "./hello.js";

const maya = new Maya();
const port = 3000;

// this is a middleware example
maya.bodyParse();
maya.use(sm);
maya.use(hello);
maya.use("/user", user1);
maya.use("/user", user2);
// this means our server will now parse the incoming req

maya.get("/").handler((req, res) => {
  return res.json({ msg: "Hello" });
});

maya.get("/user").handler((req, res) => {
  return res.json({ msg: "hello" });
});

maya
  .get("/important-route")
  .isImportant()
  .handler((req, res) => {
    return res.json({
      msg: "isIsmportant() means this route will will be used frequently so making it important will tell our library to make it on top of our precompiled route so our lib doesnt have to search more , it will search important route fast",
    });
  });

maya.get("/async-test").handler(async (request, res) => {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return res.json({ message: "Async operation completed" });
});

maya
  .get("/error-test")
  .isImportant()
  .handler((req, res) => {
    return res.send("Hello");
  });

maya.get("/rediret").handler((req, res) => {
  return res.redirect("/");
});

maya.get("/hello/:id").handler((rek, res) => {
  const id = rek.query.id;
  return res.json({ msg: "hello", id });
});

maya.listen(port, () => {
  console.log(`hey my Mayajs server is running..!! on port: ${port}`);
});
