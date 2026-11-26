const WINDOW_MS = 15 * 60 * 1000;
const MAX_REQUESTS = 5;
const requestsByAddress = new Map();

module.exports = (req, res, next) => {
  const now = Date.now();
  const address = req.ip || req.socket.remoteAddress || "unknown";
  let entry = requestsByAddress.get(address);

  if (!entry || entry.expiresAt <= now) {
    entry = { count: 0, expiresAt: now + WINDOW_MS };
    requestsByAddress.set(address, entry);
  }
  if (entry.count >= MAX_REQUESTS) {
    return res.status(429).send({
      success: false,
      message: "Too many reset requests. Please try again later.",
    });
  }

  entry.count += 1;
  return next();
};
