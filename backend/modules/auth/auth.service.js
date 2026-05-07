import bcrypt from "bcrypt";
import prisma from "../../config/prisma.js";

import {
  generateAccessToken,
  generateRefreshToken,
} from "../../shared/utils/jwt.js";

const register = async (data) => {
  const existingUser = await prisma.user.findUnique({
    where: {
      email: data.email,
    },
  });

  if (existingUser) {
    throw new Error("Email already exists");
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);

  const user = await prisma.user.create({
    data: {
      fullName: data.fullName,
      email: data.email,
      password: hashedPassword,
      role: data.role,
    },
  });

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
    },
  });

  return {
    user,
    accessToken,
    refreshToken,
  };
};

const login = async (data) => {
  const user = await prisma.user.findUnique({
    where: {
      email: data.email,
    },
  });

  if (!user) {
    throw new Error("Invalid credentials");
  }

  const isPasswordCorrect = await bcrypt.compare(
    data.password,
    user.password
  );

  if (!isPasswordCorrect) {
    throw new Error("Invalid credentials");
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
    },
  });

  return {
    user,
    accessToken,
    refreshToken,
  };
};

export default {
  register,
  login,
}; // Instead of module.exports = { register, login };