/**
 * Envío de emails transaccionales vía la API REST de Brevo (ex-Sendinblue).
 * Se usa fetch directo (sin SDK) para no sumar una dependencia extra, igual
 * que translate.js y revalidate.js.
 *
 * Usa la plantilla de Brevo (Campañas > Plantillas > Email > "inscripcion")
 * en vez de armar el HTML acá. La plantilla debe referenciar estos params
 * con la sintaxis {{ params.NOMBRE }} de Brevo: NOMBRE, EMAIL, URL.
 */

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

export async function sendRegistrationEmail({ to, nombre, registrationUrl }) {
  const apiKey = process.env.BREVO_API_KEY;
  const templateId = process.env.BREVO_TEMPLATE_ID_INSCRIPCION;
  if (!apiKey) {
    throw new Error("Brevo no está configurado (falta BREVO_API_KEY)");
  }
  if (!templateId) {
    throw new Error("Brevo no está configurado (falta BREVO_TEMPLATE_ID_INSCRIPCION)");
  }

  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  const senderName = process.env.BREVO_SENDER_NAME;

  const res = await fetch(BREVO_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      templateId: Number(templateId),
      // Si no se define remitente, Brevo usa el configurado en la propia plantilla.
      ...(senderEmail ? { sender: { name: senderName || undefined, email: senderEmail } } : {}),
      to: [{ email: to, name: nombre }],
      params: {
        NOMBRE: nombre,
        EMAIL: to,
        URL: registrationUrl,
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Brevo respondió ${res.status}: ${body}`);
  }
}
