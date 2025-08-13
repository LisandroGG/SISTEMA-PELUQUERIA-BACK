import { addMinutes, format, isBefore, parseISO, startOfDay } from "date-fns";
import { es } from "date-fns/locale";
import jwt from "jsonwebtoken";
import { Op } from "sequelize";
import { sendCancelReservation, sendNewReservation } from "../config/mailer.js";
import {
	formatDateToLongSpanish,
	formatTimeToHHMM,
} from "../helpers/format.js";
import { CustomWorkingHour } from "../models/customWorkingHours.js";
import { DisableDay } from "../models/disableDays.js";
import { Reservation } from "../models/reservations.js";
import { Service } from "../models/services.js";
import { Worker } from "../models/workers.js";
import { WorkingHour } from "../models/workingHours.js";
import {
	reservationCancel,
	reservationConfirm,
} from "../whatsapp/messageTemplates.js";

export const createReservation = async (req, res) => {
	const {
		workerId,
		serviceId,
		date,
		startTime,
		clientName,
		clientGmail,
		clientPhoneNumber,
	} = req.body;
	try {
		const parsedDate = parseISO(date);
		const now = new Date();

		if (isBefore(startOfDay(parsedDate), startOfDay(now))) {
			return res
				.status(400)
				.json({ message: "No se puede reservar en fechas pasadas" });
		}

		const service = await Service.findByPk(serviceId, {
			include: {
				model: Worker,
				where: { id: workerId },
			},
		});

		if (!service) {
			return res
				.status(400)
				.json({ message: "El trabajador no ofrece este servicio" });
		}

		const serviceDuration = service.duration;
		const dayOfWeek = format(parsedDate, "eeee", { locale: es });

		const disabled = await DisableDay.findOne({
			where: { workerId, day: date },
		});
		if (disabled) {
			return res
				.status(400)
				.json({ message: "El trabajador no trabaja ese día" });
		}

		let start = null;
		let end = null;

		const custom = await CustomWorkingHour.findOne({
			where: { workerId, dayOfWeek: date },
		});
		if (custom) {
			start = custom.startTime;
			end = custom.endTime;
		} else {
			const working = await WorkingHour.findOne({
				where: { workerId, dayOfWeek },
			});
			if (!working) {
				return res
					.status(400)
					.json({ message: "El trabajador no trabaja ese día" });
			}
			start = working.startTime;
			end = working.endTime;
		}

		const startDateTime = new Date(`${date}T${startTime}`);
		const serviceEndTime = addMinutes(startDateTime, serviceDuration);

		const overlapping = await Reservation.findOne({
			where: {
				workerId,
				date,
				startTime,
				status: {
					[Op.notIn]: ["cancel"],
				},
			},
		});

		if (overlapping) {
			return res
				.status(400)
				.json({ message: "Ya existe una reserva en ese horario" });
		}

		const reservation = await Reservation.create({
			workerId,
			serviceId,
			date,
			startTime,
			endTime: format(serviceEndTime, "HH:mm"),
			clientName,
			clientGmail,
			clientPhoneNumber,
		});

		const cancelStartDateTime = new Date(
			`${reservation.date}T${reservation.startTime}`,)
		const expirationTime = new Date(
			cancelStartDateTime.getTime() - 60 * 60 * 1000,
		);

		const token = jwt.sign(
			{ reservationId: reservation.id },
			process.env.JWT_SECRET_KEY,
			{ expiresIn: Math.floor((expirationTime.getTime() - Date.now()) / 1000) },
		);

		const fullReservation = await Reservation.findByPk(reservation.id, {
			include: [
				{ model: Worker, as: "worker", attributes: ["name"] },
				{ model: Service, as: "service", attributes: ["name"] },
			],
		});

		const formattedDate = formatDateToLongSpanish(fullReservation.date);
		const formattedTime = formatTimeToHHMM(fullReservation.startTime);

		await sendNewReservation({
			to: fullReservation.clientGmail,
			name: fullReservation.clientName,
			service: fullReservation.service.name,
			time: formattedTime,
			date: formattedDate,
			worker: fullReservation.worker.name,
			token: token,
		});

		await reservationConfirm({
			name: fullReservation.clientName,
			phoneNumber: fullReservation.clientPhoneNumber,
			service: fullReservation.service.name,
			date: formattedDate,
			time: formattedTime,
			worker: fullReservation.worker.name,
			token: token,
		});
		res.status(201).json({ message: "Reserva creada con éxito", reservation });
	} catch (error) {
		console.error("Error al crear la reserva:", error);
		res.status(500).json({ message: "Error del servidor" });
	}
};

export const getReservations = async (req, res) => {
	try {
		const { workerId, date, status, serviceId } = req.query;

		const where = {};

		if (workerId) where.workerId = workerId;
		if (date) where.date = date;
		if (status) {
			where.status = status;
		} else {
			where.status = "confirm";
		}
		if (serviceId) where.serviceId = serviceId;

		const reservations = await Reservation.findAll({
			where,
			attributes: { exclude: ["workerId", "serviceId"] },
			include: [
				{ model: Worker, as: "worker", attributes: ["id", "name"] },
				{
					model: Service,
					as: "service",
					attributes: ["id", "name", "duration"],
				},
			],
			order: [
				["date", "ASC"],
				["startTime", "ASC"],
			],
		});

		res.status(200).json({ reservations });
	} catch (error) {
		console.error("Error al obtener las reservas.", error);
		res.status(500).json({ message: "Error del servidor" });
	}
};

export const getReservationsByGmail = async (req, res) => {
	const { gmail } = req.query;

	if (!gmail) {
		return res.status(400).json({ message: "El Gmail es requerido" });
	}

	try {
		const reservations = await Reservation.findAll({
			where: { clientGmail: gmail, status: "confirm" },
			include: [
				{ model: Worker, as: "worker", attributes: ["id", "name"] },
				{
					model: Service,
					as: "service",
					attributes: ["name", "duration"],
				},
			],
			order: [
				["date", "ASC"],
				["startTime", "ASC"],
			],
		});

		if (reservations.length === 0) {
			return res
				.status(404)
				.json({ message: "No se encontraron reservas para este Gmail" });
		}

		return res.status(200).json({ reservations });
	} catch (error) {
		console.error("Error al obtener reservas por Gmail:", error);
		return res.status(500).json({ message: "Error del servidor" });
	}
};

export const finishReservation = async (req, res) => {
	const { reservationId } = req.params;

	try {
		const reservation = await Reservation.findByPk(reservationId);

		if (!reservation) {
			return res.status(404).json({ message: "Reserva no encontrada" });
		}

		if (reservation.status === "finish") {
			return res.status(400).json({ message: "La reserva ya está finalizada" });
		}
		reservation.status = "finish";

		await reservation.save();

		return res
			.status(200)
			.json({ message: "Reserva marcada como finalizada", reservation });
	} catch (error) {
		console.error("Error al cambiar el estado de la reserva:", error);
		return res.status(500).json({ message: "Error del servidor" });
	}
};

export const cancelReservation = async (req, res) => {
	const { token } = req.query;

	if (!token) {
		return res.status(400).json({ message: "Token requerido" });
	}

	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
		const { reservationId } = decoded;
		const reservation = await Reservation.findByPk(reservationId, {
			attributes: { exclude: ["workerId", "serviceId"] },
			include: [
				{ model: Worker, as: "worker", attributes: ["id", "name"] },
				{
					model: Service,
					as: "service",
					attributes: ["id", "name", "duration"],
				},
			],
		});

		if (!reservation) {
			return res.status(404).json({ message: "Reserva no encontrada" });
		}

		if (reservation.status === "finish") {
			return res.status(400).json({ message: "La reserva ya termino" });
		}

		if (reservation.status === "cancel") {
			return res.status(400).json({ message: "La reserva ya está cancelada" });
		}

		reservation.status = "cancel";

		const formattedDate = formatDateToLongSpanish(reservation.date);
		const formattedTime = formatTimeToHHMM(reservation.startTime);

		const sendGmail = await sendCancelReservation({
			to: reservation.clientGmail,
			name: reservation.clientName,
			service: reservation.service.name,
			time: formattedTime,
			date: formattedDate,
			worker: reservation.worker.name,
		});

		if (sendGmail) {
			console.log("error al enviar notificacion");
		}

		await reservationCancel({
			name: reservation.clientName,
			phoneNumber: reservation.clientPhoneNumber,
			service: reservation.service.name,
			date: formattedDate,
			time: formattedTime,
			worker: reservation.worker.name,
		});

		await reservation.save();

		return res.status(200).json({ message: "Reserva cancelada", reservation });
	} catch (error) {
		console.error("Error al cancelar la reserva:", error);
		return res.status(500).json({ message: "No se pudo cancelar" });
	}
};

export const deleteFinishedReservations = async () => {
	try {
		const deletedCount = await Reservation.destroy({
			where: { status: "finish" },
		});
		console.log(`🧹 Se eliminaron ${deletedCount} reservas finalizadas.`);
		return deletedCount;
	} catch (error) {
		console.error("❌ Error al eliminar reservas finalizadas:", error.message);
		throw error;
	}
};
