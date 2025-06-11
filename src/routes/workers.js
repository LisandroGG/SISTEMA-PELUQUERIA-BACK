import { Router } from "express";
import {
	createWorker,
	deleteWorker,
	editWorker,
	getWorkers,
	getWorkersByService,
} from "../controllers/workersControllers.js";
import { isAdmin } from "../middlewares/authAdmin.js";
import { authUser } from "../middlewares/authUser.js";

export const workersRouter = Router();

workersRouter.get("/", authUser, isAdmin, getWorkers);
workersRouter.get("/:serviceId", getWorkersByService);

workersRouter.post("/create", authUser, isAdmin, createWorker);

workersRouter.put("/edit/:id", authUser, isAdmin, editWorker);

workersRouter.delete("/delete/:id", authUser, isAdmin, deleteWorker);
