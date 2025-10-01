import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { sequelize } from "./src/database/database.js";
import { mainRouter } from "./src/routes/index.js";
import "./src/models/relationships.js";
import "./src/cron/reminder.js";
import compression from "compression";
import helmet from "helmet";
import pino from "pino";
import pinoHttp from "pino-http";

dotenv.config();

const { PORT, LOCALHOST, DEPLOY, API_STATUS } = process.env;

const app = express();

app.use(helmet());
app.use(compression());
app.use(cookieParser());

app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true, limit: "100kb" }));

const logger = pino({
	level: process.env.LOG_LEVEL || "info",
	transport:
		process.env.NODE_ENV !== "production"
			? {
					target: "pino-pretty",
					options: {
						colorize: true,
						translateTime: "yyyy-mm-dd HH:MM:ss",
						ignore: "pid,hostname",
					},
				}
			: undefined,
});

app.use(
	pinoHttp({
		logger,
		customLogLevel: (res, err) => {
			if (res.statusCode >= 500) return "error";
			if (res.statusCode >= 400) return "warn";
			return "info";
		},
		serializers: {
			req(req) {
				return {
					method: req.method,
					url: req.url,
				};
			},
			res(res) {
				return {
					statusCode: res.statusCode,
				};
			},
		},
	}),
);

const allowedOrigins = API_STATUS === "production" ? [DEPLOY] : [LOCALHOST];

app.use(
	cors({
		origin: allowedOrigins,
		credentials: true,
	}),
);

app.use(express.json());

app.use("/", mainRouter);

app.get("/health", (req, res) => {
	res.status(200).json({ status: "ok" });
});

async function main() {
	try {
		await sequelize.sync({ force: false });

		app.listen(PORT, () => {
			logger.info(`Server is listening on port ${PORT}`);
		});

		async function shutdown() {
			logger.info("Shutting down gracefully...");
			server.close(async () => {
				await sequelize.close();
				process.exit(0);
			});
		}

		process.on("SIGTERM", shutdown);
		process.on("SIGINT", shutdown);
	} catch (error) {
		logger.error("Connection failed", error.message);
	}
}

main();

export default app;
