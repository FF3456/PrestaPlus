import mongoose from 'mongoose';
import { CATEGORIES, CONDITIONS, COLLATERAL_STATUS } from '../constants/index.js';

const { Schema } = mongoose;

const photoSchema = new Schema(
  { url: { type: String, required: true }, filename: { type: String, required: true } },
  { _id: false },
);

const collateralSchema = new Schema(
  {
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    category: { type: String, enum: CATEGORIES, required: [true, 'La categoría es obligatoria'] },
    brand: { type: String, required: [true, 'La marca es obligatoria'], trim: true, maxlength: 60 },
    model: { type: String, required: [true, 'El modelo es obligatorio'], trim: true, maxlength: 80 },
    serialNumber: { type: String, required: [true, 'El número de serie/IMEI es obligatorio'], trim: true, uppercase: true, maxlength: 40 },
    condition: { type: String, enum: CONDITIONS, required: [true, 'El estado físico es obligatorio'] },
    description: { type: String, trim: true, maxlength: 500, default: '' },
    photos: {
      type: [photoSchema],
      validate: [(v) => v.length >= 1 && v.length <= 5, 'Debe adjuntar entre 1 y 5 fotografías'],
    },
    declaredValue: { type: Number, required: true, min: [1, 'El valor declarado debe ser mayor a 0'] },
    estimatedValue: { type: Number, min: 0 }, // pre-evaluación (RF-005)
    appraisedValue: { type: Number, min: 0 }, // tasación del empleado (RF-006)
    status: { type: String, enum: Object.values(COLLATERAL_STATUS), default: COLLATERAL_STATUS.REGISTERED },
    custodyLocation: { type: String, trim: true, maxlength: 60 }, // RF-011
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

collateralSchema.index({ owner: 1, status: 1 });
collateralSchema.index({ status: 1, createdAt: -1 });
collateralSchema.index({ serialNumber: 1 });

export default mongoose.model('Collateral', collateralSchema);
