import jwt from "jsonwebtoken";
import {
	sendChangePassword,
	sendForgotPassword,
	sendRegisterUser,
} from "../config/mailer.js";
import { comparePassword, hashPassword } from "../helpers/password.js";
import { User } from "../models/users.js";

const regexEmail = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
const regexPassword =
	/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,20}$/;
const regexPhone = /^\d{10}$/;

const isProduction = process.env.API_STATUS === "production";

export const registerUser = async (req, res) => {
	const { name, gmail, phoneNumber, password } = req.body;

	try {
		if (!name || !gmail || !phoneNumber || !password) {
			return res
				.status(400)
				.json({ message: "Todos los campos son obligatorios" });
		}
		if (!regexEmail.test(gmail)) {
			return res
				.status(400)
				.json({ message: "El correo electrónico debe ser un Gmail válido." });
		}
		if (!regexPhone.test(phoneNumber)) {
			return res.status(400).json({
				message:
					"El número de teléfono no es válido. Debe tener 10 dígitos. Ej: 3472620188",
			});
		}
		if (!regexPassword.test(password)) {
			return res.status(400).json({
				message:
					"La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial.",
			});
		}

		const user = await User.findOne({ where: { gmail } });

		if (user) {
			return res.status(400).json({ message: "Este gmail ya esta registrado" });
		}

		const newUser = await User.create({
			name,
			gmail,
			phoneNumber,
			password,
			role: "user",
		});

		// const sentMail = await sendRegisterUser(name, gmail);
		// if (sentMail === false) {
		// 	return res.status(400).json({ message: "Error enviar el correo" });
		// }

		return res.status(201).json({
			message: "Cuenta creada exitosamente!",
			user: {
				id: newUser.id,
				name: newUser.name,
				gmail: newUser.gmail,
				phoneNumber: newUser.phoneNumber,
				role: newUser.role,
			},
		});
	} catch (error) {
		console.log("Error al crear cuenta, intenta nuevamente");
		res
			.status(404)
			.json({ message: "Error al crear cuenta, intenta nuevamente" });
	}
};

export const loginUser = async (req, res) => {
	const { gmail, password } = req.body;

	try {
		const user = await User.findOne({ where: { gmail } });
		if (!user) {
			return res.status(401).json({ message: "Usuario no encontrado" });
		}

		const validPassword = await comparePassword(password, user.password);
		if (!validPassword) {
			return res.status(401).json({ message: "Contraseña incorrecta" });
		}

		const payload = {
			id: user.id,
			role: user.role,
			gmail: user.gmail,
		};

		const access_token = jwt.sign(payload, process.env.JWT_SECRET_KEY, {
			expiresIn: "2h",
		});
		const refresh_token = jwt.sign(
			payload,
			process.env.JWT_REFRESH_SECRET_KEY,
			{ expiresIn: "30d" },
		);

		res.cookie("token", access_token, {
			httpOnly: true,
			sameSite: isProduction ? "none" : "lax",
			secure: isProduction,
			maxAge: 2 * 60 * 60 * 1000,
		});

		res.cookie("refreshToken", refresh_token, {
			httpOnly: true,
			sameSite: isProduction ? "none" : "lax",
			secure: isProduction,
			maxAge: 30 * 24 * 60 * 60 * 1000,
		});

		return res.status(200).json({
			message: "Inicio de sesion exitoso!",
			token: access_token,
			user: {
				id: user.id,
				name: user.name,
				gmail: user.gmail,
				phoneNumber: user.phoneNumber,
				role: user.role,
			},
		});
	} catch (error) {
		console.error("Error al iniciar sesion, intenta nuevamente", error);
		return res
			.status(500)
			.json({ message: "Error al iniciar sesion, intenta nuevamente" });
	}
};

export const refreshAccessToken = async (req, res) => {
	const refreshToken = req.cookies.refreshToken;

	if (!refreshToken) {
		return res.status(401).json({ message: "Refresh token no encontrado" });
	}

	try {
		const decoded = jwt.verify(
			refreshToken,
			process.env.JWT_REFRESH_SECRET_KEY,
		);

		const newAccessToken = jwt.sign(
			{
				id: decoded.id,
				gmail: decoded.gmail,
				role: decoded.role,
			},
			process.env.JWT_SECRET_KEY,
			{
				expiresIn: "2h",
			},
		);

		res.cookie("token", newAccessToken, {
			httpOnly: true,
			sameSite: isProduction ? "none" : "lax",
			secure: isProduction,
			maxAge: 2 * 60 * 60 * 1000,
		});

		return res.status(200).json({ token: newAccessToken });
	} catch (error) {
		return res
			.status(403)
			.json({ message: "Refresh token inválido o expirado" });
	}
};

export const logoutUser = async (req, res) => {
	try {
		res.clearCookie("token", {
			httpOnly: true,
			sameSite: isProduction ? "none" : "lax",
			secure: isProduction,
		});
		res.clearCookie("refreshToken", {
			httpOnly: true,
			sameSite: isProduction ? "none" : "lax",
			secure: isProduction,
		});
		res.status(200).json({ message: "Sesion cerrada exitosamente" });
	} catch (error) {
		console.error("Error en logout:", error);
		res.status(500).json({ message: "Error interno del servidor" });
	}
};

export const forgotPassword = async (req, res) => {
	const { gmail } = req.body;

	if (!regexEmail.test(gmail)) {
		return res
			.status(400)
			.json({ message: "El correo electrónico debe ser un Gmail válido." });
	}

	try {
		const user = await User.findOne({ where: { gmail } });
		if (!user)
			return res.status(404).json({ message: "Usuario no encontrado" });

		// const sentEmail = await sendForgotPassword(user, gmail);

		if (sentEmail === false) {
			return res
				.status(400)
				.json({ message: "Error enviar el correo de recuperacion" });
		}

		return res
			.status(200)
			.json({ message: "Se envio un correo de restablecer contraseña" });
	} catch (error) {
		console.log(error);
		res
			.status(500)
			.json({ message: "Error al enviar correo de recuperacion(server)" });
	}
};

export const changePassword = async (req, res) => {
	const { token } = req.query;
	const { newPassword } = req.body;

	if (!newPassword) {
		return res
			.status(400)
			.json({ message: "Ingrese una contraseña para cambiar" });
	}

	if (!regexPassword.test(newPassword)) {
		return res.status(400).json({
			message:
				"La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial.",
		});
	}

	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
		const user = await User.findByPk(decoded.id);
		if (!user)
			return res.status(404).json({ message: "Usuario no encontrado" });

		user.password = await hashPassword(newPassword);

		await user.save();

		// const sentEmail = await sendChangePassword(user);

		// if (sentEmail === false) {
		// 	return res
		// 		.status(400)
		// 		.json({ message: "Error enviar el correo de actualizacion" });
		// }

		return res
			.status(200)
			.json({ message: "Contraseña actualizada correctamente" });
	} catch (error) {
		return res
			.status(400)
			.json({ message: "Link expirado, por favor genere otro" });
	}
};

export const getMe = async (req, res) => {
	const token = req.cookies.token;
	if (!token) return res.status(401).json({ message: "No autenticado" });

	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
		const user = await User.findByPk(decoded.id);
		if (!user)
			return res.status(404).json({ message: "Usuario no encontrado" });

		return res.status(200).json({
			user: {
				id: user.id,
				name: user.name,
				gmail: user.gmail,
				phoneNumber: user.phoneNumber,
				role: user.role,
			},
		});
	} catch (error) {
		return res.status(401).json({ message: "Token expirado o inválido" });
	}
};
