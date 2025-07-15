import { format } from "date-fns";
import cron from "node-cron";
import { Op } from "sequelize";
import { sendGmailReminder } from "../config/mailer.js";
import {
	formatDateToLongSpanish,
	formatTimeToHHMM,
} from "../helpers/format.js";
import { Reservation } from "../models/reservations.js";
import { Service } from "../models/services.js";
import { Worker } from "../models/workers.js";
import { reservationReminder } from "../whatsapp/messageTemplates.js";

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
			const formattedDate = formatDateToLongSpanish(res.date);
			const formattedTime = formatTimeToHHMM(res.startTime);
			await sendGmailReminder({
				to: res.clientGmail,
				name: res.clientName,
				service: res.service.name,
				time: formattedTime,
				date: formattedDate,
				worker: res.worker.name,
			});

			await reservationReminder({
				name: res.clientName,
				phoneNumber: res.clientPhoneNumber,
				service: res.service.name,
				date: formattedDate,
				time: formattedTime,
				worker: res.worker.name,
			})

			await res.update({ reminderSent: true });
			console.log(
				`🔔 Enviado recordatorio a ${res.clientGmail} para ${res.date} ${res.startTime}`,
			);
		}
	} catch (error) {
		console.error("❌ Error en el cron de recordatorios:", error.message);
	}
});
