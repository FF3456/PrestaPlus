import mongoose from 'mongoose';
import { NOTIFICATION_TYPES } from '../constants/index.js';

const { Schema } = mongoose;

const notificationSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: NOTIFICATION_TYPES, default: 'sistema' },
    title: { type: String, required: true, maxlength: 120 },
    message: { type: String, required: true, maxlength: 400 },
    read: { type: Boolean, default: false },
    loan: { type: Schema.Types.ObjectId, ref: 'Loan' },
    request: { type: Schema.Types.ObjectId, ref: 'LoanRequest' },
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

notificationSchema.index({ user: 1, read: 1, createdAt: -1 });
// Las notificaciones se eliminan automáticamente a los 180 días (índice TTL)
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 180 });

export default mongoose.model('Notification', notificationSchema);
