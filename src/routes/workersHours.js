import { Router } from "express";
import {
	createCustomWorkingHour,
	createWorkingHour,
	deleteCustomWorkingHour,
	deleteWorkingHour,
	editCustomWorkingHour,
	editWorkingHour,
	getBlockedDays,
	getCustomWorkingHours,
	getHoursByDate,
	getWorkingHours,
} from "../controllers/workersHoursControllers.js";
import { isAdmin } from "../middlewares/authAdmin.js";
import { authUser } from "../middlewares/authUser.js";

export const workersHoursRouter = Router();

workersHoursRouter.get("/by-date", getHoursByDate); //?workerId=1&date=2025-05-10&serviceId=1
workersHoursRouter.get("/bloquedDays", getBlockedDays);

workersHoursRouter.get("/working", getWorkingHours);
workersHoursRouter.post(
	"/working/create",
	authUser,
	isAdmin,
	createWorkingHour,
);
workersHoursRouter.put("/working/edit/:id", authUser, isAdmin, editWorkingHour);
workersHoursRouter.delete(
	"/working/delete/:id",
	authUser,
	isAdmin,
	deleteWorkingHour,
);

workersHoursRouter.get("/custom", getCustomWorkingHours);
workersHoursRouter.post(
	"/custom/create",
	authUser,
	isAdmin,
	createCustomWorkingHour,
);
workersHoursRouter.put(
	"/custom/edit/:id",
	authUser,
	isAdmin,
	editCustomWorkingHour,
);
workersHoursRouter.delete(
	"/custom/delete/:id",
	authUser,
	isAdmin,
	deleteCustomWorkingHour,
);
