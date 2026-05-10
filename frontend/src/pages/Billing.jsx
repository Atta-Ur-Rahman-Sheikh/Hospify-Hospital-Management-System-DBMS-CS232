import { useMemo, useState } from 'react';
import {
  Receipt,
  Search,
  Wallet,
  TrendingUp,
  CreditCard,
  Banknote,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../context/auth-context';
import { useBills, useRecordPayment } from '../hooks/useBilling';
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
        title="Billing & Invoices"
        description="Generated bills, payments, and outstanding balances."
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
                    <p className="font-mono text-sm text-white font-semibold">
                      INV-{String(b.bill_id).padStart(5, '0')}
                    </p>
                    <p className="text-xs text-ink-200">Adm #{b.admission_id}</p>
                  </TD>
                  <TD>
                    <p className="text-sm font-medium text-white">{b.patient_name}</p>
                    {b.generated_by_name && (
                      <p className="text-xs text-ink-200">By {b.generated_by_name}</p>
                    )}
                  </TD>
                  <TD>
                    <p className="text-sm text-ink-100">
                      {new Date(b.generated_at).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-ink-200">
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
                    <div className="flex items-center justify-end gap-2">
                      <Button size="sm" variant="ghost">View</Button>
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
    </div>
  );
}

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
          <div className="rounded-xl bg-ink-900 border border-ink-500/40 p-4 grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-ink-300 font-semibold">Total</p>
              <p className="mt-1 text-sm text-white font-semibold tabular-nums">{formatMoney(bill.total_amount)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-ink-300 font-semibold">Paid</p>
              <p className="mt-1 text-sm text-vital-300 font-semibold tabular-nums">{formatMoney(bill.paid_amount)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-ink-300 font-semibold">Balance</p>
              <p className={cn('mt-1 text-sm font-semibold tabular-nums', balance > 0 ? 'text-warn-500' : 'text-vital-300')}>
                {formatMoney(balance)}
              </p>
            </div>
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

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-ink-500/40">
        <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
        <Button type="submit" isLoading={pay.isPending}>Record</Button>
      </div>
    </form>
  );
}
