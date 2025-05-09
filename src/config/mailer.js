import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";

const {
	MAILER_USER,
	MAILER_HOST,
	MAILER_PORT,
	MAILER_PASSWORD,
	MAILER_BARBER_NAME,
} = process.env;

export const transporter = nodemailer.createTransport({
	host: `${MAILER_HOST}`,
	port: `${MAILER_PORT}`,
	secure: "true",
	auth: {
		user: `${MAILER_USER}`,
		pass: `${MAILER_PASSWORD}`,
	},
});

export const sendRegisterUser = async (name, gmail) => {
	try {
		await transporter.sendMail({
			from: `"${MAILER_BARBER_NAME}" <${MAILER_USER}>`,
			to: `${gmail}`,
			subject: `Registro en ${MAILER_BARBER_NAME}`,
			html: `
                <h2>Hola ${name}, gracias por registrarte en ${MAILER_BARBER_NAME}</h2>
                <a href="${process.env.LOCALHOST}/login">Inicia sesion</a>
            `,
		});
		return true;
	} catch (error) {
		console.error(error);
		return false;
	}
};

export const sendForgotPassword = async (user, gmail) => {
	const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET_KEY, {
		expiresIn: "15m",
	});

	try {
		await transporter.sendMail({
			from: `"${MAILER_BARBER_NAME}" <${MAILER_USER}>`,
			to: `${gmail}`,
			subject: "Cambiar contraseña",
			html: `
                <h2>${user.name}, haz click en el siguiente enlace para cambiar tu contraseña: </h2>
                <a href="${process.env.LOCALHOST}/changePassword?token=${token}">cambiar contraseña </a>
                <h3>Ente enlace caducara en 15 minutos </h3>
            `,
		});
		return true;
	} catch (error) {
		console.error(error);
		return false;
	}
};

export const sendChangePassword = async (user) => {
	try {
		await transporter.sendMail({
			from: `"${MAILER_BARBER_NAME}" <${MAILER_USER}>`,
			to: `${user.gmail}`,
			subject: "Actualizacion de contraseña",
			html: `
                <h2>${user.name} has actualizado tu contraseña</h2>
                <a href="${process.env.LOCALHOST}/login"> Inicia Sesion </a>
            `,
		});
		return true;
	} catch (error) {
		console.error(error);
		return false;
	}
};

export const sendNewReservation = async ({
	to,
	name,
	service,
	date,
	time,
	worker,
	token,
}) => {
	const info = await transporter.sendMail({
		from: `"${MAILER_BARBER_NAME}" <${MAILER_USER}>`,
		to,
		subject: "Reserva de turno",
		html: `
				<h2>Hola ${name}</h2>
				<p>Haz reservado un nuevo turno:</p>
				<ul>
					<li><b>Servicio:</b> ${service}</li>
					<li><b>Día:</b> ${date}</li>
					<li><b>Hora:</b> ${time}</li>
					<li><b>Con:</b> ${worker}</li>
				</ul>
				<p>Para cancelarlo haz click en el boton:</p>
				<a href="${process.env.LOCALHOST}/cancel?token=${token}">Cancelar turno </a>
			`,
	});
	console.log("📧 Nueva reserva enviada:", info.messageId);
};

export const sendCancelReservation = async ({
	to,
	name,
	service,
	date,
	time,
	worker,
}) => {
	const info = await transporter.sendMail({
		from: `"${MAILER_BARBER_NAME}" <${MAILER_USER}>`,
		to,
		subject: "Cancelación de turno",
		html: `
				<h2>Hola ${name}</h2>
				<p>Haz cancelado tu turno:</p>
				<ul>
					<li><b>Servicio:</b> ${service}</li>
					<li><b>Día:</b> ${date}</li>
					<li><b>Hora:</b> ${time}</li>
					<li><b>Con:</b> ${worker}</li>
				</ul>
			`,
	});
	console.log("📧 Cancelacion enviada:", info.messageId);
};

export const sendGmailReminder = async ({
	to,
	name,
	service,
	date,
	time,
	worker,
}) => {
	const info = await transporter.sendMail({
		from: `"${MAILER_BARBER_NAME}" <${MAILER_USER}>`,
		to,
		subject: "Recordatorio de tu turno",
		html: `
			<h2>Hola ${name}</h2>
			<p>Este es un recordatorio de tu turno:</p>
			<ul>
				<li><b>Servicio:</b> ${service}</li>
				<li><b>Día:</b> ${date}</li>
				<li><b>Hora:</b> ${time}</li>
				<li><b>Con:</b> ${worker}</li>
			</ul>
			<p>¡Te esperamos!</p>
		`,
	});
	console.log("📧 Recordatorio enviado: %s", info.messageId);
};
