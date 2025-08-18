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
import { toZonedTime } from "date-fns-tz"
const ARG_TIMEZONE = "America/Argentina/Buenos_Aires";

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
  console.log(">>> getHoursByDate llamado con params:", { workerId, date, serviceId });

  try {
    const result = await getWorkerAvailableHours({ workerId, serviceId, date });

    console.log(">>> Resultado de getWorkerAvailableHours:", result);

    if (result.message) {
      console.log(">>> Se devuelve mensaje:", result.message);
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
  const zonedToday = toZonedTime(today, ARG_TIMEZONE);
  console.log(">>> getBlockedDays - today (UTC):", today);
  console.log(">>> getBlockedDays - zonedToday (ARG):", zonedToday);

  const blockedDays = [];
  const daysToCheck = 1;

  for (let i = 0; i < daysToCheck; i++) {
    const date = format(addDays(zonedToday, i), "yyyy-MM-dd");
    console.log(`--- Chequeando día ${i + 1} / ${daysToCheck}: ${date} ---`);

    try {
      const result = await getWorkerAvailableHours({
        workerId,
        serviceId,
        date,
      });

      console.log(`Resultado para ${date}:`, result);

      if (result.source === "disabled") {
        console.log(`>>> Día ${date} bloqueado por estar deshabilitado`);
        blockedDays.push(date);
      } else if (result.source === "past") {
        console.log(`>>> Día ${date} bloqueado por ser pasado`);
        blockedDays.push(date);
      } else if (result.timeSlots.length === 0) {
        console.log(`>>> Día ${date} bloqueado porque no quedan slots disponibles`);
        blockedDays.push(date);
      }
    } catch (err) {
      console.error(`Error en día ${date}:`, err.message);
    }
  }

  console.log(">>> Días bloqueados calculados:", blockedDays);

  return res.status(200).json({ blockedDays });
};

export const getWorkerAvailableHours = async ({ workerId, serviceId, date }) => {
  console.log(">>> getWorkerAvailableHours llamado con:", { workerId, serviceId, date });

  // Parseo de la fecha recibida
  const parsedDate = parseISO(date);
  const now = new Date();

  // Convertimos a hora de Argentina
  const zonedParsedDate = toZonedTime(parsedDate, ARG_TIMEZONE);
  const zonedNow = toZonedTime(now, ARG_TIMEZONE);

  console.log("Fecha recibida (ISO):", date);
  console.log("parsedDate (UTC):", parsedDate);
  console.log("zonedParsedDate (ARG):", zonedParsedDate);
  console.log("now (UTC):", now);
  console.log("zonedNow (ARG):", zonedNow);

  // Validación de fecha pasada
  if (isBefore(startOfDay(zonedParsedDate), startOfDay(zonedNow))) {
    console.log("La fecha está en el pasado. Retornando 'past'.");
    return {
      source: "past",
      message: "No se pueden consultar horarios de fechas pasadas",
      timeSlots: [],
    };
  }

  // Día de la semana en español
  const dayOfWeek = format(parsedDate, "eeee", { locale: es });
  console.log("Día de la semana:", dayOfWeek);

  // Buscar servicio
  const service = await Service.findByPk(serviceId, {
    include: [{ model: Worker, as: "Workers" }],
  });
  if (!service) throw new Error("Servicio no encontrado");
  console.log("Servicio encontrado:", service.name);

  // Verificar que el trabajador esté asignado al servicio
  const workerIsAssigned = service.Workers.some(
    (worker) => worker.id === Number.parseInt(workerId)
  );
  console.log("Worker asignado al servicio:", workerIsAssigned);
  if (!workerIsAssigned) {
    return {
      source: "not_assigned",
      message: "Este trabajador no ofrece el servicio seleccionado",
      timeSlots: [],
    };
  }

  const serviceDuration = service.duration;
  console.log("Duración del servicio (min):", serviceDuration);

  // Revisar si el día está deshabilitado
  const disabled = await DisableDay.findOne({ where: { workerId, day: date } });
  console.log("Día deshabilitado:", !!disabled);
  if (disabled) {
    return {
      source: "disabled",
      message: "El día está deshabilitado para este trabajador",
      timeSlots: [],
    };
  }

  // Revisar horarios personalizados
  const customWorkingHours = await CustomWorkingHour.findAll({
    where: { workerId, dayOfWeek: date },
    include: [{ model: Worker, as: "worker" }],
  });
  console.log("CustomWorkingHours encontrados:", customWorkingHours.length);

  const timeSlots = [];
  const shouldFilterPastTimes = isToday(zonedParsedDate);
  console.log("Filtrar horas pasadas hoy (ARG):", shouldFilterPastTimes);

  const generateSlots = (startTimeStr, endTimeStr) => {
    console.log(`Generando slots desde ${startTimeStr} hasta ${endTimeStr}`);
    let currentStart = new Date(`${date}T${startTimeStr}`);
    const endTime = new Date(`${date}T${endTimeStr}`);

    while (currentStart < endTime) {
      const slotEndTime = addMinutes(currentStart, serviceDuration);
      if (slotEndTime <= endTime) {
        if (!shouldFilterPastTimes || isAfter(currentStart, zonedNow)) {
          timeSlots.push({ startTime: format(currentStart, "HH:mm") });
          console.log("Slot agregado:", format(currentStart, "HH:mm"));
        } else {
          console.log("Slot descartado por ser pasado:", format(currentStart, "HH:mm"));
        }
      }
      currentStart = addMinutes(currentStart, serviceDuration);
    }
  };

  if (customWorkingHours.length > 0) {
    console.log("Usando horarios personalizados");
    for (const customHour of customWorkingHours) {
      generateSlots(customHour.startTime, customHour.endTime);
    }
  } else {
    const workingHours = await WorkingHour.findAll({
      where: { workerId, dayOfWeek },
      include: [{ model: Worker, as: "worker" }],
    });
    console.log("WorkingHours semanales encontrados:", workingHours.length);

    for (const work of workingHours) {
      generateSlots(work.startTime, work.endTime);
    }
  }

  console.log("Slots generados antes de filtrar reservas:", timeSlots);

  // Filtrar slots ocupados por reservas existentes
  const existingReservations = await Reservation.findAll({
    where: {
      workerId,
      date,
      status: { [Op.notIn]: ["cancel"] },
    },
    attributes: ["startTime", "endTime"],
  });
  console.log("Reservas existentes:", existingReservations.length);

  const reservedRanges = existingReservations.map((res) => {
    const resStart = parse(res.startTime, "HH:mm:ss", new Date(`${date}T00:00`));
    const resEnd = parse(res.endTime, "HH:mm:ss", new Date(`${date}T00:00`));
    console.log(`Reserva bloquea de ${format(resStart, "HH:mm")} a ${format(resEnd, "HH:mm")}`);
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

    if (!overlaps) console.log("Slot disponible:", slot.startTime);
    else console.log("Slot eliminado por solapamiento:", slot.startTime);

    return !overlaps;
  });

  availableSlots.sort((a, b) => {
    const timeA = new Date(`1970-01-01T${a.startTime}:00Z`);
    const timeB = new Date(`1970-01-01T${b.startTime}:00Z`);
    return timeA - timeB;
  });

  console.log("Slots finales disponibles:", availableSlots);

  return {
    source: customWorkingHours.length > 0 ? "custom" : "weekly",
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
