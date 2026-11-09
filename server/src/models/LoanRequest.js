import mongoose from 'mongoose';
import { REQUEST_STATUS, MIN_TERM_DAYS, MAX_TERM_DAYS, DEFAULT_TERM_DAYS } from '../constants/index.js';

const { Schema } = mongoose;

const loanRequestSchema = new Schema(
  {
    client: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    collateral: { type: Schema.Types.ObjectId, ref: 'Collateral', required: true },
    requestedAmount: { type: Number, required: true, min: [1, 'El monto solicitado debe ser mayor a 0'] },
    termDays: { type: Number, min: MIN_TERM_DAYS, max: MAX_TERM_DAYS, default: DEFAULT_TERM_DAYS },
    status: { type: String, enum: Object.values(REQUEST_STATUS), default: REQUEST_STATUS.IN_EVALUATION },
    preEvaluation: {
      estimatedValue: Number,
      estimatedLoan: Number,
      monthlyRate: Number,
    },
    appraisal: {
      marketValue: { type: Number, min: 0 },
      maxLoan: { type: Number, min: 0 },
      monthlyRate: { type: Number, min: 0 },
      appraisedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      appraisedAt: Date,
    },
    approvedAmount: { type: Number, min: 0 },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: Date,
    rejectionReason: { type: String, trim: true, maxlength: 300 },
    loan: { type: Schema.Types.ObjectId, ref: 'Loan' },
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

loanRequestSchema.index({ client: 1, createdAt: -1 });
loanRequestSchema.index({ status: 1, createdAt: -1 });
loanRequestSchema.index({ collateral: 1 }, { unique: true }); // una garantía = una solicitud

export default mongoose.model('LoanRequest', loanRequestSchema);
