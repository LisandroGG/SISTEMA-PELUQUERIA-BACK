import {
	addMinutes,
	format,
	isAfter,
	isBefore,
	isToday,
	parseISO,
	startOfDay,
} from "date-fns";
import { es } from "date-fns/locale";
import { CustomWorkingHour } from "../models/customWorkingHours.js";
import { DisableDay } from "../models/disableDays.js";
import { Service } from "../models/services.js";
import { Worker } from "../models/workers.js";
import { WorkingHour } from "../models/workingHours.js";

export const createWorkingHour = async (req, res) => {
	const { workerId, dayOfWeek, startTime, endTime } = req.body;

	try {
		const hour = await WorkingHour.create({
			workerId,
			dayOfWeek,
			startTime,
			endTime,
		});

		res.status(200).json({
			message: "Horarios creados con exitos",
			hour: hour,
		});
	} catch (error) {
		console.error("Error al crear workingHours:", error);
		res.status(500).json({ message: "Error interno del servidor" });
	}
};

export const getWorkingHours = async (req, res) => {
	const { workerId } = req.query;

	try {
		const workingHours = await WorkingHour.findAll({
			where: { workerId },
			include: [{ model: Worker, as: "worker" }],
		});

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
		const parsedDate = parseISO(date);
		const now = new Date();

		// ❌ No permitir días anteriores a hoy
		if (isBefore(startOfDay(parsedDate), startOfDay(now))) {
			return res.status(200).json({
				source: "past",
				message: "No se pueden consultar horarios de fechas pasadas",
				hours: [],
			});
		}

		const dayOfWeek = format(parsedDate, "eeee", { locale: es });

		const service = await Service.findByPk(serviceId);
		if (!service) {
			return res.status(404).json({ message: "Servicio no encontrado" });
		}

		const serviceDuration = service.duration;

		const disabled = await DisableDay.findOne({
			where: { workerId, day: date },
		});

		if (disabled) {
			return res.status(200).json({
				source: "disabled",
				message: "El día está deshabilitado para este trabajador",
				hours: [],
			});
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

			return res.status(200).json({
				source: "custom",
				customWorkingHours,
				timeSlots,
			});
		}

		const workingHours = await WorkingHour.findAll({
			where: { workerId, dayOfWeek },
			include: [{ model: Worker, as: "worker" }],
		});

		for (const work of workingHours) {
			generateSlots(work.startTime, work.endTime);
		}

		timeSlots.sort((a, b) => {
			const timeA = new Date(`1970-01-01T${a.startTime}:00Z`);
			const timeB = new Date(`1970-01-01T${b.startTime}:00Z`);
			return timeA - timeB;
		});

		return res.status(200).json({
			source: "weekly",
			workingHours,
			timeSlots,
		});
	} catch (error) {
		console.error("Error al obtener los horarios del trabajador:", error);
		res.status(500).json({ message: "Error del servidor" });
	}
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
