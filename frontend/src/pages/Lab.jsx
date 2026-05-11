import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  FlaskConical,
  Search,
  RefreshCw,
  Stethoscope,
  ClipboardList,
  CheckCircle2,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { useAuth } from '../context/auth-context';
import { useLabOrders, useUpdateLabOrderStatus, useLabResult } from '../hooks/useLab';
import PageHeader from '../components/ui/PageHeader';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Avatar from '../components/ui/Avatar';
import Input from '../components/ui/Input';
import EmptyState from '../components/ui/EmptyState';
import Skeleton from '../components/ui/Skeleton';
import Modal from '../components/ui/Modal';
import { useToast } from '../components/ui/useToast';
import { cn } from '../lib/cn';

const PRIORITY_TONE = {
  stat:    'danger',
  urgent:  'warning',
  routine: 'info',
};

const STATUS_TONE = {
  pending:     'warning',
  in_progress: 'info',
  completed:   'success',
  cancelled:   'neutral',
};

const CAN_UPDATE = ['super_admin', 'lab_technician'];

export default function Lab() {
  const { user } = useAuth();
  const canUpdate = CAN_UPDATE.includes(user?.role);

  const { data: orders = [], isLoading, isError, refetch, isRefetching } = useLabOrders();
  const updateStatus = useUpdateLabOrderStatus();
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [resultTarget, setResultTarget] = useState(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      if (statusFilter !== 'all' && o.status !== statusFilter) return false;
      if (!q) return true;
      return (
        o.test_name?.toLowerCase().includes(q) ||
        o.patient_name?.toLowerCase().includes(q) ||
        o.doctor_name?.toLowerCase().includes(q)
      );
    });
  }, [orders, search, statusFilter]);

  const counts = useMemo(() => {
    const c = { pending: 0, in_progress: 0, completed: 0, cancelled: 0 };
    orders.forEach((o) => { if (c[o.status] != null) c[o.status]++; });
    return c;
  }, [orders]);

  const setStatus = async (id, status) => {
    if (!canUpdate) return;
    try {
      await updateStatus.mutateAsync({ id, status });
      toast.success(`Marked as ${status}`);
    } catch (err) {
      toast.error('Update failed', err.response?.data?.error || 'Unknown error');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Laboratory Orders"
        description="Track tests ordered by physicians and dispatch results."
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

      <Card className="p-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            placeholder="Search by test, patient, or doctor…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
            containerClassName="flex-1"
          />
          <div className="inline-flex rounded-lg border border-ink-500/50 bg-ink-800 p-1 self-start overflow-x-auto">
            {[
              { id: 'all',         label: `All (${orders.length})` },
              { id: 'pending',     label: `Pending (${counts.pending})` },
              { id: 'in_progress', label: `In progress (${counts.in_progress})` },
              { id: 'completed',   label: `Completed (${counts.completed})` },
            ].map((opt) => (
              <button
                key={opt.id}
                onClick={() => setStatusFilter(opt.id)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors',
                  statusFilter === opt.id
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
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="p-5 space-y-3">
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/3" />
            </Card>
          ))}
        </div>
      ) : isError ? (
        <EmptyState icon={FlaskConical} title="Couldn't load lab orders" />
      ) : filtered.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No lab orders found" description="Try changing filters or check back later." />
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((o, i) => (
            <motion.div
              key={o.order_id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: i * 0.02 }}
            >
              <Card hoverable className="overflow-hidden">
                <CardHeader>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-ink-300 font-semibold">
                      Order #{o.order_id}
                    </p>
                    <p className="font-semibold text-white text-base mt-0.5 truncate">
                      {o.test_name}
                    </p>
                  </div>
                  <Badge tone={PRIORITY_TONE[o.priority] || 'neutral'} size="sm">
                    {o.priority}
                  </Badge>
                </CardHeader>
                <CardBody className="space-y-3.5">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={o.patient_name} size="sm" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">{o.patient_name}</p>
                      <p className="text-xs text-ink-200 truncate">
                        {o.ward_name ? `Ward: ${o.ward_name}` : 'Outpatient'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-ink-200">
                    <Stethoscope className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">Ordered by {o.doctor_name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-ink-200">
                    <Clock className="h-3.5 w-3.5 shrink-0" />
                    <span>{new Date(o.ordered_at).toLocaleString()}</span>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-ink-500/30">
                    <Badge tone={STATUS_TONE[o.status] || 'neutral'} size="sm">
                      {o.status?.replace('_', ' ')}
                    </Badge>
                    {canUpdate ? (
                      o.status === 'pending' ? (
                        <Button
                          size="sm"
                          variant="primary"
                          leftIcon={<AlertCircle className="h-3.5 w-3.5" />}
                          onClick={() => setStatus(o.order_id, 'in_progress')}
                        >
                          Start
                        </Button>
                      ) : o.status === 'in_progress' ? (
                        <Button
                          size="sm"
                          variant="success"
                          leftIcon={<CheckCircle2 className="h-3.5 w-3.5" />}
                          onClick={() => setStatus(o.order_id, 'completed')}
                        >
                          Complete
                        </Button>
                      ) : (
                        <Button size="sm" variant="ghost" onClick={() => setResultTarget(o)}>View report</Button>
                      )
                    ) : (
                      <Button size="sm" variant="ghost" onClick={() => setResultTarget(o)}>View</Button>
                    )}
                  </div>
                </CardBody>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <ResultModal order={resultTarget} onClose={() => setResultTarget(null)} />
    </div>
  );
}

function ResultModal({ order, onClose }) {
  return (
    <Modal
      open={!!order}
      onClose={onClose}
      title={order ? `Result · ${order.test_name}` : 'Result'}
      description={order ? `Order #${order.order_id} · ${order.patient_name}` : ''}
      size="lg"
    >
      {order && <ResultBody key={order.order_id} order={order} />}
    </Modal>
  );
}

function ResultBody({ order }) {
  const q = useLabResult(order.order_id);

  if (q.isLoading) {
    return <div className="space-y-2">
      <Skeleton className="h-5 w-1/3" />
      <Skeleton className="h-20 w-full" />
    </div>;
  }
  if (q.isError || !q.data) {
    return <EmptyState
      icon={FlaskConical}
      title="No result yet"
      description="The lab hasn't uploaded a result for this order. Once a technician completes the test, it will appear here."
      className="!py-8"
    />;
  }

  const r = q.data;
  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-ink-500/30 bg-ink-900/40 p-4 grid grid-cols-2 gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-ink-300 font-semibold">Test</p>
          <p className="text-sm text-white mt-0.5">{r.test_name}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-widest text-ink-300 font-semibold">Resulted</p>
          <p className="text-sm text-white mt-0.5">
            {r.resulted_at ? new Date(r.resulted_at).toLocaleString() : '—'}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-widest text-ink-300 font-semibold">Patient</p>
          <p className="text-sm text-white mt-0.5">{r.patient_name}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-widest text-ink-300 font-semibold">Technician</p>
          <p className="text-sm text-white mt-0.5">{r.tech_name || '—'}</p>
        </div>
      </div>

      {r.result_summary && (
        <div>
          <h3 className="text-sm font-semibold text-white tracking-tight mb-2">Summary</h3>
          <p className="text-sm text-ink-100 leading-relaxed bg-ink-900/40 border border-ink-500/30 rounded-lg p-3 whitespace-pre-wrap">
            {r.result_summary}
          </p>
        </div>
      )}

      {r.notes && (
        <div>
          <h3 className="text-sm font-semibold text-white tracking-tight mb-2">Technician notes</h3>
          <p className="text-sm text-ink-200 italic border-l-2 border-ink-500/40 pl-3 whitespace-pre-wrap">
            {r.notes}
          </p>
        </div>
      )}
    </div>
  );
}
