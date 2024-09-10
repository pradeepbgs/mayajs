import Maya from "../src/server.js";
import { register } from "./controller/user.controller.js";
import { hello, sm, user1, user2 } from "./hello.js";
import { userRoutes } from "./routes/user.route.js";

const maya = new Maya();
const port = 3000;

// this means our server will now parse the incoming req body
maya.bodyParse();

maya.cors({
  origin: ['http://localhost:8000','*'],
  methods: 'GET,POST,PUT,DELETE',
  headers: 'Content-Type,Authorization'
})
// if u want to use https then use this and pass the path of your key and cert file
// maya.useHttps({
//   keyPath: 'path/to/key.pem',
//   certPath: 'patha/to/cert.pem'
// })
// this is a middleware example
// maya.use(sm);
// maya.use(hello);
// maya.use("/api/v1/user/register", register);
// maya.use("/user", user2);



// maya
//   .get("/get")
//   .isImportant()
//   .handler((req, res) => {
//     return res.json({ msg: "Hello ji kaise ho sare" });
//   });
// maya.get("/").handler((req, res) => {
//   const k = req.query;
//   return res.json({ msg: "Hello", name: k.name, age: k.age });
// });

// maya.get("/user").handler((req, res) => {
//   return res.json({ msg: "hello" });
// });

// maya.post("/test").handler((req, res) => {
//   const body = req.body;
//   return res.json({ body});
// });

// maya
//   .get("/important-route")
//   .isImportant()
//   .handler((req, res) => {
//     return res.json({
//       msg: "isIsmportant() means this route will will be used frequently so making it important will tell our library to make it on top of our precompiled route so our lib doesnt have to search more , it will search important route fast",
//     });
//   });

// maya.get("/async-test").handler(async (request, res) => {
//   await new Promise((resolve) => setTimeout(resolve, 1000));
//   return res.json({ message: "Async operation completed" });
// });

// maya
//   .get("/error-test")
//   .isImportant()
//   .handler((req, res) => {
//     return res.send("Hello");
//   });

// maya.get("/rediret").handler((req, res) => {
//   return res.redirect("/");
// });

// maya
//   .get("/hello/:id")
//   .isImportant()
//   .handler((req, res) => {
//     const query = req.query
//     const params = req.params
//     return res.json({ msg: "hello", query ,params});
//   });

// maya.get("/getter/:name").handler((req, res) => {
//   const name = req.query.name;
//   return res.json({ msg: "here is ur name", name });
// });

// maya.get("/set-cookie").handler((req, res) => {
//   // Set a cookie
//   const cookieOptions = {
//     expires: new Date(Date.now() + 86400000), // 1 day
//     httpOnly: true,
//   };
//   res.cookie('myCookie', 'cookieValue', cookieOptions);

//   // Return a response
//   return res.json({ msg: "Cookie has been set" });
// });

userRoutes();


maya.listen(port);

export { maya };