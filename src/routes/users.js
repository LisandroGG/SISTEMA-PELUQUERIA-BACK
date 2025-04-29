import { Router } from "express";
import {
	changePassword,
	forgotPassword,
	getMe,
	loginUser,
	logoutUser,
	refreshAccessToken,
	registerUser,
} from "../controllers/usersControllers.js";

export const usersRouter = Router();

usersRouter.get("/me", getMe);

usersRouter.post("/register", registerUser);
usersRouter.post("/login", loginUser);
usersRouter.post("/logout", logoutUser);
usersRouter.post("/forgotPassword", forgotPassword);
usersRouter.post("/refresh", refreshAccessToken);

usersRouter.put("/changePassword", changePassword);
