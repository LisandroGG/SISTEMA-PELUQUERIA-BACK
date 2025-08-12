import qrcode from "qrcode-terminal";
import pkg from "whatsapp-web.js";

const { Client, LocalAuth } = pkg;

const whatsapp = new Client({
	authStrategy: new LocalAuth({
		clientId: "user",
		dataPath: "./session",
	}),
	puppeteer: {
		args: ["--no-sandbox", "--disable-setuid-sandbox"],
	},
});

whatsapp.on("qr", (qr) => {
	qrcode.generate(qr, {
		small: true,
	});
});

whatsapp.on("ready", () => {
	console.log("Usuario listo");
});

export default whatsapp;
