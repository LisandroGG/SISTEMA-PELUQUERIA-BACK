import jwt from "jsonwebtoken";

export const authUser = (req, res, next) => {
	const token = req.cookies.token;

	if (!token) {
		return res
			.status(401)
			.json({ message: "Token no encontrado. Acceso denegado." });
	}

	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
		req.user = decoded;
		next();
	} catch (error) {
		return res.status(401).json({ message: "Token inválido o expirado." });
	}
};
