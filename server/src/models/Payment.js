import mongoose from 'mongoose';
import { PAYMENT_TYPES } from '../constants/index.js';

const { Schema } = mongoose;

const paymentSchema = new Schema(
  {
    loan: { type: Schema.Types.ObjectId, ref: 'Loan', required: true },
    type: { type: String, enum: PAYMENT_TYPES, required: true },
    amount: { type: Number, required: true, min: [0.01, 'El monto debe ser mayor a 0'] },
    interestPortion: { type: Number, required: true, min: 0 },
    capitalPortion: { type: Number, required: true, min: 0 },
    balanceAfter: { type: Number, required: true, min: 0 },
    receiptNumber: { type: String, required: true, unique: true },
    registeredBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    paidAt: { type: Date, default: Date.now },
    note: { type: String, trim: true, maxlength: 200 },
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

paymentSchema.index({ loan: 1, paidAt: -1 });
paymentSchema.index({ paidAt: -1 });

export default mongoose.model('Payment', paymentSchema);
