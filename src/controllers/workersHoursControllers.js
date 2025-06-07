import {
	addDays,
	addMinutes,
	format,
	isAfter,
	isBefore,
	isToday,
	parse,
	parseISO,
	startOfDay,
} from "date-fns";
import { es } from "date-fns/locale";
import { Op } from "sequelize";
import { CustomWorkingHour } from "../models/customWorkingHours.js";
import { DisableDay } from "../models/disableDays.js";
import { Reservation } from "../models/reservations.js";
import { Service } from "../models/services.js";
import { Worker } from "../models/workers.js";
import { WorkingHour } from "../models/workingHours.js";

export const createWorkingHour = async (req, res) => {
	const hours = req.body;

	if (!Array.isArray(hours)) {
		return res
			.status(400)
			.json({ message: "El cuerpo debe ser un array de horarios." });
	}

	try {
		const created = [];

		for (const hour of hours) {
			const { workerId, dayOfWeek, startTime, endTime } = hour;

			if (!workerId || !dayOfWeek || !startTime || !endTime) {
				continue;
			}

			if (startTime >= endTime) {
				continue;
			}

			const exists = await WorkingHour.findOne({
				where: { workerId, dayOfWeek, startTime, endTime },
			});
			if (!exists) {
				const newHour = await WorkingHour.create({
					workerId,
					dayOfWeek,
					startTime,
					endTime,
				});
				created.push(newHour);
			}
		}

		res.status(200).json({
			message: "Horarios creados exitosamente",
			hours: created,
		});
	} catch (error) {
		console.error("Error al crear workingHours:", error);
		res.status(500).json({ message: "Error interno del servidor" });
	}
};

export const getWorkingHours = async (req, res) => {
	const { workerId } = req.query;

	const dayOrder = [
	"lunes",
	"martes",
	"miércoles",
	"jueves",
	"viernes",
	"sábado",
	"domingo",
];

	try {
		const workingHours = await WorkingHour.findAll({
			where: { workerId },
			attributes: { exclude: ["workerId"] },
			include: [{ model: Worker, as: "worker" }],
		});

		workingHours.sort(
	(a, b) => dayOrder.indexOf(a.dayOfWeek.toLowerCase()) - dayOrder.indexOf(b.dayOfWeek.toLowerCase())
	);

		if (workingHours.length === 0) {
			return res.status(404).json({
				message: "No se encontraron horarios semanales para este trabajador.",
			});
		}

		return res.status(200).json({
			source: "weekly",
			workingHours,
		});
	} catch (error) {
		console.error("Error al obtener los horarios semanales:", error);
		res.status(500).json({ message: "Error del servidor" });
	}
};

export const createCustomWorkingHour = async (req, res) => {
	const { workerId, dayOfWeek, startTime, endTime } = req.body;

	try {
		const customHour = await CustomWorkingHour.create({
			workerId,
			dayOfWeek,
			startTime,
			endTime,
		});

		res.status(200).json({
			message: "Horarios creados con exitos",
			customHour: customHour,
		});
	} catch (error) {
		console.error("Error al crear customWorkingHours:", error);
		res.status(500).json({ message: "Error interno del servidor" });
	}
};

export const getCustomWorkingHours = async (req, res) => {
	const { workerId } = req.query;

	try {
		const customWorkingHours = await CustomWorkingHour.findAll({
			where: { workerId },
			include: [{ model: Worker, as: "worker" }],
		});

		if (customWorkingHours.length === 0) {
			return res.status(404).json({
				message:
					"No se encontraron horarios personalizados para este trabajador.",
			});
		}

		return res.status(200).json({
			source: "custom",
			customWorkingHours,
		});
	} catch (error) {
		console.error("Error al obtener los horarios personalizados:", error);
		res.status(500).json({ message: "Error del servidor" });
	}
};

export const getHoursByDate = async (req, res) => {
	const { workerId, date, serviceId } = req.query;

	try {
		const result = await getWorkerAvailableHours({ workerId, serviceId, date });

		if (result.message) {
			return res.status(200).json(result);
		}

		return res.status(200).json(result);
	} catch (error) {
		console.error("Error al obtener los horarios del trabajador:", error);
		return res.status(500).json({ message: "Error del servidor" });
	}
};

export const getBlockedDays = async (req, res) => {
	const { workerId, serviceId } = req.query;

	const today = new Date();
	const blockedDays = [];
	const daysToCheck = 65;

	for (let i = 0; i < daysToCheck; i++) {
		const date = format(addDays(today, i), "yyyy-MM-dd");

		try {
			const result = await getWorkerAvailableHours({
				workerId,
				serviceId,
				date,
			});

			if (result.source === "disabled" || result.timeSlots.length === 0) {
				blockedDays.push(date);
			}
		} catch (err) {
			console.error(`Error en día ${date}:`, err.message);
		}
	}

	return res.status(200).json({ blockedDays });
};

export const getWorkerAvailableHours = async ({
	workerId,
	serviceId,
	date,
}) => {
	const parsedDate = parseISO(date);
	const now = new Date();

	if (isBefore(startOfDay(parsedDate), startOfDay(now))) {
		return {
			source: "past",
			message: "No se pueden consultar horarios de fechas pasadas",
			timeSlots: [],
		};
	}

	const dayOfWeek = format(parsedDate, "eeee", { locale: es });

	const service = await Service.findByPk(serviceId, {
		include: [{ model: Worker, as: "Workers" }],
	});

	if (!service) throw new Error("Servicio no encontrado");

	const workerIsAssigned = service.Workers.some(
		(worker) => worker.id === Number.parseInt(workerId),
	);

	if (!workerIsAssigned) {
		return {
			source: "not_assigned",
			message: "Este trabajador no ofrece el servicio seleccionado",
			timeSlots: [],
		};
	}

	const serviceDuration = service.duration;

	const disabled = await DisableDay.findOne({
		where: { workerId, day: date },
	});

	if (disabled) {
		return {
			source: "disabled",
			message: "El día está deshabilitado para este trabajador",
			timeSlots: [],
		};
	}

	const customWorkingHours = await CustomWorkingHour.findOne({
		where: { workerId, dayOfWeek: date },
		include: [{ model: Worker, as: "worker" }],
	});

	const timeSlots = [];
	const shouldFilterPastTimes = isToday(parsedDate);

	const generateSlots = (startTimeStr, endTimeStr) => {
		let currentStart = new Date(`${date}T${startTimeStr}`);
		const endTime = new Date(`${date}T${endTimeStr}`);

		while (currentStart < endTime) {
			const slotEndTime = addMinutes(currentStart, serviceDuration);
			if (slotEndTime <= endTime) {
				if (!shouldFilterPastTimes || isAfter(currentStart, now)) {
					timeSlots.push({
						startTime: format(currentStart, "HH:mm"),
					});
				}
			}
			currentStart = addMinutes(currentStart, serviceDuration);
		}
	};

	if (customWorkingHours) {
		generateSlots(customWorkingHours.startTime, customWorkingHours.endTime);
	} else {
		const workingHours = await WorkingHour.findAll({
			where: { workerId, dayOfWeek },
			include: [{ model: Worker, as: "worker" }],
		});
		for (const work of workingHours) {
			generateSlots(work.startTime, work.endTime);
		}
	}

	const existingReservations = await Reservation.findAll({
		where: {
			workerId,
			date,
			status: {
				[Op.notIn]: ["cancel"],
			},
		},
		attributes: ["startTime", "endTime"],
	});

	const reservedRanges = existingReservations.map((res) => {
		const resStart = parse(
			res.startTime,
			"HH:mm:ss",
			new Date(`${date}T00:00`),
		);
		const resEnd = parse(res.endTime, "HH:mm:ss", new Date(`${date}T00:00`));
		return { resStart, resEnd };
	});

	const availableSlots = timeSlots.filter((slot) => {
		const slotStart = parse(slot.startTime, "HH:mm", new Date(`${date}T00:00`));
		const slotEnd = addMinutes(slotStart, serviceDuration);

		const overlaps = reservedRanges.some(({ resStart, resEnd }) => {
			return (
				(slotStart >= resStart && slotStart < resEnd) ||
				(slotEnd > resStart && slotEnd <= resEnd) ||
				(slotStart <= resStart && slotEnd >= resEnd)
			);
		});

		return !overlaps;
	});

	availableSlots.sort((a, b) => {
		const timeA = new Date(`1970-01-01T${a.startTime}:00Z`);
		const timeB = new Date(`1970-01-01T${b.startTime}:00Z`);
		return timeA - timeB;
	});

	return {
		source: customWorkingHours ? "custom" : "weekly",
		timeSlots: availableSlots,
	};
};

export const editWorkingHour = async (req, res) => {
	const { id } = req.params;
	const { startTime, endTime } = req.body;

	try {
		const workingHour = await WorkingHour.findByPk(id);

		if (!workingHour) {
			return res.status(404).json({ message: "Horario no encontrado" });
		}

		workingHour.startTime = startTime ?? workingHour.startTime;
		workingHour.endTime = endTime ?? workingHour.endTime;

		await workingHour.save();

		res.status(200).json({
			message: "Horario actualizado con éxito",
			workingHour,
		});
	} catch (error) {
		console.error("Error al actualizar el horario:", error);
		res.status(500).json({ message: "Error interno del servidor" });
	}
};

export const editCustomWorkingHour = async (req, res) => {
	const { id } = req.params;
	const { startTime, endTime } = req.body;

	try {
		const customHour = await CustomWorkingHour.findByPk(id);

		if (!customHour) {
			return res
				.status(404)
				.json({ message: "Horario personalizado no encontrado" });
		}

		customHour.startTime = startTime ?? customHour.startTime;
		customHour.endTime = endTime ?? customHour.endTime;

		await customHour.save();

		res.status(200).json({
			message: "Horario personalizado actualizado con éxito",
			customHour,
		});
	} catch (error) {
		console.error("Error al actualizar customWorkingHour:", error);
		res.status(500).json({ message: "Error interno del servidor" });
	}
};

export const deleteWorkingHour = async (req, res) => {
	const { id } = req.params;

	try {
		const workingHour = await WorkingHour.findByPk(id);

		if (!workingHour) {
			return res.status(404).json({ message: "Horario semanal no encontrado" });
		}

		await workingHour.destroy();

		res.status(200).json({ message: "Horario semanal eliminado con éxito" });
	} catch (error) {
		console.error("Error al eliminar WorkingHour:", error);
		res.status(500).json({ message: "Error interno del servidor" });
	}
};

export const deleteCustomWorkingHour = async (req, res) => {
	const { id } = req.params;

	try {
		const customHour = await CustomWorkingHour.findByPk(id);

		if (!customHour) {
			return res
				.status(404)
				.json({ message: "Horario personalizado no encontrado" });
		}

		await customHour.destroy();

		res
			.status(200)
			.json({ message: "Horario personalizado eliminado con éxito" });
	} catch (error) {
		console.error("Error al eliminar CustomWorkingHour:", error);
		res.status(500).json({ message: "Error interno del servidor" });
	}
};
