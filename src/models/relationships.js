import { CustomWorkingHour } from "./customWorkingHours.js";
import { DisableDay } from "./disableDays.js";
import { Reservation } from "./reservations.js";
import { Service } from "./services.js";
import { Worker } from "./workers.js";
import { WorkingHour } from "./workingHours.js";

// SERVICES

Service.belongsToMany(Worker, { through: "ServiceWorker" });
Worker.belongsToMany(Service, { through: "ServiceWorker" });

// WORKING HOUR

Worker.hasMany(WorkingHour, {
	foreignKey: "workerId",
	as: "workingHours",
	onDelete: "CASCADE",
	hooks: true,
});
WorkingHour.belongsTo(Worker, {
	foreignKey: "workerId",
	as: "worker",
});

// CUSTOM WORKING HOUR

Worker.hasMany(CustomWorkingHour, {
	foreignKey: "workerId",
	as: "customWorkingHours",
});
CustomWorkingHour.belongsTo(Worker, {
	foreignKey: "workerId",
	as: "worker",
});

Worker.hasMany(DisableDay, {
	foreignKey: "workerId",
	as: "disabledDays",
});
DisableDay.belongsTo(Worker, {
	foreignKey: "workerId",
	as: "worker",
});

//RESERVATIONS

Worker.hasMany(Reservation, {
	foreignKey: "workerId",
	as: "reservations",
});
Reservation.belongsTo(Worker, {
	foreignKey: "workerId",
	as: "worker",
});

Service.hasMany(Reservation, {
	foreignKey: "serviceId",
	as: "reservations",
});
Reservation.belongsTo(Service, {
	foreignKey: "serviceId",
	as: "service",
});
