import { Router } from "express";
import {
	createService,
	deleteService,
	editService,
	getServices,
} from "../controllers/servicesControllers.js";
import { isAdmin } from "../middlewares/authAdmin.js";
import { authUser } from "../middlewares/authUser.js";

export const servicesRouter = Router();

servicesRouter.get("/", getServices);
servicesRouter.post("/create", createService);
servicesRouter.put("/edit/:id", editService);
servicesRouter.delete("/delete/:id", deleteService);
