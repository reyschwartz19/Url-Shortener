import prisma from "../config/prisma";
import bcrypt from "bcrypt";
import { ConflictError, UnauthorizedError, ValidationError } from "../errors/AppError";
import { RegisterInput, LoginInput } from "../types/auth.types";
import { revokeRefreshToken, rotateRefreshToken, saveRefreshToken, signAccessToken } from "./token.service";


const SALT_ROUNDS = 10;

export const registerUser = async (input: RegisterInput) => {
    const { email, password } = input;

    if (!email || !password) {
        throw new ValidationError("Email and password are required");
    }

    const existingUser = await prisma.user.findUnique({
        where: { email },
    });

    if (existingUser) {
        throw new ConflictError("Email already in use");

    }
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const newUser = await prisma.user.create({
        data: {
            email,
            hashedPassword: hashedPassword,
        }
    });
    return {
        id: newUser.userId,
        email: newUser.email,
    }
}

export const loginUser = async (input: LoginInput) => {
    const { email, password } = input;

    const user = await prisma.user.findUnique({
        where: {email: input.email}
    })

    if (!user){
        throw new UnauthorizedError("Invalid credentials");
    }
    const passwordMatch = await bcrypt.compare(password, user.hashedPassword)
    if (!passwordMatch){
        throw new UnauthorizedError("Invalid credentials");
    }
    
    const accessToken = signAccessToken(user.userId)
    const refreshToken = signAccessToken(user.userId)
    await saveRefreshToken(user.userId, refreshToken)

    return {
        accessToken,
        refreshToken
    }
}

export const logoutUser = async (UserId: string, refreshToken: string) => {
   await revokeRefreshToken(UserId, refreshToken);
}

