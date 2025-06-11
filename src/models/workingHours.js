import { DataTypes } from "sequelize";
import { sequelize } from "../database/database.js";

export const WorkingHour = sequelize.define(
	"WorkingHour",
	{
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		dayOfWeek: {
			type: DataTypes.STRING,
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
	},
	{
		timestamps: false,
	},
);
