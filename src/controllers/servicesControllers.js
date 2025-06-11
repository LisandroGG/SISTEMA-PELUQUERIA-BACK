import { Service } from "../models/services.js";
import { Worker } from "../models/workers.js";

export const getServices = async (req, res) => {
	try {
		const services = await Service.findAll({
			include: {
				model: Worker,
				attributes: ["id", "name"],
				through: { attributes: [] },
			},
		});
		res.status(200).json(services);
	} catch (error) {
		console.error("Error al obtener services", error);
		res.status(500).json({ message: "Error internom del servidor" });
	}
};

export const createService = async (req, res) => {
	const { name, cost, duration, workerIds } = req.body;

	if (!name || !cost || !duration) {
		return res.status(404).json({ message: "Completa los campos" });
	}

	try {
		const service = await Service.findOne({ where: { name } });

		if (service) {
			return res
				.status(400)
				.json({ message: "Ya hay un servicio con este nombre" });
		}

		const newService = await Service.create({
			name,
			cost,
			duration,
		});

		if (workerIds && Array.isArray(workerIds)) {
			const workers = await Worker.findAll({ where: { id: workerIds } });

			if (workers.length !== workerIds.length) {
				return res
					.status(400)
					.json({ message: "Uno o más trabajadores no existen" });
			}

			await newService.setWorkers(workerIds);
		}

		const serviceWithWorkers = await Service.findByPk(newService.id, {
			include: {
				model: Worker,
				attributes: ["id", "name"],
				through: { attributes: [] },
			},
		});

		res.status(201).json({
			message: "Servicio creado correctamente!",
			service: serviceWithWorkers,
		});
	} catch (error) {
		console.error("Error al crear service", error);
		res.status(500).json({ message: "Error interno del servidor" });
	}
};

export const deleteService = async (req, res) => {
	const { id } = req.params;

	try {
		const service = await Service.findByPk(id);

		if (!service) {
			return res.status(404).json({ message: "Servicio no encontado" });
		}

		await service.destroy();
		res.status(200).json({
			message: "Servicio eliminado correctamente",
		});
	} catch (error) {
		console.error("Error al eliminar service", error);
		res.status(500).json({ message: "Error interno del servidor" });
	}
};

export const editService = async (req, res) => {
	const { id } = req.params;
	const { name, cost, duration, workerIds } = req.body;

	if (!name && !cost && !duration && !workerIds) {
		return res
			.status(400)
			.json({ message: "Debes proporcionar al menos un dato a modificar" });
	}

	try {
		const service = await Service.findByPk(id);

		if (!service) {
			return res.status(404).json({ message: "Servicio no encontrado" });
		}

		if (name !== undefined) service.name = name;
		if (cost !== undefined) service.cost = cost;
		if (duration !== undefined) service.duration = duration;

		await service.save();

		if (Array.isArray(workerIds)) {
			const workers = await Worker.findAll({ where: { id: workerIds } });

			if (workers.length !== workerIds.length) {
				return res
					.status(400)
					.json({ message: "Uno o más trabajadores no existen" });
			}

			await service.setWorkers(workerIds);
		}

		const serviceWithWorkers = await Service.findByPk(service.id, {
			include: {
				model: Worker,
				attributes: ["id", "name"],
				through: { attributes: [] },
			},
		});

		res.status(201).json({
			message: "Servicio actualizado correctamente!",
			service: serviceWithWorkers,
		});
	} catch (error) {
		console.error("Error al editar service", error);
		res.status(500).json({ message: "Error interno del servidor" });
	}
};
