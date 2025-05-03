import { CustomWorkingHour } from "./customWorkingHours.js";
import { DisableDay } from "./disableDays.js";
import { Service } from "./services.js";
import { Worker } from "./workers.js";
import { WorkingHour } from "./workingHours.js";

Service.belongsToMany(Worker, { through: "ServiceWorker" });
Worker.belongsToMany(Service, { through: "ServiceWorker" });

Worker.hasMany(WorkingHour, {
	foreignKey: "workerId",
	as: "workingHours",
});
WorkingHour.belongsTo(Worker, {
	foreignKey: "workerId",
	as: "worker",
});

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
