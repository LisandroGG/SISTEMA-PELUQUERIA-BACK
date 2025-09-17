import jwt from "jsonwebtoken";
import mjml2html from "mjml";
import nodemailer from "nodemailer";

const {
	MAILER_USER,
	MAILER_HOST,
	MAILER_PORT,
	MAILER_PASSWORD,
	MAILER_BARBER_NAME,
	LOCALHOST,
	DEPLOY,
	API_STATUS,
} = process.env;

const BASE_URL = API_STATUS === "production" ? DEPLOY : LOCALHOST;

export const transporter = nodemailer.createTransport({
	host: MAILER_HOST,
	port: Number(MAILER_PORT),
	secure: Number(MAILER_PORT) === 465,
	auth: {
		user: MAILER_USER,
		pass: MAILER_PASSWORD,
	},
});

// --- PLANTILLAS MJML ---

const baseStyles = `
  <mj-style>
    a.button {
      background-color: oklch(21.274% 0.0025 247.94);
      color: white !important;
      padding: 12px 25px;
      border-radius: 6px;
      text-decoration: none;
      font-weight: bold;
      display: inline-block;
    }
  </mj-style>
`;

const getRegisterMJML = (name) => `
<mjml>
  <mj-head>${baseStyles}</mj-head>
  <mj-body background-color="#ededed">
    <mj-wrapper padding="40px 0">
      <mj-section background-color="#ffffff" padding="30px">
        <mj-column>
          <mj-image width="150px" src="https://i.imgur.com/abV2347.png" alt="${MAILER_BARBER_NAME}" border-radius="50%" />
          <mj-text font-size="18px" color="#000000" font-family="Helvetica, Arial, sans-serif" padding="20px 0 30px 0" align="center">
            ¡Hola ${name}, gracias por registrarte en ${MAILER_BARBER_NAME}!
          </mj-text>
          <mj-button href="${BASE_URL}/" css-class="button" align="center">
            Ir a la pagina
          </mj-button>
        </mj-column>
      </mj-section>
    </mj-wrapper>
  </mj-body>
</mjml>
`;

const getForgotPasswordMJML = (user, token) => `
<mjml>
  <mj-head>${baseStyles}</mj-head>
  <mj-body background-color="#ededed">
    <mj-wrapper padding="40px 0">
      <mj-section background-color="#ffffff" padding="30px">
        <mj-column>
          <mj-image width="150px" src="https://i.imgur.com/abV2347.png" alt="${MAILER_BARBER_NAME}" border-radius="50%" />
          <mj-text font-size="18px" color="#000000" font-family="Helvetica, Arial, sans-serif" padding="20px 0 10px 0" align="center">
            Hola ${user.name},
          </mj-text>
          <mj-text font-size="16px" color="#000000" font-family="Helvetica, Arial, sans-serif" padding="0 0 20px 0" align="center">
            Haz solicitado cambiar tu contraseña. Haz clic en el botón de abajo para continuar. Este enlace expirará en 15 minutos.
          </mj-text>
          <mj-button href="${BASE_URL}/changePassword?token=${token}" css-class="button" align="center">
            Cambiar contraseña
          </mj-button>
          <mj-text font-size="12px" color="#666666" font-family="Helvetica, Arial, sans-serif" padding="20px 0 0 0" align="center">
            Si no solicitaste este cambio, ignora este correo.
          </mj-text>
        </mj-column>
      </mj-section>
    </mj-wrapper>
  </mj-body>
</mjml>
`;

const getChangePasswordMJML = (user) => `
<mjml>
  <mj-head>${baseStyles}</mj-head>
  <mj-body background-color="#ededed">
    <mj-wrapper padding="40px 0">
      <mj-section background-color="#ffffff" padding="30px">
        <mj-column>
          <mj-image width="150px" src="https://i.imgur.com/abV2347.png" alt="${MAILER_BARBER_NAME}" border-radius="50%" />
          <mj-text font-size="18px" color="#000000" font-family="Helvetica, Arial, sans-serif" padding="20px 0 10px 0" align="center">
            ¡Hola ${user.name}!
          </mj-text>
          <mj-text font-size="16px" color="#000000" font-family="Helvetica, Arial, sans-serif" padding="0 0 20px 0" align="center">
            Tu contraseña ha sido actualizada correctamente.
          </mj-text>
          <mj-button href="${BASE_URL}/login" css-class="button" align="center">
            Iniciar sesión
          </mj-button>
        </mj-column>
      </mj-section>
    </mj-wrapper>
  </mj-body>
</mjml>
`;

const getNewReservationMJML = ({
	name,
	service,
	date,
	time,
	worker,
	token,
}) => `
<mjml>
  <mj-head>
  	${baseStyles}
    <mj-style>
      ul {
        padding-left: 1em;
        margin: 0;
        list-style: none;
      }
      li {
        margin-bottom: 8px;
        font-size: 14px;
      }
      a.button {
        background-color: oklch(21.274% 0.0025 247.94);
        color: white !important;
        padding: 12px 25px;
        border-radius: 6px;
        text-decoration: none;
        font-weight: bold;
        display: inline-block;
      }
    </mj-style>
  </mj-head>
  <mj-body background-color="#ededed">
    <mj-wrapper padding="40px 0">
      <mj-section background-color="#ffffff" padding="30px">
        <mj-column>
          <mj-image width="150px" src="https://i.imgur.com/abV2347.png" alt="${MAILER_BARBER_NAME}" border-radius="50%" />
          <mj-text font-size="18px" color="#000000" font-family="Helvetica, Arial, sans-serif" padding="20px 0" align="center">
            Hola ${name},
          </mj-text>
          <mj-text font-size="16px" color="#000000" font-family="Helvetica, Arial, sans-serif" padding="0 0 20px 0" align="center">
            Has reservado un nuevo turno:
          </mj-text>
          <mj-text font-size="14px" color="#000000" font-family="Helvetica, Arial, sans-serif" padding="0 0 10px 0" align="center">
  <ul style="list-style-type:none; padding-left:0; margin-left:0; text-align:left;">
    <li style="margin-bottom:8px; padding-left:0;">✂️ <b>Servicio:</b> ${service}</li>
    <li style="margin-bottom:8px; padding-left:0;">💇‍♂️ <b>Profesional:</b> ${worker}</li>
    <li style="margin-bottom:8px; padding-left:0;">📅 <b>Fecha:</b> ${date}</li>
    <li style="margin-bottom:8px; padding-left:0;">🕛 <b>Hora:</b> ${time}</li>
  </ul>
</mj-text>
          <mj-button href="${BASE_URL}/cancel?token=${token}" css-class="button" align="center">
            Cancelar turno
          </mj-button>
        </mj-column>
      </mj-section>
    </mj-wrapper>
  </mj-body>
</mjml>
`;

const getCancelReservationMJML = ({ name, service, date, time, worker }) => `
<mjml>
  <mj-head>
    ${baseStyles}
    <mj-style>
      ul {
        padding-left: 1em;
        margin: 0;
        list-style: none;
      }
      li {
        margin-bottom: 8px;
        font-size: 14px;
      }
      a.button {
        background-color: oklch(21.274% 0.0025 247.94);
        color: white !important;
        padding: 12px 25px;
        border-radius: 6px;
        text-decoration: none;
        font-weight: bold;
        display: inline-block;
      }
    </mj-style>
  </mj-head>
  <mj-body background-color="#ededed">
    <mj-wrapper padding="40px 0">
      <mj-section background-color="#ffffff" padding="30px">
        <mj-column>
          <mj-image width="150px" src="https://i.imgur.com/abV2347.png" alt="${MAILER_BARBER_NAME}" border-radius="50%" />
          <mj-text font-size="18px" color="#000000" font-family="Helvetica, Arial, sans-serif" padding="20px 0" align="center">
            Hola ${name},
          </mj-text>
          <mj-text font-size="16px" color="#000000" font-family="Helvetica, Arial, sans-serif" padding="0 0 20px 0" align="center">
            Has cancelado tu turno:
          </mj-text>
          <mj-text font-size="14px" color="#000000" font-family="Helvetica, Arial, sans-serif" padding="0 0 10px 0" align="center">
  <ul style="list-style-type:none; padding-left:0; margin-left:0; text-align:left;">
    <li style="margin-bottom:8px; padding-left:0;">✂️ <b>Servicio:</b> ${service}</li>
    <li style="margin-bottom:8px; padding-left:0;">💇‍♂️ <b>Profesional:</b> ${worker}</li>
    <li style="margin-bottom:8px; padding-left:0;">📅 <b>Fecha:</b> ${date}</li>
    <li style="margin-bottom:8px; padding-left:0;">🕛 <b>Hora:</b> ${time}</li>
  </ul>
</mj-text>
        </mj-column>
      </mj-section>
    </mj-wrapper>
  </mj-body>
</mjml>
`;

const getReminderMJML = ({ name, service, date, time, worker }) => `
<mjml>
  <mj-head>${baseStyles}</mj-head>
  <mj-body background-color="#ededed">
    <mj-wrapper padding="40px 0">
      <mj-section background-color="#ffffff" padding="30px">
        <mj-column>
          <mj-image width="150px" src="https://i.imgur.com/abV2347.png" alt="${MAILER_BARBER_NAME}" border-radius="50%" />
          <mj-text font-size="18px" color="#000000" font-family="Helvetica, Arial, sans-serif" padding="20px 0" align="center">
            Hola ${name},
          </mj-text>
          <mj-text font-size="16px" color="#000000" font-family="Helvetica, Arial, sans-serif" padding="0 0 20px 0" align="center">
            Este es un recordatorio de tu turno:
          </mj-text>
          <mj-text font-size="14px" color="#000000" font-family="Helvetica, Arial, sans-serif" padding="0 0 10px 0" align="center">
  <ul style="list-style-type:none; padding-left:0; margin-left:0; text-align:left;">
    <li style="margin-bottom:8px; padding-left:0;">✂️ <b>Servicio:</b> ${service}</li>
    <li style="margin-bottom:8px; padding-left:0;">💇‍♂️ <b>Profesional:</b> ${worker}</li>
    <li style="margin-bottom:8px; padding-left:0;">📅 <b>Fecha:</b> ${date}</li>
    <li style="margin-bottom:8px; padding-left:0;">🕛 <b>Hora:</b> ${time}</li>
  </ul>
</mj-text>
          <mj-text font-size="16px" color="#000000" font-family="Helvetica, Arial, sans-serif" padding="10px 0 0 0" align="center">
            ¡Te esperamos!
          </mj-text>
        </mj-column>
      </mj-section>
    </mj-wrapper>
  </mj-body>
</mjml>
`;

// --- FUNCIONES DE ENVÍO ---

export const sendRegisterUser = async (name, gmail) => {
	const mjmlTemplate = getRegisterMJML(name);
	const { html, errors } = mjml2html(mjmlTemplate);
	if (errors?.length) console.error("MJML·errors:", errors);

	try {
		await transporter.sendMail({
			from: `"${MAILER_BARBER_NAME}" <${MAILER_USER}>`,
			to: gmail,
			subject: `Registro en ${MAILER_BARBER_NAME}`,
			html,
		});
		return true;
	} catch (error) {
		console.error(error);
		return false;
	}
};

export const sendForgotPassword = async (user, gmail) => {
	const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET_KEY, {
		expiresIn: "15m",
	});

	const mjmlTemplate = getForgotPasswordMJML(user, token);
	const { html, errors } = mjml2html(mjmlTemplate);
	if (errors?.length) console.error("MJML·errors:", errors);

	try {
		await transporter.sendMail({
			from: `"${MAILER_BARBER_NAME}" <${MAILER_USER}>`,
			to: gmail,
			subject: "Cambiar contraseña",
			html,
		});
		return true;
	} catch (error) {
		console.error(error);
		return false;
	}
};

export const sendChangePassword = async (user) => {
	const mjmlTemplate = getChangePasswordMJML(user);
	const { html, errors } = mjml2html(mjmlTemplate);
	if (errors?.length) console.error("MJML·errors:", errors);

	try {
		await transporter.sendMail({
			from: `"${MAILER_BARBER_NAME}" <${MAILER_USER}>`,
			to: user.gmail,
			subject: "Actualización de contraseña",
			html,
		});
		return true;
	} catch (error) {
		console.error(error);
		return false;
	}
};

export const sendNewReservation = async (data) => {
	const mjmlTemplate = getNewReservationMJML(data);
	const { html, errors } = mjml2html(mjmlTemplate);
	if (errors?.length) console.error("MJML·errors:", errors);

	try {
		const info = await transporter.sendMail({
			from: `"${MAILER_BARBER_NAME}" <${MAILER_USER}>`,
			to: data.to,
			subject: "Reserva de turno",
			html,
		});
		console.log("📧 Nueva reserva enviada:", info.messageId);
		return true;
	} catch (error) {
		console.error(error);
		return false;
	}
};

export const sendCancelReservation = async (data) => {
	const mjmlTemplate = getCancelReservationMJML(data);
	const { html, errors } = mjml2html(mjmlTemplate);
	if (errors?.length) console.error("MJML·errors:", errors);

	try {
		const info = await transporter.sendMail({
			from: `"${MAILER_BARBER_NAME}" <${MAILER_USER}>`,
			to: data.to,
			subject: "Cancelación de turno",
			html,
		});
		console.log("📧 Cancelación enviada:", info.messageId);
		return true;
	} catch (error) {
		console.error(error);
		return false;
	}
};

export const sendGmailReminder = async (data) => {
	const mjmlTemplate = getReminderMJML(data);
	const { html, errors } = mjml2html(mjmlTemplate);
	if (errors?.length) console.error("MJML·errors:", errors);

	try {
		const info = await transporter.sendMail({
			from: `"${MAILER_BARBER_NAME}" <${MAILER_USER}>`,
			to: data.to,
			subject: "Recordatorio de tu turno",
			html,
		});
		console.log("📧 Recordatorio enviado:", info.messageId);
		return true;
	} catch (error) {
		console.error(error);
		return false;
	}
};
