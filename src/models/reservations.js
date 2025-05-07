import { DataTypes } from "sequelize";
import { sequelize } from "../database/database.js";

export const Reservation = sequelize.define(
	"Reservation",
	{
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		date: {
			type: DataTypes.DATEONLY,
			allowNull: false,
		},
		startTime: {
			type: DataTypes.TIME,
			allowNull: false,
		},
		endTime: {
			type: DataTypes.TIME,
			allowNull: false,
		},
		clientName: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		clientGmail: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		clientPhoneNumber: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		status: {
			type: DataTypes.ENUM("confirm", "cancel", "finish"),
			defaultValue: "confirm",
		},
		reminderSent: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
		},
	},
	{
		timestamps: false,
	},
);
