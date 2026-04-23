import { Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import { loginUser, registerUser, logoutUser } from "../services/userAuth.services";
import { registerSchema } from "../config/inputValidator";
import { UnauthorizedError } from "../errors/AppError";
import { rotateRefreshToken } from "../services/tokenService";

export const registerController = catchAsync(async (req: Request, res: Response) => {
    const input = registerSchema.parse(req.body);
    const user = await registerUser(input);
    res.status(201).json(user);
});

export const loginController = catchAsync(async (req: Request, res: Response) => {
    const { accessToken, refreshToken } = await loginUser(req.body);
    res.cookie("refreshToken", refreshToken, {
    httpOnly: true,   // JS cannot access this
    secure: true,     // HTTPS only
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  });

  res.json({ accessToken }); // only access token in body
});

export const logoutController = catchAsync(async (req: Request, res: Response) => {
    const  refreshToken  = req.cookies.refreshToken;
    if (!req.user) {
    throw new UnauthorizedError("Unauthorized");
}


    const userId = req.user.userId;
    await logoutUser(userId, refreshToken);
    res.clearCookie("refreshToken")
    res.json({ message: "Logged out successfully" });
});


export const refreshController = catchAsync(async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken; 

  if (!refreshToken) throw new UnauthorizedError("No refresh token");

  const { accessToken, refreshToken: newRefreshToken } = await rotateRefreshToken(refreshToken);

  res.cookie("refreshToken", newRefreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({ accessToken });
});