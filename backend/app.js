import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import prisma from "./config/prisma.js";


const app = express();

app.get("/test-db", async (req, res) => {
  const users = await prisma.user.findMany();

  res.json(users);
});

app.use(cors());
app.use(express.json());
app.use(cookieParser());

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