import { format } from "date-fns";
import { Op } from "sequelize";
import { DisableDay } from "../models/disableDays.js";
import { Reservation } from "../models/reservations.js";

export const createDisableDay = async (req, res) => {
	const { workerId, day } = req.body;

	try {
		const existing = await DisableDay.findOne({ where: { workerId, day } });
		if (existing) {
			return res.status(400).json({
				message: "Ese día ya está deshabilitado para este trabajador.",
			});
		}

		const existingReservations = await Reservation.findOne({
			where: {
				workerId,
				date: day,
				status: {
					[Op.notIn]: ["cancel", "finish"],
				},
			},
		});

		if (existingReservations) {
			return res.status(400).json({
				message:
					"No se puede deshabilitar el día porque ya existen reservas activas.",
			});
		}

		const disableDay = await DisableDay.create({ workerId, day });

		res.status(201).json({
			message: "Día deshabilitado correctamente.",
			disableDay,
		});
	} catch (error) {
		req.log.error("Error al deshabilitar el día:", error);
		res.status(500).json({ message: "Error del servidor." });
	}
};

export const getDisabledDaysByWorker = async (req, res) => {
	const { workerId } = req.query;

	try {
		const disabledDays = await DisableDay.findAll({
			where: { workerId },
			attributes: { exclude: ["workerId"] },
		});

		res.status(200).json(disabledDays);
	} catch (error) {
		req.log.error("Error al obtener los días deshabilitados:", error);
		res.status(500).json({ message: "Error del servidor." });
	}
};

export const deleteDisableDay = async (req, res) => {
	const { id } = req.params;

	try {
		const deleted = await DisableDay.destroy({ where: { id } });

		if (!deleted) {
			return res.status(404).json({ message: "Día no encontrado." });
		}

		res
			.status(200)
			.json({ message: "Día deshabilitado eliminado correctamente." });
	} catch (error) {
		req.log.error("Error al eliminar el día deshabilitado:", error);
		res.status(500).json({ message: "Error del servidor." });
	}
};

export const deletePastDisableDays = async () => {
	try {
		const today = format(new Date(), "yyyy-MM-dd");
		const deletedCount = await DisableDay.destroy({
			where: {
				day: {
					[Op.lt]: today,
				},
			},
		});
		req.log.info(`Se borraron ${deletedCount} días deshabilitados`);
		return deletedCount;
	} catch (error) {
		req.log.error(
			"Error al eliminar dias deshabilitados pasados:",
			error.message,
		);
		throw error;
	}
};
