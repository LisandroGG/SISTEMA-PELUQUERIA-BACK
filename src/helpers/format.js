import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

export const formatDateToLongSpanish = (date) => {
	return format(parseISO(date), "d 'de' MMMM 'de' yyyy", { locale: es});
};

export const formatTimeToHHMM = (timeString) => {
	return timeString.slice(0, 5);
};

export const formatPhoneNumber = (rawNumber) => {
	let number = rawNumber.toString();

	number = number.replace(/\D/g, "");

	return `54${number}`;
};
