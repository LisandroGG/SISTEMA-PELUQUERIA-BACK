import pkg from "whatsapp-web.js";
import QRCode from "qrcode";

const { Client, LocalAuth } = pkg;

const whatsappStatus = {
	qrCode: null,
	qrBase64: null,
	isReady: false,
};

const whatsapp = new Client({
	authStrategy: new LocalAuth({
		clientId: "user",
		dataPath: "./session",
	}),
	puppeteer: {
		args: ["--no-sandbox", "--disable-setuid-sandbox"],
	},
});

whatsapp.on("qr", async(qr) => {
	whatsappStatus.qrCode = qr;
	whatsappStatus.isReady = false;
	
	try {
    whatsappStatus.qrBase64 = await QRCode.toDataURL(qr);
	console.log("Qr generado")
	} catch (err) {
    console.error("Error generando Base64 del QR:", err);
    whatsappStatus.qrBase64 = null;
	}
});

whatsapp.on("ready", () => {
	whatsappStatus.qrCode = null;
	whatsappStatus.qrBase64 = null;
	whatsappStatus.isReady = true;
	console.log("Usuario conectado")
});

whatsapp.on("disconnected", () => {
	whatsappStatus.isReady = false;
	console.log("Usuario desconectado")
})

export { whatsapp, whatsappStatus };
