import { useMemo, useState } from 'react';
import {
  Pill,
  Search,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Package,
  TrendingUp,
} from 'lucide-react';
import { useMedicines, useUpdateMedicineStock } from '../hooks/usePharmacy';
import { useAuth } from '../context/auth-context';
import { useToast } from '../components/ui/useToast';
import PageHeader from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Input from '../components/ui/Input';
import EmptyState from '../components/ui/EmptyState';
import { Table, THead, TBody, TR, TH, TD } from '../components/ui/Table';
import { SkeletonTable } from '../components/ui/Skeleton';
import StatCard from '../components/ui/StatCard';
import Modal from '../components/ui/Modal';
import { cn } from '../lib/cn';

const CAN_UPDATE = ['super_admin', 'pharmacist'];

export default function Pharmacy() {
  const { user } = useAuth();
  const canUpdate = CAN_UPDATE.includes(user?.role);

  const { data: inventory = [], isLoading, isError, refetch, isRefetching } = useMedicines();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [restockTarget, setRestockTarget] = useState(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return inventory.filter((m) => {
      const isLow = m.quantity_available <= m.reorder_level;
      if (filter === 'low' && !isLow) return false;
      if (filter === 'in' && isLow) return false;
      if (!q) return true;
      return (
        m.generic_name?.toLowerCase().includes(q) ||
        m.brand_name?.toLowerCase().includes(q) ||
        m.category?.toLowerCase().includes(q)
      );
    });
  }, [inventory, search, filter]);

  const stats = useMemo(() => {
    const total = inventory.length;
    const low = inventory.filter((m) => m.quantity_available <= m.reorder_level).length;
    const sumStock = inventory.reduce((s, m) => s + Number(m.quantity_available || 0), 0);
    return { total, low, sumStock };
  }, [inventory]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Inventory"
        icon={Pill}
        title="Pharmacy"
        description="Track medicine stock and re-order alerts."
        meta={
          <>
            <Badge tone="brand" size="sm">{stats.total} items</Badge>
            {stats.low > 0 && (
              <Badge tone="warning" size="sm" dot>
                {stats.low} need restocking
              </Badge>
            )}
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
          label="Items in catalog"
          value={stats.total}
          icon={Package}
          tone="brand"
          loading={isLoading}
        />
        <StatCard
          label="Total units in stock"
          value={stats.sumStock.toLocaleString()}
          icon={TrendingUp}
          tone="vital"
          loading={isLoading}
        />
        <StatCard
          label="Low stock items"
          value={stats.low}
          icon={AlertTriangle}
          tone={stats.low > 0 ? 'warn' : 'vital'}
          loading={isLoading}
          hint="At or below reorder level"
        />
      </div>

      <Card className="p-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            placeholder="Search by generic, brand, or category…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
            containerClassName="flex-1"
          />
          <div className="inline-flex rounded-lg border border-ink-500/40 bg-ink-800 p-1 self-start">
            {[
              { id: 'all', label: 'All' },
              { id: 'in',  label: 'In stock' },
              { id: 'low', label: 'Low' },
            ].map((opt) => (
              <button
                key={opt.id}
                onClick={() => setFilter(opt.id)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-xs font-semibold transition-colors',
                  filter === opt.id
                    ? 'bg-brand-600 text-white shadow'
                    : 'text-ink-100 hover:text-white'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {isLoading ? (
        <SkeletonTable rows={8} cols={5} />
      ) : isError ? (
        <EmptyState icon={Pill} title="Couldn't load inventory" />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Pill} title="No medicines match your search" />
      ) : (
        <Table>
          <THead>
            <TR hoverable={false}>
              <TH>Medicine</TH>
              <TH>Category</TH>
              <TH align="center">Stock</TH>
              <TH align="center">Status</TH>
              <TH align="right">Actions</TH>
            </TR>
          </THead>
          <TBody>
            {filtered.map((m) => {
              const isLow = m.quantity_available <= m.reorder_level;
              return (
                <TR key={m.medicine_id}>
                  <TD>
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-brand-500/15 ring-1 ring-brand-500/30 flex items-center justify-center">
                        <Pill className="h-4 w-4 text-brand-300" />
                      </div>
                      <div>
                        <p className="font-medium text-white">{m.brand_name}</p>
                        <p className="text-xs text-ink-300">
                          {m.generic_name} {m.unit && `· ${m.unit}`}
                        </p>
                      </div>
                    </div>
                  </TD>
                  <TD>
                    <Badge tone="neutral" size="sm">{m.category}</Badge>
                  </TD>
                  <TD align="center">
                    <p className="font-bold text-white tabular-nums">{m.quantity_available}</p>
                    <p className="text-[11px] text-ink-300">Reorder ≤ {m.reorder_level}</p>
                  </TD>
                  <TD align="center">
                    {isLow ? (
                      <Badge tone="danger" size="sm">
                        <AlertTriangle className="h-3 w-3" />
                        Low stock
                      </Badge>
                    ) : (
                      <Badge tone="success" size="sm">
                        <CheckCircle2 className="h-3 w-3" />
                        In stock
                      </Badge>
                    )}
                  </TD>
                  <TD align="right">
                    {canUpdate ? (
                      <Button
                        size="sm"
                        variant={isLow ? 'primary' : 'ghost'}
                        onClick={() => setRestockTarget(m)}
                      >
                        Update stock
                      </Button>
                    ) : (
                      <span className="text-xs text-ink-400">Read-only</span>
                    )}
                  </TD>
                </TR>
              );
            })}
          </TBody>
        </Table>
      )}

      <RestockModal
        medicine={restockTarget}
        onClose={() => setRestockTarget(null)}
      />
    </div>
  );
}

// ── Restock modal ──

function RestockModal({ medicine, onClose }) {
  return (
    <Modal
      open={!!medicine}
      onClose={onClose}
      title="Update stock"
      description={
        medicine ? `${medicine.brand_name} (${medicine.generic_name})` : ''
      }
    >
      {medicine && <RestockForm key={medicine.medicine_id} medicine={medicine} onClose={onClose} />}
    </Modal>
  );
}

function RestockForm({ medicine, onClose }) {
  const [qty, setQty] = useState(() => String(medicine.quantity_available ?? 0));
  const update = useUpdateMedicineStock();
  const toast = useToast();

  const submit = async (e) => {
    e?.preventDefault();
    const n = Number(qty);
    if (!Number.isFinite(n) || n < 0) {
      toast.error('Enter a valid quantity');
      return;
    }
    try {
      await update.mutateAsync({ id: medicine.medicine_id, quantity_available: n });
      toast.success('Stock updated', `${medicine.brand_name}: ${n} units`);
      onClose();
    } catch (err) {
      toast.error('Update failed', err.response?.data?.error || 'Try again');
    }
  };

  const isLow = Number(qty) <= medicine.reorder_level;

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="rounded-xl bg-ink-900 border border-ink-500/30 p-4 grid grid-cols-3 gap-3 text-center">
        <Stat label="Current" value={medicine.quantity_available} />
        <Stat label="Reorder ≤" value={medicine.reorder_level} />
        <Stat label="Category" value={medicine.category || '—'} small />
      </div>
      <Input
        label="New quantity"
        type="number"
        min="0"
        step="1"
        value={qty}
        onChange={(e) => setQty(e.target.value)}
        autoFocus
        required
      />
      {isLow && (
        <div className="flex items-start gap-2 rounded-lg border border-warn-500/30 bg-warn-500/10 px-3 py-2 text-xs text-warn-500">
          <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          This will leave the item below the reorder threshold.
        </div>
      )}

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-ink-500/30">
        <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
        <Button type="submit" isLoading={update.isPending}>Save stock</Button>
      </div>
    </form>
  );
}

function Stat({ label, value, small }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-ink-300 font-semibold">{label}</p>
      <p className={cn('mt-1 font-semibold text-white tabular-nums truncate', small ? 'text-xs' : 'text-sm')}>
        {value}
      </p>
    </div>
  );
}
