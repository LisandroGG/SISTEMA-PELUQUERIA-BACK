import dotenv from "dotenv";
import pg from "pg";
import { Sequelize } from "sequelize";

dotenv.config();

const { DB_NAME, DB_HOST, DB_PASSWORD, DB_USER, DB_URL, API_STATUS } =
	process.env;

export const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
	host: DB_HOST,
	dialect: "postgres",
	protocol: "postgres",
	dialectModule: pg,
	logging: console.log,
	dialectOptions:
		API_STATUS === "production"
			? {
					ssl: {
						require: true,
						rejectUnauthorized: false,
					},
				}
			: {},
});

try {
	await sequelize.authenticate();
	console.log("✅ DB CONNECT");

	console.log("⏳ SYNC MODELS");
	await sequelize.sync({ alter: false });
	console.log("✅ MODELS CONNECT");
} catch (error) {
	console.log("❌ DB CONNECT ERRO", error);
}
