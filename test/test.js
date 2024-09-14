import Maya from "../src/server.js";
import { hello, sm, user2 } from "./hello.js";
import userRoutes from "./routes/user.route.js";


const maya = new Maya();
const port = 3000;

// this means our server will now parse the incoming req body
maya.bodyParse();
maya.serveStatic('static')
// maya.cors({
//   origin: ['http://localhost:8000','*'],
//   methods: 'GET,POST,PUT,DELETE',
//   headers: 'Content-Type,Authorization'
// })
// if u want to use https then use this and pass the path of your key and cert file
// maya.useHttps({
//   keyPath: 'path/to/key.pem',
//   certPath: 'patha/to/cert.pem'
// })
// this is a middleware example
// maya.use(hello);
// maya.use(sm);
// maya.use('/user',sm)
// maya.use('/user',hello)
// maya.use("/post",user2)
// // maya.use("/api/v1/user/register", register);
// maya.use("/user", user2);



// maya
//   .get("/get")
//   .isImportant()
//   .handler((req, res) => {
//     return res.json({ msg: "Hello ji kaise ho sare" });
//   });
maya.get("/").isImportant().handler((req, res) => {
  const k = req.query;
  // console.log('hiii');
   return res.json({ msg: "Hello"});
  //  next()
});

maya.get("/user").handler((req, res) => {
  return res.json({ msg: "hello" });
});

maya.get('/render').handler(async(req,res) => {
  return res.render("static/index.html")
})

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
//   const cookieOptions = {
//     expires: new Date(Date.now() + 86400000), // 1 day
//     httpOnly: true,
//   };
//   res.cookie('myCookie', 'cookieValue', cookieOptions);
//   return res.json({ msg: "Cookie has been set" }, 200); // Status 200 to include a JSON body
// });


// maya.get("/post").isImportant().handler((req,res) => {
//   return res.send("hii")
// })

// maya.get("/test").isImportant().handler((req,res) => {
//   return res.send("hii")
// })

maya.register(userRoutes,"/api/user")

;(async() => {
  try {
    await maya.listen(port);
  } catch (error) {
    console.error(error)
  }
})()

export { maya };
