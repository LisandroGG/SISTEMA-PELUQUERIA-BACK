import { DataTypes } from "sequelize";
import { sequelize } from "../database/database.js";

export const CustomWorkingHour = sequelize.define(
	"CustomWorkingHour",
	{
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		dayOfWeek: {
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
	},
	{
		timestamps: false,
	},
);
