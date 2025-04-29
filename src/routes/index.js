import { Router } from "express";
import { usersRouter } from "./users.js";

export const mainRouter = Router();

mainRouter.use("/users", usersRouter);
