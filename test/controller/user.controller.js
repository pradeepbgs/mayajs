export const register = async (req,res) => {
    const {username,email,password} = req.body;
    if ([email, username, password].some((field) => field?.trim() === "")) {
        return res.json({ message: "All fields are required" },400);
      }
      // res.json(json data,statuscode(optional=200),
    //   content-type(optional=text/plain),statusMessage(optional=OK))
    return res.json({success:true,msg:"registered user...!"},200)
}