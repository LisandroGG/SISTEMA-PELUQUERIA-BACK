import { whatsappStatus } from "../whatsapp/index.js"

export const getWhatsappStatus = async (req, res) => {
    if (whatsappStatus.isReady) {
        return res.send(`
            <html>
                <body>
                    <h1>WhatsApp conectado ✅</h1>
                </body>
            </html>
        `);
    }

    if (whatsappStatus.qrBase64) {
        return res.send(`
            <html>
                <body style="text-align:center; font-family:sans-serif;">
                    <h1>Escaneá este QR con WhatsApp</h1>
                    <img src="${whatsappStatus.qrBase64}" alt="QR WhatsApp" />
                </body>
            </html>
        `);
    }

    return res.send(`
        <html>
            <body>
                <h1>Esperando QR...</h1>
            </body>
        </html>
    `);
};