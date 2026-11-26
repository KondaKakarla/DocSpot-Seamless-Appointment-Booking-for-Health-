// Creates a demo admin and demo patient. Run: npm run seed
const bcrypt = require("bcryptjs");
require("dotenv").config();
const mongoose = require("mongoose");
const userSchema = require("./schemas/userModel");

const accounts = [
  { fullName: "Admin", email: "admin@docspot.com", password: "admin123", phone: "9999999999", type: "admin" },
  { fullName: "Demo", email: "user@docspot.com", password: "user123", phone: "8888888888", type: "user" },
];

(async () => {
  await mongoose.connect(process.env.MONGO_DB);
  for (const a of accounts) {
    if (await userSchema.findOne({ email: a.email })) {
      console.log(`exists: ${a.email}`);
      continue;
    }
    await userSchema.create({ ...a, password: await bcrypt.hash(a.password, 10) });
    console.log(`created: ${a.email} / ${a.password}`);
  }
  await mongoose.disconnect();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
