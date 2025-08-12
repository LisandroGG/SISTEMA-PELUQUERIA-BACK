import dotenv from "dotenv";
import pg from "pg";
import { Sequelize } from "sequelize";

dotenv.config();

const { DB_NAME, DB_HOST, DB_PASSWORD, DB_USER, DB_URL, API_STATUS } =
	process.env;

export const sequelize =
	API_STATUS === "production"
		? new Sequelize(DB_URL, {
				dialect: "postgres",
				protocol: "postgres",
				dialectModule: pg,
				logging: console.log,
				dialectOptions: {
					ssl: {
						require: true,
						rejectUnauthorized: false,
					},
				},
			})
		: new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
				host: DB_HOST,
				dialect: "postgres",
				protocol: "postgres",
				dialectModule: pg,
				logging: console.log,
				dialectOptions: {},
			});

(async () => {
	try {
		await sequelize.authenticate();
		console.log("DB CONNECT");

		console.log("SYNC MODELS");
		await sequelize.sync({ alter: false });
		console.log("MODELS CONNECT");
	} catch (error) {
		console.log("DB CONNECT ERROR", error);
	}
})();
