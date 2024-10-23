# MayaJS

**MayaJS** is a simple and lightweight HTTP server library for Node.js, designed to give you control over your API routes and middleware in an intuitive and efficient way. With MayaJS, you can quickly set up a server, define routes, and optimize important routes for faster response times.

## Features

- **Simple API**: Easy-to-use methods for handling HTTP requests.
- **Middleware Support**: Integrate middleware to process requests before they reach your handlers.
- **Async/Await Support**: Handle asynchronous operations effortlessly.
- **Body Parsing**: Enable request body parsing with a single method.

## Installation

Install MayaJS via npm:

```bash
npm install mayajs
```

### Example Code

Here's an example of how to use MayaJS:

```javascript
import Maya from "mayajs";
import { hello } from "./hello.js";

const maya = new Maya();
const port = 3000;

// Middleware example
maya.use(hello);


// Define routes
const { join } = require("path");
const filePath = join(__dirname, "static");

maya.get("/").handler((xl) => {
   return xl.json({ msg: "Hello, world!" },200)
});

// Render a HTML page
maya.get("/render").handler(async (xl) => {
  return await xl.render(filePath, "index.html");
});

maya.get("/async-test").handler(async (xl) => {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return xl.json({ message: "Async operation completed" });
});

maya.get("/error-test").handler((xl) => {
  return xl.send("Hello, error handler!");
});

maya.get("/redirect").handler((xl) => {
  return xl.redirect("/");
});

maya.get("/hello/:id").handler((xl) => {
  const id = xl.req.params.id;
  return xl.json({ msg: "Hello", id });
});


// Start the server
maya.listen(port, () => {
  console.log(`MayaJS server is running on port ${port}`);
});
```