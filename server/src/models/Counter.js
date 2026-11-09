import mongoose from 'mongoose';

/** Contadores atómicos para numeración correlativa de contratos y comprobantes. */
const counterSchema = new mongoose.Schema({ _id: String, seq: { type: Number, default: 0 } });

export default mongoose.model('Counter', counterSchema);
