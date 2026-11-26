const userSchema = require("../schemas/userModel");

// Push a notification onto a user's unread list
module.exports = async (userId, notification) => {
  if (!userId) return;
  await userSchema.findByIdAndUpdate(userId, {
    $push: { notification: { ...notification, createdAt: new Date() } },
  });
};
