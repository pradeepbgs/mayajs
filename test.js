import Maya from "./src/server.js";

const app = new Maya();

app.post("/", async (request, res) => {
  const data = {
    body: request.body,
    query: request?.query,
  };
  return res.jsonResponse(data, 200, "OK");
});
app.get("/async-test", async (request, res) => {
  // Simulate a delay (e.g., database query)
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return res.jsonResponse({ message: "Async operation completed" });
});

app.get("/error-test", async (request) => {
  return;
});

app.get("/", (req, res) => {
  return res.redirect("/async-test");
  // return res.send("Hello world!!, how is this ???");
});

app.listen(3000);
