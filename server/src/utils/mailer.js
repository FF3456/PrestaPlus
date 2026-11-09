import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

const transporter = env.smtp.host
  ? nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.secure,
      auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.pass } : undefined,
    })
  : null;

/** Envía un correo; sin SMTP configurado lo imprime en consola (modo desarrollo). */
export async function sendMail({ to, subject, text }) {
  if (!transporter) {
    console.log(`\n[MAIL simulado] Para: ${to}\nAsunto: ${subject}\n${text}\n`);
    return;
  }
  await transporter.sendMail({ from: env.smtp.from, to, subject, text });
}
