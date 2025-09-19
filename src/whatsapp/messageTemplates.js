import axios from "axios";

const { WHATSAPP_API_URL, WHATSAPP_TOKEN, WHATSAPP_PHONE } = process.env;

export const reservationConfirm = async ({
	name,
	phoneNumber,
	service,
	worker,
	date,
	time,
	token,
}) => {
	try {
		const response = await axios.post(
			`${WHATSAPP_API_URL}/${WHATSAPP_PHONE}/messages`,
			{
				messaging_product: "whatsapp",
				to: phoneNumber,
				type: "template",
				template: {
					name: "turno_reservado",
					language: { code: "es_AR" },
					components: [
						{
							type: "body",
							parameters: [
								{ type: "text", text: name },
								{ type: "text", text: service },
								{ type: "text", text: worker },
								{ type: "text", text: date },
								{ type: "text", text: time },
							],
						},
						{
							type: "button",
							sub_type: "url",
							index: "0",
							parameters: [
								{
									type: "text",
									text: token,
								},
							],
						},
					],
				},
			},
			{
				headers: {
					Authorization: `Bearer ${WHATSAPP_TOKEN}`,
					"Content-Type": "application/json",
				},
			},
		);
		return response.data;
	} catch (error) {
		console.log(
			"Error al enviar mensaje",
			error.response?.data || error.message,
		);
	}
};

export const reservationCancel = async ({
	name,
	phoneNumber,
	service,
	worker,
	date,
	time,
}) => {
	try {
		const response = await axios.post(
			`${WHATSAPP_API_URL}/${WHATSAPP_PHONE}/messages`,
			{
				messaging_product: "whatsapp",
				to: phoneNumber,
				type: "template",
				template: {
					name: "turno_cancelado",
					language: { code: "es" },
					components: [
						{
							type: "body",
							parameters: [
								{ type: "text", text: name },
								{ type: "text", text: service },
								{ type: "text", text: worker },
								{ type: "text", text: date },
								{ type: "text", text: time },
							],
						},
					],
				},
			},
			{
				headers: {
					Authorization: `Bearer ${WHATSAPP_TOKEN}`,
					"Content-Type": "application/json",
				},
			},
		);
		return response.data;
	} catch (error) {
		console.log(
			"Error al enviar mensaje",
			error.response?.data || error.message,
		);
	}
};

export const reservationReminder = async ({
	name,
	phoneNumber,
	service,
	worker,
	date,
	time,
}) => {
	try {
		const response = await axios.post(
			`${WHATSAPP_API_URL}/${WHATSAPP_PHONE}/messages`,
			{
				messaging_product: "whatsapp",
				to: phoneNumber,
				type: "template",
				template: {
					name: "turno_recordatorio",
					language: { code: "es" },
					components: [
						{
							type: "body",
							parameters: [
								{ type: "text", text: name },
								{ type: "text", text: service },
								{ type: "text", text: worker },
								{ type: "text", text: date },
								{ type: "text", text: time },
							],
						},
					],
				},
			},
			{
				headers: {
					Authorization: `Bearer ${WHATSAPP_TOKEN}`,
					"Content-Type": "application/json",
				},
			},
		);
		return response.data;
	} catch (error) {
		console.log(
			"Error al enviar mensaje",
			error.response?.data || error.message,
		);
	}
};
