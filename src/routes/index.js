import { Router } from "express";
import { usersRouter } from "./users.js";
import { workersRouter } from "./workers.js";

export const mainRouter = Router();

mainRouter.use("/users", usersRouter);
mainRouter.use("/workers", workersRouter);
