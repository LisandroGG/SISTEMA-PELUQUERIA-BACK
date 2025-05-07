import { Router } from "express";
import {
	createDisableDay,
	deleteDisableDay,
	getDisabledDaysByWorker,
} from "../controllers/disableDaysControllers.js";
import { isAdmin } from "../middlewares/authAdmin.js";
import { authUser } from "../middlewares/authUser.js";

export const disableDayRouter = Router();

disableDayRouter.get("/", getDisabledDaysByWorker);
disableDayRouter.post("/create", authUser, isAdmin, createDisableDay);
disableDayRouter.delete("/delete/:id", authUser, isAdmin, deleteDisableDay);
