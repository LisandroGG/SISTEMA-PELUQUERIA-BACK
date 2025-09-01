import { whatsapp } from "../whatsapp/index.js";

const { LOCALHOST, MAILER_BARBER_NAME } = process.env;

export const reservationConfirm = async ({
	name,
	phoneNumber,
	service,
	date,
	time,
	worker,
	token,
}) => {
	const tel = `+549${phoneNumber}`;
	const chatId = `${tel.substring(1)}@c.us`;
	const number_details = await whatsapp.getNumberId(chatId);
	if (number_details) {
		const message = `⏰ *RESERVA DE TURNO*

Hola *${name}*

Haz reservado un turno en *${MAILER_BARBER_NAME}*.

✂️ Servicio: *${service}*
💇‍♂️ Profesional: *${worker}*
📅 Fecha: *${date}*
🕛 Hora: *${time}*

👉 Si necesitás cancelar tu turno, hacé clic en el enlace de abajo:
${LOCALHOST}/cancel?token=${token}

Gracias por tu confianza. Por favor, avisá con anticipación si no podés asistir.

*No respondas a este mensaje directamente.*

— *AF peluquería ✂️*`;
		await whatsapp.sendMessage(chatId, message);
		console.log("Mensaje Enviado por whatsapp");
	} else {
		console.log("Error al enviar mensaje por whatsapp");
	}
};

export const reservationCancel = async ({
	name,
	phoneNumber,
	service,
	date,
	time,
	worker,
}) => {
	const tel = `+549${phoneNumber}`;
	const chatId = `${tel.substring(1)}@c.us`;
	const number_details = await whatsapp.getNumberId(chatId);
	if (number_details) {
		const message = `⏰ *CANCELACION DE TURNO*

Hola *${name}*

Haz cancelado tu turno reservado en *${MAILER_BARBER_NAME}*.

✂️ Servicio: *${service}*
💇‍♂️ Profesional: *${worker}*
📅 Fecha: *${date}*
🕛 Hora: *${time}*

*No respondas a este mensaje directamente.*

— *AF peluquería ✂️*`;
		await whatsapp.sendMessage(chatId, message);
		console.log("Mensaje Enviado por whatsapp");
	} else {
		console.log("Error al enviar mensaje por whatsapp");
	}
};

export const reservationReminder = async ({
	name,
	phoneNumber,
	service,
	date,
	time,
	worker,
}) => {
	const tel = `+549${phoneNumber}`;
	const chatId = `${tel.substring(1)}@c.us`;
	const number_details = await whatsapp.getNumberId(chatId);
	if (number_details) {
		const message = `⏰ *RECORDATORIO DE TURNO*

Hola *${name}*

Te recordamos que tenés un turno reservado en *${MAILER_BARBER_NAME}*.

✂️ Servicio: *${service}*
💇‍♂️ Profesional: *${worker}*
📅 Fecha: *${date}*
🕛 Hora: *${time}*

Gracias por tu confianza. Te esperamos!.

*No respondas a este mensaje directamente.*

— *AF peluquería ✂️*`;
		await whatsapp.sendMessage(chatId, message);
		console.log("Mensaje Enviado por whatsapp");
	} else {
		console.log("Error al enviar mensaje por whatsapp");
	}
};
