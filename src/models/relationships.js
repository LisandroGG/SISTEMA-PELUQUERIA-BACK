import { Service } from "./services.js";
import { Worker } from "./workers.js";

Service.belongsToMany(Worker, { through: "ServiceWorker" });
Worker.belongsToMany(Service, { through: "ServiceWorker" });
