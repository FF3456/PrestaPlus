import { Router } from 'express';
import { authenticate } from '../middlewares/auth.js';
import { authorize } from '../middlewares/rbac.js';
import { uploadPhotos } from '../middlewares/upload.js';
import { validate, validateObjectIdParams } from '../middlewares/validate.js';
import { CATEGORIES, CONDITIONS, ROLES, STAFF_ROLES } from '../constants/index.js';
import * as c from '../controllers/collateralController.js';

const router = Router();
router.use(authenticate);

const base = {
  category: { required: true, enum: CATEGORIES, label: 'Categoría' },
  condition: { required: true, enum: CONDITIONS, label: 'Estado físico' },
  declaredValue: { required: true, type: 'number', min: 1, max: 10_000_000, label: 'Valor declarado' },
};
const details = {
  brand: { required: true, max: 60, label: 'Marca' },
  model: { required: true, max: 80, label: 'Modelo' },
  serialNumber: { required: true, min: 4, max: 40, label: 'Número de serie/IMEI' },
  description: { max: 500, label: 'Descripción' },
};

router.post('/pre-evaluation', authorize(ROLES.CLIENT, ...STAFF_ROLES), validate(base), c.preEvaluation);
router.post('/', authorize(ROLES.CLIENT), uploadPhotos, validate({ ...base, ...details }), c.createCollateral);
router.get('/', c.listCollaterals);
router.get('/:id', validateObjectIdParams('id'), c.getCollateral);
router.put(
  '/:id',
  authorize(ROLES.CLIENT),
  validateObjectIdParams('id'),
  validate({
    category: { enum: CATEGORIES, label: 'Categoría' },
    condition: { enum: CONDITIONS, label: 'Estado físico' },
    declaredValue: { type: 'number', min: 1, max: 10_000_000, label: 'Valor declarado' },
    brand: { max: 60, label: 'Marca' },
    model: { max: 80, label: 'Modelo' },
    serialNumber: { min: 4, max: 40, label: 'Número de serie/IMEI' },
    description: { max: 500, label: 'Descripción' },
  }),
  c.updateCollateral,
);
router.delete('/:id', authorize(ROLES.CLIENT), validateObjectIdParams('id'), c.deleteCollateral);

export default router;
