import express from "express";

const router = express.Router();

import authController from "./auth.controller.js";

import e from "express";

router.post("/register", authController.register);

router.post("/login", authController.login);


export default router; // Instead of module.exports = router;