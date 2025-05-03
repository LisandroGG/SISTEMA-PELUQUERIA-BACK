import { DataTypes } from "sequelize";
import { sequelize } from "../database/database.js";

export const DisableDay = sequelize.define(
	"DisableDay",
	{
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		day: {
			type: DataTypes.DATEONLY,
			allowNull: false,
		},
	},
	{
		timestamps: false,
	},
);
