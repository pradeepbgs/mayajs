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

import Maya from "mayajs";
import { hello } from "./hello.js";

const maya = new Maya();
const port = 3000;

// Middleware example
maya.use(hello);

// Enable request body parsing
maya.bodyParse();

// Define routes
maya.get("/").handler((req, res) => {
  return res.json({ msg: "Hello, world!" });
});



maya.get("/async-test").handler(async (req, res) => {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return res.json({ message: "Async operation completed" });
});

maya.get("/error-test").handler((req, res) => {
  return res.send("Hello, error handler!");
});

maya.get("/redirect").handler((req, res) => {
  return res.redirect("/");
});

maya.get("/hello/:id").handler((req, res) => {
  const id = req.params.id;
  return res.json({ msg: "Hello", id });
});

// Start the server
maya.listen(port, () => {
  console.log(`MayaJS server is running on port ${port}`);
});


