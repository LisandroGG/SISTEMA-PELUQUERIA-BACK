import { format } from "date-fns";
import { es } from "date-fns/locale";

export const formatDateToLongSpanish = (date) => {
	return format(new Date(date), "d 'de' MMMM 'de' yyyy", { locale: es });
};

export const formatTimeToHHMM = (timeString) => {
	return timeString.slice(0, 5);
};
