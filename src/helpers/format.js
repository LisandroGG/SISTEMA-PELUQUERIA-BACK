import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toZonedTime } from "date-fns-tz";

const timeZone = "America/Argentina/Buenos_Aires";

export const formatDateToLongSpanish = (date) => {
	const zonedDate = toZonedTime(new Date(date), timeZone);
	return format(zonedDate, "d 'de' MMMM 'de' yyyy", { locale: es });
};

export const formatTimeToHHMM = (timeString) => {
	const zonedDate = toZonedTime(new Date(`1970-01-01T${timeString}`), timeZone);
	return format(zonedDate, "HH:mm");
};
