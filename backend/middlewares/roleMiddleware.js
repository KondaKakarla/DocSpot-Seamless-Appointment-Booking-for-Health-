const userSchema = require("../schemas/userModel");

// Usage: requireRole("admin")
module.exports = (role) => async (req, res, next) => {
  try {
    const user = await userSchema.findById(req.userId).select("type isdoctor");
    if (!user) {
      return res.status(401).send({ message: "User not found", success: false });
    }
    const allowed =
      role === "doctor" ? user.isdoctor === true : user.type === role;
    if (!allowed) {
      return res.status(403).send({ message: "Access denied", success: false });
    }
    req.currentUser = user;
    next();
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Something went wrong", success: false });
  }
};
