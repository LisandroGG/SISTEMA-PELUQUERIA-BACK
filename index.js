import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { sequelize } from "./src/database/database.js";
import { mainRouter } from "./src/routes/index.js";
import "./src/models/relationships.js";
import "./src/cron/reminder.js";
import whatsapp from "./src/whatsapp/index.js";

dotenv.config();

const { PORT, LOCALHOST, DEPLOY, API_STATUS } = process.env;

const app = express();

app.use(cookieParser());

const allowedOrigins = API_STATUS === "production" ? [DEPLOY] : [LOCALHOST];

app.use(
	cors({
		origin: (origin, callback) => {
			if (!origin) return callback(null, true);

			if (allowedOrigins.includes(origin)) {
				callback(null, true);
			} else {
				callback(new Error(`CORS policy: Origen no permitido - ${origin}`));
			}
		},
		credentials: true,
	}),
);

app.use(express.json());

app.get("/", (req, res) => {
	res.send("server Working 🚀");
});

app.use("/", mainRouter);

async function main() {
	try {
		await sequelize.sync({ force: false });

		whatsapp.initialize();

		app.listen(PORT, () => {
			console.log(`Server is listening on port ${PORT}`);
		});
	} catch (error) {
		console.log("Connection failed", error.message);
	}
}

main();

export default app;
