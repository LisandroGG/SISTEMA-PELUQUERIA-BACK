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
import { Sequelize } from "sequelize";
import { CustomWorkingHour } from "../models/customWorkingHours.js";
import { DisableDay } from "../models/disableDays.js";
import { Reservation } from "../models/reservations.js";
import { Service } from "../models/services.js";
import { Worker } from "../models/workers.js";
import { WorkingHour } from "../models/workingHours.js";

const ARG_TIMEZONE = "America/Argentina/Buenos_Aires";

import { toZonedTime } from "date-fns-tz";

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
				return res
					.status(400)
					.json({ message: "Todos los campos son obligatorios." });
			}
			if (startTime >= endTime) {
				return res.status(400).json({
					message: `El tiempo de inicio debe ser menor que el de . Error en el horario: ${JSON.stringify(hour)}`,
				});
			}

			const overlapping = await WorkingHour.findOne({
				where: {
					workerId,
					dayOfWeek,
					[Op.or]: [
						{
							startTime: { [Op.lt]: endTime },
							endTime: { [Op.gt]: startTime },
						},
					],
				},
			});

			if (overlapping) {
				return res.status(400).json({
					message: `Horario superpuesto o duplicado detectado para el día ${dayOfWeek}.`,
					conflictingHour: overlapping,
				});
			}

			const newHour = await WorkingHour.create({
				workerId,
				dayOfWeek,
				startTime,
				endTime,
			});
			created.push(newHour);
		}

		res.status(201).json({
			message: "Horarios semanales creados exitosamente!",
			hours: created,
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
			attributes: { exclude: ["workerId"] },
			include: [{ model: Worker, as: "worker" }],
			order: [
				[
					Sequelize.literal(`
				CASE "WorkingHour"."dayOfWeek"
					WHEN 'lunes' THEN 1
					WHEN 'martes' THEN 2
					WHEN 'miércoles' THEN 3
					WHEN 'jueves' THEN 4
					WHEN 'viernes' THEN 5
					WHEN 'sábado' THEN 6
					WHEN 'domingo' THEN 7
				END
			`),
					"ASC",
				],
				["startTime", "ASC"],
			],
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
		const isDisabled = await DisableDay.findOne({
			where: {
				day: dayOfWeek,
				workerId: workerId,
			},
		});

		if (isDisabled) {
			return res.status(400).json({
				message: `No se puede crear un horario personalizado para el día ${dayOfWeek} porque está deshabilitado.`,
			});
		}

		const existingOverlap = await CustomWorkingHour.findOne({
			where: {
				workerId,
				dayOfWeek,
				[Op.or]: [
					{
						startTime: {
							[Op.lt]: endTime,
						},
						endTime: {
							[Op.gt]: startTime,
						},
					},
				],
			},
		});

		if (existingOverlap) {
			return res.status(400).json({
				message:
					"Ya existe un horario personalizado que se superpone con este.",
			});
		}
		const customHour = await CustomWorkingHour.create({
			workerId,
			dayOfWeek,
			startTime,
			endTime,
		});

		res.status(200).json({
			message: "Horario personalizado creado exitosamente!",
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
			order: [
				["dayOfWeek", "ASC"],
				["startTime", "ASC"],
			],
		});

		if (customWorkingHours.length === 0) {
			return res.status(200).json({
				source: "custom",
				customWorkingHours: [],
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
	const today = toZonedTime(new Date(), ARG_TIMEZONE);
	const blockedDays = [];
	const daysToCheck = 5;

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
	console.log("🔎 getWorkerAvailableHours() called with:", { workerId, serviceId, date });
	const parsedDate = toZonedTime(
		parseISO(`${date}T00:00:00-03:00`),
		ARG_TIMEZONE,
	);
	const now = toZonedTime(new Date(), ARG_TIMEZONE);
		console.log("📅 parsedDate:", parsedDate);
	console.log("🕒 now:", now);

	if (isBefore(startOfDay(parsedDate), startOfDay(now))) {
		console.log("⏪ Fecha en el pasado ->", parsedDate);
		return {
			source: "past",
			message: "No se pueden consultar horarios de fechas pasadas",
			timeSlots: [],
		};
	}

	const dayOfWeek = format(parsedDate, "eeee", { locale: es });
	console.log("📌 dayOfWeek:", dayOfWeek);

	const service = await Service.findByPk(serviceId, {
		include: [{ model: Worker, as: "Workers" }],
	});
	console.log("💇‍♂️ service:", service?.id, "duration:", service?.duration);

	if (!service) {
		console.log("⚠️ Servicio no encontrado");
		return {
			source: "no_find_service",
			message: "Servicio no encontrado",
			timeSlots: [],
		};
	}

	const workerIsAssigned = service.Workers.some(
		(worker) => worker.id === Number.parseInt(workerId),
	);
	console.log("👷 workerIsAssigned:", workerIsAssigned);

	if (!workerIsAssigned) {
		console.log("⚠️ El trabajador no ofrece el servicio");
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

	console.log("🚫 disabledDay:", disabled ? "Sí" : "No");

	if (disabled) {
		return {
			source: "disabled",
			message: "El día está deshabilitado para este trabajador",
			timeSlots: [],
		};
	}

	const customWorkingHours = await CustomWorkingHour.findAll({
		where: { workerId, dayOfWeek: date },
		include: [{ model: Worker, as: "worker" }],
	});

	console.log("📊 customWorkingHours:", customWorkingHours);

	const timeSlots = [];
	const shouldFilterPastTimes = isToday(parsedDate);
	console.log("📌 shouldFilterPastTimes:", shouldFilterPastTimes);

	const generateSlots = (startTimeStr, endTimeStr) => {
		console.log(`🛠 Generating slots from ${startTimeStr} to ${endTimeStr}`);
		let [hour, min] = startTimeStr.split(":").map(Number);
		const [endHour, endMin] = endTimeStr.split(":").map(Number);


		while (hour < endHour || (hour === endHour && min < endMin)) {
			const slotDate = new Date(
				parsedDate.getFullYear(),
				parsedDate.getMonth(),
				parsedDate.getDate(),
				hour,
				min,
			);
			const slotEndDate = addMinutes(slotDate, serviceDuration);
			const slotStr = format(slotDate, "HH:mm");

			console.log("➡️ Slot candidate:", slotStr, "| slotDate:", slotDate);

			if (!shouldFilterPastTimes || isAfter(slotDate, now)) {
				console.log("✅ Slot agregado:", slotStr);
				timeSlots.push({ startTime: slotStr });
			}else {
				console.log("❌ Slot descartado (pasado):", slotStr);
			}

			min += serviceDuration;
			while (min >= 60) {
				min -= 60;
				hour += 1;
			}
		}
	};

	if (customWorkingHours.length > 0) {
		for (const customHour of customWorkingHours) {
			console.log("⚡ customWorkingHour:", customHour.startTime, "-", customHour.endTime);
			generateSlots(customHour.startTime, customHour.endTime);
		}
	} else {
		const workingHours = await WorkingHour.findAll({
			where: { workerId, dayOfWeek },
			include: [{ model: Worker, as: "worker" }],
		});
		console.log("📊 workingHours:", workingHours);
		for (const work of workingHours) {
			console.log("⚡ workingHour:", work.startTime, "-", work.endTime);
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

	console.log("📌 existingReservations:", existingReservations);

	const reservedRanges = existingReservations.map((res) => {
		const resStart = parse(
			res.startTime,
			"HH:mm:ss",
			new Date(`${date}T00:00`),
		);
		const resEnd = parse(res.endTime, "HH:mm:ss", new Date(`${date}T00:00`));
		console.log("🔒 Reservation range:", res.startTime, "-", res.endTime, "|", resStart, "-", resEnd);
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

		if(overlaps) {
			console.log("❌ Slot eliminado por solapamiento:", slot.startTime);
		}

		return !overlaps;
	});

	console.log("✅ availableSlots:", availableSlots);

	availableSlots.sort((a, b) => {
		const timeA = new Date(`1970-01-01T${a.startTime}:00Z`);
		const timeB = new Date(`1970-01-01T${b.startTime}:00Z`);
		return timeA - timeB;
	});

	return {
		source: customWorkingHours > 0 ? "custom" : "weekly",
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

		const newStart = startTime ?? workingHour.startTime;
		const newEnd = endTime ?? workingHour.endTime;
		const { workerId, dayOfWeek } = workingHour;

		const overlapping = await WorkingHour.findOne({
			where: {
				id: { [Op.ne]: id },
				workerId,
				dayOfWeek,
				[Op.or]: [
					{
						startTime: { [Op.lt]: newEnd },
						endTime: { [Op.gt]: newStart },
					},
				],
			},
		});

		if (overlapping) {
			return res.status(400).json({
				message: "Ya existe un horario semanal que se superpone con este.",
			});
		}

		workingHour.startTime = newStart;
		workingHour.endTime = newEnd;
		await workingHour.save();

		res.status(200).json({
			message: "Horario semanal actualizado exitosamente!",
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
		const { workerId, dayOfWeek } = customHour;
		const newStart = startTime ?? customHour.startTime;
		const newEnd = endTime ?? customHour.endTime;

		const overlapping = await CustomWorkingHour.findOne({
			where: {
				id: { [Op.ne]: id },
				workerId,
				dayOfWeek,
				[Op.or]: [
					{
						startTime: { [Op.lt]: newEnd },
						endTime: { [Op.gt]: newStart },
					},
				],
			},
		});

		if (overlapping) {
			return res.status(400).json({
				message:
					"Ya existe un horario personalizado que se superpone con este.",
			});
		}

		customHour.startTime = newStart;
		customHour.endTime = newEnd;
		await customHour.save();

		res.status(200).json({
			message: "Horario personalizado actualizado exitosamente!",
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

		res
			.status(200)
			.json({ message: "Horario semanal eliminado exitosamente!" });
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
			.json({ message: "Horario personalizado eliminado exitosamente!" });
	} catch (error) {
		console.error("Error al eliminar CustomWorkingHour:", error);
		res.status(500).json({ message: "Error interno del servidor" });
	}
};
