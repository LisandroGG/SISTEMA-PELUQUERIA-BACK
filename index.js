import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { sequelize } from "./src/database/database.js";
import { mainRouter } from "./src/routes/index.js";

dotenv.config();

const { PORT, LOCALHOST } = process.env;

const app = express();

app.use(cookieParser());

app.use(
	cors({
		origin: LOCALHOST,
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

		app.listen(PORT, () => {
			console.log(`🚀 Server is listening on port ${PORT}`);
		});
	} catch (error) {
		console.log("❌ Connection failed", error.message);
	}
}

main();

export default app;
