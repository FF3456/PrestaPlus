import Counter from '../models/Counter.js';

/** Número correlativo atómico por año: PREFIJO-2026-000001 */
export async function nextNumber(prefix, date = new Date()) {
  const year = date.getFullYear();
  const counter = await Counter.findOneAndUpdate(
    { _id: `${prefix}-${year}` },
    { $inc: { seq: 1 } },
    { new: true, upsert: true },
  );
  return `${prefix}-${year}-${String(counter.seq).padStart(6, '0')}`;
}
