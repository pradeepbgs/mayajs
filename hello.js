export const hello = async (req, res, next) => {
  // await new Promise((resolve) => setTimeout(resolve, 10));
  // return res.send("sending"); // This will end the request, so no need to call next()
  console.log("mdill");
  next();
};
