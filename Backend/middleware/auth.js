export default (req, res, next) => {
  if (!req.headers.authorization) {
    return res.status(401).json({ msg: "Unauthorized" });
  }
  next();
};
