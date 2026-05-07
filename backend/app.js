import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import prisma from "./config/prisma.js";
import authRoutes from "./modules/auth/auth.routes.js";
import "dotenv/config"; // This must be the first or second line

const app = express();
app.use(cors());
app.use(express.json());
app.use(cookieParser());


app.use("/auth", authRoutes);



app.get("/", (req, res) => {
  res.json({
    message: "API Running Successfully",
  });
});


// Now your test route will work
app.get("/test-db", async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default app; // Instead of module.exports = app;