import { Router } from "express";
import {
	createCustomWorkingHour,
	createWorkingHour,
	deleteCustomWorkingHour,
	deleteWorkingHour,
	editCustomWorkingHour,
	editWorkingHour,
	getCustomWorkingHours,
	getHoursByDate,
	getWorkingHours,
} from "../controllers/workersHoursControllers.js";
import { isAdmin } from "../middlewares/authAdmin.js";
import { authUser } from "../middlewares/authUser.js";

export const workersHoursRouter = Router();

workersHoursRouter.get("/by-date", getHoursByDate); //?workerId=1&date=2025-05-10

workersHoursRouter.get("/working", getWorkingHours);
workersHoursRouter.post("/working", authUser, isAdmin, createWorkingHour);
workersHoursRouter.put("/working/:id", authUser, isAdmin, editWorkingHour);
workersHoursRouter.delete("/working/:id", authUser, isAdmin, deleteWorkingHour);

workersHoursRouter.get("/custom", getCustomWorkingHours);
workersHoursRouter.post("/custom", authUser, isAdmin, createCustomWorkingHour);
workersHoursRouter.put("/custom/:id", authUser, isAdmin, editCustomWorkingHour);
workersHoursRouter.delete(
	"/custom/:id",
	authUser,
	isAdmin,
	deleteCustomWorkingHour,
);
