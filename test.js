import Maya from "./src/server.js";
import { hello } from "./hello.js";

const maya = new Maya();
const port = 3000;

// maya.bodyParse;
//
// maya.use(hello);

maya.post("/", async (request, res) => {
  const data = {
    body: request.body,
  };
  return res.jsonResponse(data);
});
maya.get("/async-test", async (request, res) => {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return res.jsonResponse({ message: "Async operation completed" });
});

maya.get("/error-test", async (request, res) => {
  return res.send("Hello");
});

maya.get("/rediret", (req, res) => {
  return res.redirect("/");
});

maya.get("/", (req, res) => {
  return res.jsonResponse({ msg: "hii" });
});

maya.listen(port, () => {
  console.log(`hey my Mayajs server is running..!! on port: ${port}`);
});
