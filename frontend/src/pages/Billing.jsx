import { useMemo, useState } from 'react';
import {
  Receipt,
  Search,
  Wallet,
  TrendingUp,
  CreditCard,
  Banknote,
  RefreshCw,
  Eye,
  FileText,
} from 'lucide-react';
import { useAuth } from '../context/auth-context';
import { useBills, useRecordPayment, useBillByAdmission, useBillingSummary } from '../hooks/useBilling';
import PageHeader from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Input, { Select } from '../components/ui/Input';
import EmptyState from '../components/ui/EmptyState';
import { Table, THead, TBody, TR, TH, TD } from '../components/ui/Table';
import { SkeletonTable } from '../components/ui/Skeleton';
import StatCard from '../components/ui/StatCard';
import Modal from '../components/ui/Modal';
import { useToast } from '../components/ui/useToast';
import { cn } from '../lib/cn';

const STATUS_TONE = {
  paid:    'success',
  partial: 'warning',
  unpaid:  'danger',
  pending: 'info',
};

const CAN_PAY = ['super_admin', 'billing_staff'];

function formatMoney(n) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(Number(n) || 0);
}

export default function Billing() {
  const { user } = useAuth();
  const canPay = CAN_PAY.includes(user?.role);

  const { data: bills = [], isLoading, isError, refetch, isRefetching } = useBills();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [payTarget, setPayTarget] = useState(null);
  const [viewTarget, setViewTarget] = useState(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return bills.filter((b) => {
      if (statusFilter !== 'all' && b.status !== statusFilter) return false;
      if (!q) return true;
      return (
        b.patient_name?.toLowerCase().includes(q) ||
        String(b.bill_id).includes(q) ||
        String(b.admission_id).includes(q)
      );
    });
  }, [bills, search, statusFilter]);

  const stats = useMemo(() => {
    const totalRevenue = bills.reduce((s, b) => s + Number(b.paid_amount || 0), 0);
    const unpaid = bills
      .filter(b => b.status !== 'paid')
      .reduce((s, b) => s + (Number(b.total_amount || 0) - Number(b.paid_amount || 0)), 0);
    const paid = bills.filter((b) => b.status === 'paid').length;
    return { totalRevenue, unpaid, paid };
  }, [bills]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Finance"
        icon={Receipt}
        title="Billing & Invoices"
        description="Generated bills, payments, and outstanding balances."
        meta={
          <>
            <Badge tone="success" size="sm">{stats.paid} paid</Badge>
            <Badge tone={stats.unpaid > 0 ? 'warning' : 'neutral'} size="sm" dot={stats.unpaid > 0}>
              {formatMoney(stats.unpaid)} outstanding
            </Badge>
          </>
        }
        actions={
          <Button
            variant="secondary"
            leftIcon={<RefreshCw className={isRefetching ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />}
            onClick={() => refetch()}
          >
            Refresh
          </Button>
        }
      />

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <StatCard
          label="Total collected"
          value={formatMoney(stats.totalRevenue)}
          icon={Wallet}
          tone="vital"
          loading={isLoading}
        />
        <StatCard
          label="Outstanding"
          value={formatMoney(stats.unpaid)}
          icon={CreditCard}
          tone={stats.unpaid > 0 ? 'warn' : 'vital'}
          loading={isLoading}
        />
        <StatCard
          label="Bills paid"
          value={`${stats.paid} of ${bills.length}`}
          icon={TrendingUp}
          tone="brand"
          loading={isLoading}
        />
      </div>

      <Card className="p-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            placeholder="Search by patient, bill ID, or admission…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
            containerClassName="flex-1"
          />
          <div className="sm:w-48">
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All statuses</option>
              <option value="paid">Paid</option>
              <option value="partial">Partial</option>
              <option value="unpaid">Unpaid</option>
              <option value="pending">Pending</option>
            </Select>
          </div>
        </div>
      </Card>

      {isLoading ? (
        <SkeletonTable rows={8} cols={6} />
      ) : isError ? (
        <EmptyState icon={Receipt} title="Couldn't load bills" />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Receipt} title="No bills found" />
      ) : (
        <Table>
          <THead>
            <TR hoverable={false}>
              <TH>Invoice</TH>
              <TH>Patient</TH>
              <TH>Generated</TH>
              <TH align="right">Total</TH>
              <TH align="right">Paid</TH>
              <TH align="center">Status</TH>
              <TH align="right">Actions</TH>
            </TR>
          </THead>
          <TBody>
            {filtered.map((b) => {
              const total = Number(b.total_amount || 0);
              const paid  = Number(b.paid_amount || 0);
              const balance = total - paid;
              return (
                <TR key={b.bill_id}>
                  <TD>
                    <button
                      type="button"
                      onClick={() => setViewTarget(b)}
                      className="text-left group"
                    >
                      <p className="font-mono text-sm text-white font-semibold group-hover:text-brand-300 transition-colors">
                        INV-{String(b.bill_id).padStart(5, '0')}
                      </p>
                      <p className="text-xs text-ink-300">Adm #{b.admission_id}</p>
                    </button>
                  </TD>
                  <TD>
                    <p className="text-sm font-medium text-white">{b.patient_name}</p>
                    {b.generated_by_name && (
                      <p className="text-xs text-ink-300">By {b.generated_by_name}</p>
                    )}
                  </TD>
                  <TD>
                    <p className="text-sm text-ink-100">
                      {new Date(b.generated_at).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-ink-300">
                      {new Date(b.generated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </TD>
                  <TD align="right">
                    <p className="font-semibold text-white tabular-nums">{formatMoney(total)}</p>
                  </TD>
                  <TD align="right">
                    <p className="text-sm text-ink-100 tabular-nums">{formatMoney(paid)}</p>
                    {balance > 0 && (
                      <p className="text-xs text-warn-500 tabular-nums">−{formatMoney(balance)}</p>
                    )}
                  </TD>
                  <TD align="center">
                    <Badge tone={STATUS_TONE[b.status] || 'neutral'} size="sm">
                      {b.status}
                    </Badge>
                  </TD>
                  <TD align="right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        size="sm"
                        variant="ghost"
                        leftIcon={<Eye className="h-3.5 w-3.5" />}
                        onClick={() => setViewTarget(b)}
                      >
                        View
                      </Button>
                      {canPay && b.status !== 'paid' && (
                        <Button
                          size="sm"
                          variant="success"
                          leftIcon={<Banknote className="h-3.5 w-3.5" />}
                          onClick={() => setPayTarget(b)}
                        >
                          Record payment
                        </Button>
                      )}
                    </div>
                  </TD>
                </TR>
              );
            })}
          </TBody>
        </Table>
      )}

      <RecordPaymentModal
        bill={payTarget}
        onClose={() => setPayTarget(null)}
      />
      <BillDetailModal
        bill={viewTarget}
        onClose={() => setViewTarget(null)}
        canPay={canPay}
        onPay={(b) => { setViewTarget(null); setPayTarget(b); }}
      />
    </div>
  );
}

// ── View bill detail (line items + payment history) ──

function BillDetailModal({ bill, onClose, canPay, onPay }) {
  return (
    <Modal
      open={!!bill}
      onClose={onClose}
      title={bill ? `INV-${String(bill.bill_id).padStart(5, '0')}` : ''}
      description={bill ? `${bill.patient_name} · Admission #${bill.admission_id}` : ''}
      size="lg"
      footer={
        bill ? (
          <>
            <Button variant="ghost" onClick={onClose}>Close</Button>
            {canPay && bill.status !== 'paid' && (
              <Button leftIcon={<Banknote className="h-4 w-4" />} onClick={() => onPay(bill)}>
                Record payment
              </Button>
            )}
          </>
        ) : null
      }
    >
      {bill && <BillDetail key={bill.bill_id} bill={bill} />}
    </Modal>
  );
}

function BillDetail({ bill }) {
  const items = useBillByAdmission(bill.admission_id);
  const summary = useBillingSummary(bill.bill_id);

  const total   = Number(bill.total_amount || 0);
  const paid    = Number(bill.paid_amount || 0);
  const discount = Number(bill.discount || 0);
  const balance = total - paid - discount;

  return (
    <div className="space-y-5">
      {/* Totals */}
      <div className="rounded-xl bg-ink-900/60 border border-ink-500/30 p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
        <Cell label="Total" value={formatMoney(total)} />
        <Cell label="Discount" value={formatMoney(discount)} />
        <Cell label="Paid" value={formatMoney(paid)} tone="vital" />
        <Cell label="Balance" value={formatMoney(balance)} tone={balance > 0 ? 'warn' : 'vital'} />
      </div>

      {/* Line items */}
      <section>
        <h3 className="text-sm font-semibold text-white tracking-tight mb-2 flex items-center gap-2">
          <FileText className="h-4 w-4 text-ink-300" />
          Line items
        </h3>
        {items.isLoading ? (
          <div className="rounded-lg border border-ink-500/30 bg-ink-900/40 p-6 text-center text-sm text-ink-300">
            Loading…
          </div>
        ) : items.isError ? (
          <EmptyState icon={Receipt} title="Couldn't load items" className="!py-6" />
        ) : (
          <div className="rounded-lg border border-ink-500/30 overflow-hidden">
            <table className="min-w-full text-sm">
              <thead className="bg-ink-900/60">
                <tr className="text-left text-[11px] uppercase tracking-widest text-ink-300">
                  <th className="px-3 py-2">Service</th>
                  <th className="px-3 py-2">Description</th>
                  <th className="px-3 py-2 text-right">Qty</th>
                  <th className="px-3 py-2 text-right">Unit</th>
                  <th className="px-3 py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-500/25">
                {(items.data?.items || []).filter((it) => it && it.item_id).map((it) => (
                  <tr key={it.item_id} className="text-ink-100">
                    <td className="px-3 py-2 capitalize">{it.service_type}</td>
                    <td className="px-3 py-2 text-ink-200 truncate max-w-[260px]">{it.description}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{it.quantity}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{formatMoney(it.unit_price)}</td>
                    <td className="px-3 py-2 text-right tabular-nums font-semibold text-white">{formatMoney(it.total_price)}</td>
                  </tr>
                ))}
                {(!items.data?.items || items.data.items.filter((it) => it && it.item_id).length === 0) && (
                  <tr>
                    <td colSpan={5} className="px-3 py-6 text-center text-sm text-ink-300">No line items.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Payment history */}
      <section>
        <h3 className="text-sm font-semibold text-white tracking-tight mb-2 flex items-center gap-2">
          <Banknote className="h-4 w-4 text-ink-300" />
          Payment history
        </h3>
        {summary.isLoading ? (
          <div className="rounded-lg border border-ink-500/30 bg-ink-900/40 p-6 text-center text-sm text-ink-300">
            Loading…
          </div>
        ) : (summary.data?.payments?.length ?? 0) === 0 ? (
          <EmptyState icon={Banknote} title="No payments yet" description="Record a payment to start drawing down the balance." className="!py-6" />
        ) : (
          <ul className="space-y-2">
            {summary.data.payments.map((p, i) => (
              <li
                key={i}
                className="rounded-lg border border-ink-500/30 bg-ink-900/40 px-3 py-2 flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-medium text-white">
                    {formatMoney(p.amount)}
                  </p>
                  <p className="text-xs text-ink-300 capitalize">
                    {p.method?.replace('_', ' ')} · {p.paid_at ? new Date(p.paid_at).toLocaleString() : ''}
                  </p>
                </div>
                <Badge tone="success" size="sm">paid</Badge>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Cell({ label, value, tone }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-ink-300 font-semibold">{label}</p>
      <p className={cn(
        'mt-1 text-sm font-semibold tabular-nums',
        tone === 'vital' ? 'text-vital-300' : tone === 'warn' ? 'text-warn-500' : 'text-white',
      )}>
        {value}
      </p>
    </div>
  );
}

// ── Record payment ──

function RecordPaymentModal({ bill, onClose }) {
  return (
    <Modal
      open={!!bill}
      onClose={onClose}
      title="Record payment"
      description={
        bill ? `Invoice INV-${String(bill.bill_id).padStart(5, '0')} for ${bill.patient_name}` : ''
      }
    >
      {bill && <RecordPaymentForm key={bill.bill_id} bill={bill} onClose={onClose} />}
    </Modal>
  );
}

function RecordPaymentForm({ bill, onClose }) {
  const balance =
    Number(bill.total_amount || 0) - Number(bill.paid_amount || 0) - Number(bill.discount || 0);
  const [amount, setAmount] = useState(() => balance.toFixed(2));
  const [method, setMethod] = useState('cash');
  const pay = useRecordPayment();
  const toast = useToast();

  const submit = async (e) => {
    e?.preventDefault();
    const num = Number(amount);
    if (!Number.isFinite(num) || num <= 0) {
      toast.error('Invalid amount');
      return;
    }
    try {
      await pay.mutateAsync({ billId: bill.bill_id, amount: num, payment_method: method });
      toast.success('Payment recorded', formatMoney(num));
      onClose();
    } catch (err) {
      toast.error('Payment failed', err.response?.data?.error || 'Unknown error');
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="rounded-xl bg-ink-900 border border-ink-500/30 p-4 grid grid-cols-3 gap-3 text-center">
        <Cell label="Total" value={formatMoney(bill.total_amount)} />
        <Cell label="Paid" value={formatMoney(bill.paid_amount)} tone="vital" />
        <Cell label="Balance" value={formatMoney(balance)} tone={balance > 0 ? 'warn' : 'vital'} />
      </div>
      <Input
        label="Amount"
        type="number"
        step="0.01"
        min="0"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        required
      />
      <Select label="Payment method" value={method} onChange={(e) => setMethod(e.target.value)}>
        <option value="cash">Cash</option>
        <option value="card">Card</option>
        <option value="bank_transfer">Bank transfer</option>
        <option value="insurance">Insurance</option>
      </Select>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-ink-500/30">
        <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
        <Button type="submit" isLoading={pay.isPending}>Record</Button>
      </div>
    </form>
  );
}
