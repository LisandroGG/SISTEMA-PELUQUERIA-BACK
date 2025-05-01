import { Router } from "express";
import { servicesRouter } from "./services.js";
import { usersRouter } from "./users.js";
import { workersRouter } from "./workers.js";

export const mainRouter = Router();

mainRouter.use("/users", usersRouter);
mainRouter.use("/workers", workersRouter);
mainRouter.use("/services", servicesRouter);
