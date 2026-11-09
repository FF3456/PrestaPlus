import mongoose from 'mongoose';
import { LOAN_STATUS } from '../constants/index.js';

const { Schema } = mongoose;

const loanSchema = new Schema(
  {
    contractNumber: { type: String, required: true, unique: true },
    client: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    collateral: { type: Schema.Types.ObjectId, ref: 'Collateral', required: true },
    request: { type: Schema.Types.ObjectId, ref: 'LoanRequest', required: true },
    principal: { type: Number, required: true, min: 1 }, // capital original
    outstandingPrincipal: { type: Number, required: true, min: 0 }, // saldo de capital
    monthlyRate: { type: Number, required: true, min: 0 }, // % mensual pactado
    termDays: { type: Number, required: true, min: 1 },
    startDate: { type: Date, required: true },
    dueDate: { type: Date, required: true },
    interestPaidUntil: { type: Date, required: true },
    status: { type: String, enum: Object.values(LOAN_STATUS), default: LOAN_STATUS.ACTIVE },
    rescuedAt: Date,
    dueSoonNotifiedAt: Date,
    // RF-008: contrato digital inmutable generado al aprobar
    contract: {
      generatedAt: { type: Date, required: true },
      clauses: { type: [String], default: [] },
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = String(ret._id);
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  },
);

loanSchema.index({ client: 1, status: 1 });
loanSchema.index({ status: 1, dueDate: 1 }); // vencimientos (RF-011)
loanSchema.index({ collateral: 1 });

export default mongoose.model('Loan', loanSchema);
