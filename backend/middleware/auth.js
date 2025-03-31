import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export const authMiddleware = (req, res, next) => {
  const authHeader = req.header("Authorization");
  console.log("Received Authorization header:", authHeader);
  if (!authHeader)
    return res.status(401).json({ msg: "Access denied, no token provided" });

  const tokenParts = authHeader.split(" ");
  if (tokenParts.length !== 2 || tokenParts[0] !== "Bearer") {
    return res.status(401).json({ msg: "Invalid token format" });
  }
  const token = tokenParts[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (error) {
    return res.status(401).json({ msg: "Invalid token", error: error.message });
  }
};


export const adminMiddleware = (req, res, next) => {
  if (req.user.role !== "Admin") {
    return res.status(403).json({ msg: "Access denied" });
  }
  next();
};
