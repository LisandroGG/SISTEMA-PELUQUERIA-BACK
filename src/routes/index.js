import { Router } from "express";
import { disableDayRouter } from "./disableDays.js";
import { reservationsRouter } from "./reservations.js";
import { servicesRouter } from "./services.js";
import { usersRouter } from "./users.js";
import { workersRouter } from "./workers.js";
import { workersHoursRouter } from "./workersHours.js";

export const mainRouter = Router();

mainRouter.use("/users", usersRouter);
mainRouter.use("/workers", workersRouter);
mainRouter.use("/services", servicesRouter);
mainRouter.use("/hours", workersHoursRouter);
mainRouter.use("/disableDay", disableDayRouter);
mainRouter.use("/reservations", reservationsRouter);
