/**
 * Datos de demostración (solo desarrollo). Idempotente: no duplica lo existente.
 * Uso: npm run seed
 * Crea: 1 admin, 1 empleado, 1 cliente verificado, 1 préstamo activo y 1 solicitud en evaluación.
 */
import { assertEnv } from '../src/config/env.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import User from '../src/models/User.js';
import Collateral from '../src/models/Collateral.js';
import LoanRequest from '../src/models/LoanRequest.js';
import Loan from '../src/models/Loan.js';
import { appraise, preEvaluate } from '../src/utils/loanCalculator.js';
import { approveRequest } from '../src/services/loanService.js';
import { COLLATERAL_STATUS, ROLES } from '../src/constants/index.js';

assertEnv();
await connectDB();

async function ensureUser(data, password) {
  let user = await User.findOne({ email: data.email });
  if (!user) {
    user = await User.create({ ...data, password, isVerified: true });
    console.log(`  + usuario ${data.role}: ${data.email}`);
  }
  return user;
}

const admin = await ensureUser(
  { firstName: 'Ana', lastName: 'Administradora', email: 'admin@prestamas.test', role: ROLES.ADMIN },
  process.env.SEED_ADMIN_PASSWORD || 'Admin#2026',
);
const staff = await ensureUser(
  { firstName: 'Eduardo', lastName: 'Tasador', email: 'empleado@prestamas.test', role: ROLES.EMPLOYEE },
  process.env.SEED_STAFF_PASSWORD || 'Empleado#2026',
);
const client = await ensureUser(
  { firstName: 'Carlos', lastName: 'Mendoza', email: 'cliente@prestamas.test', role: ROLES.CLIENT, documentId: '7654321', phone: '+591 70012345', address: 'Av. Blanco Galindo km 5, Cochabamba' },
  process.env.SEED_CLIENT_PASSWORD || 'Cliente#2026',
);

const photo = [{ url: '/uploads/placeholder.svg', filename: 'placeholder.svg' }];

async function ensureCollateral(data) {
  let c = await Collateral.findOne({ serialNumber: data.serialNumber.toUpperCase() });
  if (!c) {
    const est = preEvaluate(data);
    c = await Collateral.create({ ...data, owner: client._id, photos: photo, estimatedValue: est.estimatedValue });
    console.log(`  + garantía ${data.brand} ${data.model}`);
  }
  return c;
}

// 1) Préstamo activo (laptop) aprobado por el empleado
const laptop = await ensureCollateral({
  category: 'electronica', brand: 'Lenovo', model: 'ThinkPad T14', serialNumber: 'PF3XK92L', condition: 'bueno', declaredValue: 5200, description: 'Laptop con cargador original.',
});
if (!(await LoanRequest.exists({ collateral: laptop._id }))) {
  const est = preEvaluate(laptop);
  const request = await LoanRequest.create({
    client: client._id, collateral: laptop._id, requestedAmount: 1500, termDays: 30,
    status: 'en_evaluacion',
    preEvaluation: { estimatedValue: est.estimatedValue, estimatedLoan: est.estimatedLoan, monthlyRate: est.monthlyRate },
  });
  laptop.status = COLLATERAL_STATUS.IN_EVALUATION;
  await laptop.save();
  request.appraisal = { ...appraise({ category: laptop.category, marketValue: 4300 }), appraisedBy: staff._id, appraisedAt: new Date() };
  await request.save();
  await approveRequest({ request, collateral: laptop, client, employee: staff, approvedAmount: 1500, termDays: 30, custodyLocation: 'Bóveda A-03' });
  console.log('  + préstamo activo (Lenovo ThinkPad T14)');
}

// 2) Solicitud pendiente de evaluación (anillo de oro)
const ring = await ensureCollateral({
  category: 'joyas', brand: 'Oro 18K', model: 'Anillo solitario', serialNumber: 'JOY-0045', condition: 'excelente', declaredValue: 2400, description: 'Anillo de oro 18K, 6 g.',
});
if (!(await LoanRequest.exists({ collateral: ring._id }))) {
  const est = preEvaluate(ring);
  await LoanRequest.create({
    client: client._id, collateral: ring._id, requestedAmount: 800, termDays: 30,
    preEvaluation: { estimatedValue: est.estimatedValue, estimatedLoan: est.estimatedLoan, monthlyRate: est.monthlyRate },
  });
  ring.status = COLLATERAL_STATUS.IN_EVALUATION;
  await ring.save();
  console.log('  + solicitud en evaluación (anillo)');
}

console.log(`\nSeed completo. Préstamos en BD: ${await Loan.countDocuments()}  ·  Cuentas demo:`);
console.log('  admin@prestamas.test · empleado@prestamas.test · cliente@prestamas.test (contraseñas en .env / valores por defecto del README)');
void admin;
await disconnectDB();
