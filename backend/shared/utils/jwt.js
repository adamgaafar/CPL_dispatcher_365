import jwt from "jsonwebtoken";
import { de } from "zod/locales";

// Add 'export' directly to the function definitions
export const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: "15m" }
  );
};

export const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" }
  );
};


export default {
  generateAccessToken,
  generateRefreshToken,
};