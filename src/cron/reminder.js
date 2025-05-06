import cron from "node-cron";
import { format } from "date-fns";
import { Reservation } from "../models/reservations.js";
import { Worker } from "../models/workers.js";
import { Service } from "../models/services.js";
import { sendGmailReminder } from "../config/mailer.js";
import { Op } from "sequelize";

cron.schedule("* * * * *", async () => {
	try {
		const now = new Date();
		const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

		const reservations = await Reservation.findAll({
			where: {
				status: "confirm",
				reminderSent: false,
				date: format(oneHourLater, "yyyy-MM-dd"),
				startTime: {
					[Op.between]: [
						format(now, "HH:mm:ss"),
						format(oneHourLater, "HH:mm:ss"),
					],
				},
			},
			include: [
				{ model: Service, as: "service" },
				{ model: Worker, as: "worker" },
			],
		});

		for (const res of reservations) {
			await sendGmailReminder({
				to: res.clientGmail,
				name: res.clientName,
				service: res.service.name,
				time: res.startTime,
				date: res.date,
				worker: res.worker.name,
			});

            await res.update({ reminderSent: true });
			console.log(
				`🔔 Enviado recordatorio a ${res.clientGmail} para ${res.date} ${res.startTime}`
			);
		}
	} catch (error) {
		console.error("❌ Error en el cron de recordatorios:", error.message);
	}
});