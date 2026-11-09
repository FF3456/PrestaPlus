import { useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { payments } from '../api/services.js';
import { useFetch } from '../utils/hooks.js';
import { dateTime, money } from '../utils/format.js';
import { PAYMENT_LABEL } from '../utils/constants.js';
import { DL, EmptyState, ErrorBox, Modal, Money, PageHeader, Pagination, Spinner, Table, Tabs } from '../components/ui.jsx';

const TABS = [{ value: '', label: 'Todos' }, ...Object.entries(PAYMENT_LABEL).map(([value, label]) => ({ value, label }))];

/** RF-010 · Registro de pagos con comprobante digital. */
export default function PaymentsList() {
  const { base } = useOutletContext();
  const [type, setType] = useState('');
  const [page, setPage] = useState(1);
  const [receipt, setReceipt] = useState(null);
  const { data, loading, error } = useFetch(() => payments.list({ type, page, limit: 15 }), [type, page]);

  return (
    <>
      <PageHeader title="Registro de pagos" subtitle="Historial de abonos, intereses, renovaciones y rescates." />
      <Tabs tabs={TABS} value={type} onChange={(v) => { setType(v); setPage(1); }} />
      {loading && <Spinner />}
      <ErrorBox error={error} />
      {data?.data.length === 0 && <EmptyState title="Sin pagos">Aún no hay operaciones registradas.</EmptyState>}
      {data?.data.length > 0 && (
        <Table head={['Comprobante', 'Contrato', 'Operación', 'Monto', 'Fecha', '']}>
          {data.data.map((p) => (
            <tr key={p.id}>
              <td className="td font-medium">{p.receiptNumber}</td>
              <td className="td"><Link className="text-brand-600 underline" to={`${base}/prestamos/${(p.loan.id || p.loan._id)}`}>{p.loan.contractNumber}</Link></td>
              <td className="td">{PAYMENT_LABEL[p.type]}</td>
              <td className="td"><Money value={p.amount} /></td>
              <td className="td whitespace-nowrap">{dateTime(p.paidAt)}</td>
              <td className="td text-right"><button className="btn-secondary !min-h-[36px]" onClick={() => setReceipt(p)}>Comprobante</button></td>
            </tr>
          ))}
        </Table>
      )}
      <Pagination meta={data?.meta} onPage={setPage} />
      {receipt && (
        <Modal title={`Comprobante ${receipt.receiptNumber}`} onClose={() => setReceipt(null)} footer={<button className="btn-primary" onClick={() => window.print()}>Imprimir</button>}>
          <DL items={[
            ['Contrato', receipt.loan.contractNumber],
            ['Garantía', receipt.loan.collateral ? `${receipt.loan.collateral.brand} ${receipt.loan.collateral.model}` : null],
            ['Operación', PAYMENT_LABEL[receipt.type]],
            ['Monto total', money(receipt.amount)],
            ['A interés', money(receipt.interestPortion)],
            ['A capital', money(receipt.capitalPortion)],
            ['Saldo de capital', money(receipt.balanceAfter)],
            ['Fecha', dateTime(receipt.paidAt)],
            ['Registrado por', receipt.registeredBy ? `${receipt.registeredBy.firstName} ${receipt.registeredBy.lastName}` : null],
          ]} />
        </Modal>
      )}
    </>
  );
}
