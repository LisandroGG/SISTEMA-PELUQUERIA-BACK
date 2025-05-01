import { DataTypes } from "sequelize";
import { sequelize } from "../database/database.js";

export const Service = sequelize.define(
	"Service",
	{
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		name: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		cost: {
			type: DataTypes.FLOAT,
			allowNull: false,
		},
		duration: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
	},
	{
		timestamps: false,
	},
);
