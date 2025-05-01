import { Worker } from "../models/workers.js";

export const getWorkers = async (req, res) => {
	try {
		const workers = await Worker.findAll({
			order: [["name", "ASC"]],
		});
		res.status(200).json(workers);
	} catch (error) {
		console.error("Error al obtener workers:", error);
		res.status(500).json({ message: "Error interno del servidor" });
	}
};

export const createWorker = async (req, res) => {
	const { name, gmail, phoneNumber } = req.body;

	try {
		const worker = await Worker.findOne({ where: { gmail } });

		if (worker) {
			return res
				.status(409)
				.json({ message: "Ya hay un trabajador con este gmail" });
		}

		const newWorker = await Worker.create({
			name,
			gmail,
			phoneNumber,
		});

		return res.status(200).json({
			message: "Trabajador creado correctamente!",
			worker: newWorker,
		});
	} catch (error) {
		console.error("Error al crear worker:", error);
		res.status(500).json({ message: "Error interno del servidor" });
	}
};

export const deleteWorker = async (req, res) => {
	const { id } = req.params;

	try {
		const worker = await Worker.findByPk(id);

		if (!worker) {
			return res.status(404).json({ message: "Trabajador no encontrado" });
		}

		await worker.destroy();
		return res
			.status(200)
			.json({ message: "Trabajdor eliminado correctamente" });
	} catch (error) {
		console.error("Error al eliminar trabajador:", error);
		res.status(500).json({ message: "Error interno del servidor" });
	}
};

export const editWorker = async (req, res) => {
	const { id } = req.params;
	const { gmail, phoneNumber } = req.body;

	if (!gmail && !phoneNumber) {
		return res
			.status(400)
			.json({ message: "Debes proporcionar al menos un dato a modificar" });
	}

	try {
		const worker = await Worker.findByPk(id);

		if (!worker) {
			return res.status(404).json({ message: "Trabajador no encontrado" });
		}

		if (gmail !== undefined) worker.gmail = gmail;
		if (phoneNumber !== undefined) worker.phoneNumber = phoneNumber;

		await worker.save();

		return res.status(200).json({
			message: "Trabajador actualizado correctamente",
			worker,
		});
	} catch (error) {
		console.error("Error al editar worker:", error);
		return res.status(500).json({ message: "Error interno del servidor" });
	}
};
