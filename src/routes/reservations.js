import { Router } from "express";

import {
	cancelReservation,
	createReservation,
	finishReservation,
	getReservations,
	getReservationsByGmail,
} from "../controllers/reservationsControllers.js";
import { isAdmin } from "../middlewares/authAdmin.js";
import { authUser } from "../middlewares/authUser.js";

export const reservationsRouter = Router();

reservationsRouter.get("/", authUser, isAdmin, getReservations);
reservationsRouter.get("/by-gmail", getReservationsByGmail);
reservationsRouter.post("/create", createReservation);
reservationsRouter.put(
	"/:reservationId/finish",
	authUser,
	isAdmin,
	finishReservation,
);
reservationsRouter.put("/cancel", cancelReservation);
