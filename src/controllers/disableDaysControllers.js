import { DisableDay } from "../models/disableDays.js";

export const createDisableDay = async (req, res) => {
	const { workerId, day } = req.body;

	try {
		const existing = await DisableDay.findOne({ where: { workerId, day } });
		if (existing) {
			return res.status(400).json({
				message: "Ese día ya está deshabilitado para este trabajador.",
			});
		}

		const disableDay = await DisableDay.create({ workerId, day });

		res.status(201).json({
			message: "Día deshabilitado correctamente.",
			disableDay,
		});
	} catch (error) {
		console.error("Error al deshabilitar el día:", error);
		res.status(500).json({ message: "Error del servidor." });
	}
};

export const getDisabledDaysByWorker = async (req, res) => {
	const { workerId } = req.params;

	try {
		const disabledDays = await DisableDay.findAll({ where: { workerId } });

		res.status(200).json(disabledDays);
	} catch (error) {
		console.error("Error al obtener los días deshabilitados:", error);
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
		console.error("Error al eliminar el día deshabilitado:", error);
		res.status(500).json({ message: "Error del servidor." });
	}
};
