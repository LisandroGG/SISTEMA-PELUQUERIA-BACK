import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";

const { MAILER_USER, MAILER_HOST, MAILER_PORT, MAILER_PASSWORD } = process.env;

export const transporter = nodemailer.createTransport({
	host: `${MAILER_HOST}`,
	port: `${MAILER_PORT}`,
	secure: "true",
	auth: {
		user: `${MAILER_USER}`,
		pass: `${MAILER_PASSWORD}`,
	},
});

export const sendRegisterUser = async (name, email) => {
	try {
		await transporter.sendMail({
			from: `${MAILER_USER}`,
			to: `${email}`,
			subject: "Registro en AF Peluquería",
			html: `
                <h2>Hola ${name}, gracias por registrarte en AF Peluquería</h2>
                <a href="${process.env.LOCALHOST}/login">Inicia sesion</a>
            `,
		});
		return true;
	} catch (error) {
		console.error(error);
		return false;
	}
};

export const sendForgotPassword = async (user, email) => {
	const token = jwt.sign({ userId: user.userId }, process.env.JWT_SECRET_KEY, {
		expiresIn: "15m",
	});

	try {
		await transporter.sendMail({
			from: `${MAILER_USER}`,
			to: `${email}`,
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
			from: `${MAILER_USER}`,
			to: `${user.email}`,
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
