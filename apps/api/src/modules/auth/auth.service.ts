import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../db/prisma.js';
import { env } from '../../config/env.js';
import { ApiError } from '../../utils/apiError.js';
import { RegisterInput, LoginInput } from './auth.schema.js';

export async function registerUser(input: RegisterInput) {
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (existingUser) {
    throw ApiError.conflict('User with this email already exists', 'USER_EXISTS');
  }

  const passwordHash = await bcrypt.hash(input.password, 10);

  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      role: input.role,
      assignedLocationId: input.assignedLocationId || null,
    },
    include: {
      assignedLocation: true,
    },
  });

  const accessToken = generateAccessToken({
    id: user.id,
    email: user.email,
    role: user.role,
    assignedLocationId: user.assignedLocationId,
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      assignedLocation: user.assignedLocation,
    },
    accessToken,
  };
}

export async function loginUser(input: LoginInput) {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    include: {
      assignedLocation: true,
    },
  });

  if (!user) {
    throw ApiError.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');
  }

  const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);

  if (!isPasswordValid) {
    throw ApiError.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');
  }

  const accessToken = generateAccessToken({
    id: user.id,
    email: user.email,
    role: user.role,
    assignedLocationId: user.assignedLocationId,
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      assignedLocation: user.assignedLocation,
    },
    accessToken,
  };
}

function generateAccessToken(payload: { id: string; email: string; role: string; assignedLocationId: string | null }) {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '8h' });
}
