import { Router } from "express";
import { getWhatsappStatus } from "../controllers/whatsappControllers.js";
import { isAdmin } from "../middlewares/authAdmin.js";
import { authUser } from "../middlewares/authUser.js";

export const whatsappRouter = Router();

whatsappRouter.get("/status", getWhatsappStatus)