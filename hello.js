export const hello = async (req, res, next) => {
  // await new Promise((resolve) => setTimeout(resolve, 10));
  // return res.send("sending"); // This will end the request, so no need to call next()
  console.log("mdill");
  const auser = {
    id: 1,
    name: "pradeep",
  };
  req.user = auser;
  next();
};

export const sm = async (req, res, next) => {
  console.log("second middle");
  next();
};

export const user1 = (req, res, next) => {
  console.log("user path");
  next();
};

export const user2 = (req, res, next) => {
  console.log("user2");
  return res.send("hello from");
};
