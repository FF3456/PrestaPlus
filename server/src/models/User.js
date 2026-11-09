import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { ROLES } from '../constants/index.js';
import { env } from '../config/env.js';
import { encryptField, decryptField } from '../utils/crypto.js';
import { EMAIL_PATTERN } from '../middlewares/validate.js';

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    firstName: { type: String, required: [true, 'El nombre es obligatorio'], trim: true, minlength: 2, maxlength: 60 },
    lastName: { type: String, required: [true, 'El apellido es obligatorio'], trim: true, minlength: 2, maxlength: 60 },
    email: {
      type: String,
      required: [true, 'El correo es obligatorio'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [EMAIL_PATTERN, 'Correo electrónico inválido'],
    },
    // Almacena el hash bcrypt (nunca texto plano). select:false evita devolverlo por defecto.
    password: { type: String, required: [true, 'La contraseña es obligatoria'], select: false },
    role: { type: String, enum: Object.values(ROLES), default: ROLES.CLIENT },
    // RNF-002: dato sensible cifrado en reposo con AES-256-GCM (setter/getter transparentes)
    documentId: { type: String, set: encryptField, get: decryptField, maxlength: 400 },
    phone: { type: String, trim: true, match: [/^[0-9+\-\s]{7,15}$/, 'Teléfono inválido'] },
    address: { type: String, trim: true, maxlength: 200 },
    isVerified: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
    lastLoginAt: Date,
    // OTP de verificación (RF-001) y token de recuperación (RF-003): solo se guardan hashes
    otpHash: { type: String, select: false },
    otpExpiresAt: { type: Date, select: false },
    otpAttempts: { type: Number, default: 0, select: false },
    resetTokenHash: { type: String, select: false },
    resetTokenExpiresAt: { type: Date, select: false },
  },
  {
    timestamps: true,
    toJSON: {
      getters: true,
      transform(doc, ret) {
        ret.id = String(ret._id);
        delete ret._id;
        delete ret.__v;
        delete ret.password;
        delete ret.otpHash;
        delete ret.otpExpiresAt;
        delete ret.otpAttempts;
        delete ret.resetTokenHash;
        delete ret.resetTokenExpiresAt;
        delete ret.id_;
        return ret;
      },
    },
  },
);

userSchema.index({ role: 1, active: 1 });
userSchema.index({ resetTokenHash: 1 }, { sparse: true });

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, env.bcryptRounds);
  return next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.virtual('fullName').get(function fullName() {
  return `${this.firstName} ${this.lastName}`;
});

export default mongoose.model('User', userSchema);
