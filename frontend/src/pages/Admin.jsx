import { useState } from 'react';
import {
  ShieldCheck,
  Users as UsersIcon,
  History,
  CloudUpload,
  CloudDownload,
  Plus,
  Search,
  RefreshCw,
} from 'lucide-react';
import {
  useUsers,
  useAuditLog,
  useToggleUserStatus,
  useCreateUser,
  useBackupPush,
  useBackupPull,
} from '../hooks/useAdmin';
import { useToast } from '../components/ui/useToast';
import { useConfirm } from '../components/ui/confirm-context';
import PageHeader from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Avatar from '../components/ui/Avatar';
import Input, { Select } from '../components/ui/Input';
import { Table, THead, TBody, TR, TH, TD } from '../components/ui/Table';
import { SkeletonTable } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import Modal from '../components/ui/Modal';
import { cn } from '../lib/cn';

const ROLES = [
  'super_admin', 'doctor', 'nurse', 'receptionist',
  'lab_technician', 'pharmacist', 'billing_staff',
];

export default function Admin() {
  const [tab, setTab] = useState('users'); // 'users' | 'audit'
  const [search, setSearch] = useState('');
  const [openCreate, setOpenCreate] = useState(false);

  const usersQ = useUsers();
  const auditQ = useAuditLog();
  const toggleStatus = useToggleUserStatus();
  const push = useBackupPush();
  const pull = useBackupPull();
  const toast = useToast();
  const confirm = useConfirm();

  const refetchActive = tab === 'users' ? usersQ.refetch : auditQ.refetch;
  const isRefetching = tab === 'users' ? usersQ.isRefetching : auditQ.isRefetching;

  const handleToggle = async (id, name, isActive) => {
    try {
      await toggleStatus.mutateAsync(id);
      toast.success(`${name} ${isActive ? 'disabled' : 'enabled'}`);
    } catch {
      toast.error('Status update failed');
    }
  };

  const handlePush = async () => {
    const ok = await confirm({
      title: 'Push to cloud?',
      description: 'This will overwrite remote Firebase data with the current Postgres state.',
      confirmLabel: 'Push to Firebase',
      tone: 'warning',
    });
    if (!ok) return;
    try {
      await push.mutateAsync();
      toast.success('Sync complete', 'Postgres → Firebase');
    } catch (err) {
      toast.error('Sync failed', err.response?.data?.error || err.message);
    }
  };

  const handlePull = async () => {
    const ok = await confirm({
      title: 'Pull from cloud?',
      description: 'This will replace local Postgres data with the latest Firebase snapshot.',
      confirmLabel: 'Pull from Firebase',
      tone: 'warning',
    });
    if (!ok) return;
    try {
      await pull.mutateAsync();
      toast.success('Sync complete', 'Firebase → Postgres');
    } catch (err) {
      toast.error('Sync failed', err.response?.data?.error || err.message);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="System Administration"
        description="Manage users, monitor activity, and back up to the cloud."
        actions={
          <>
            <Button
              variant="secondary"
              leftIcon={<CloudUpload className="h-4 w-4" />}
              onClick={handlePush}
              isLoading={push.isPending}
            >
              Push to cloud
            </Button>
            <Button
              variant="secondary"
              leftIcon={<CloudDownload className="h-4 w-4" />}
              onClick={handlePull}
              isLoading={pull.isPending}
            >
              Pull from cloud
            </Button>
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setOpenCreate(true)}>
              Add User
            </Button>
          </>
        }
      />

      {/* Tabs */}
      <Card className="p-1.5">
        <div className="inline-flex w-full sm:w-auto rounded-lg p-0.5">
          <button
            onClick={() => setTab('users')}
            className={cn(
              'flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-colors',
              tab === 'users'
                ? 'bg-brand-600 text-white shadow'
                : 'text-ink-100 hover:text-white hover:bg-ink-700'
            )}
          >
            <UsersIcon className="h-4 w-4" />
            Users
          </button>
          <button
            onClick={() => setTab('audit')}
            className={cn(
              'flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-colors',
              tab === 'audit'
                ? 'bg-brand-600 text-white shadow'
                : 'text-ink-100 hover:text-white hover:bg-ink-700'
            )}
          >
            <History className="h-4 w-4" />
            Audit log
          </button>
        </div>
      </Card>

      <Card className="p-3">
        <div className="flex flex-col sm:flex-row items-stretch gap-3">
          <Input
            placeholder={tab === 'users' ? 'Search users…' : 'Search audit log…'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
            containerClassName="flex-1"
          />
          <Button
            variant="secondary"
            leftIcon={<RefreshCw className={isRefetching ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />}
            onClick={() => refetchActive()}
          >
            Refresh
          </Button>
        </div>
      </Card>

      {tab === 'users' ? (
        <UsersTable query={usersQ} search={search} onToggle={handleToggle} toggling={toggleStatus.isPending} />
      ) : (
        <AuditTable query={auditQ} search={search} />
      )}

      <CreateUserModal open={openCreate} onClose={() => setOpenCreate(false)} />
    </div>
  );
}

function UsersTable({ query, search, onToggle, toggling }) {
  if (query.isLoading) return <SkeletonTable rows={6} cols={5} />;
  if (query.isError)   return <EmptyState icon={ShieldCheck} title="Couldn't load users" />;

  const q = search.trim().toLowerCase();
  const users = (query.data || []).filter((u) => {
    if (!q) return true;
    return (
      u.full_name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.role?.toLowerCase().includes(q)
    );
  });

  if (!users.length) return <EmptyState icon={UsersIcon} title="No users match" />;

  return (
    <Table>
      <THead>
        <TR hoverable={false}>
          <TH>Name</TH>
          <TH>Email</TH>
          <TH>Role</TH>
          <TH align="center">Status</TH>
          <TH>Joined</TH>
          <TH align="right">Actions</TH>
        </TR>
      </THead>
      <TBody>
        {users.map((u) => (
          <TR key={u.user_id}>
            <TD>
              <div className="flex items-center gap-3">
                <Avatar name={u.full_name} size="sm" />
                <p className="font-medium text-white truncate">{u.full_name}</p>
              </div>
            </TD>
            <TD className="text-ink-100">{u.email}</TD>
            <TD>
              <Badge tone="neutral" size="sm" className="uppercase">
                {u.role?.replace('_', ' ')}
              </Badge>
            </TD>
            <TD align="center">
              {u.is_active ? (
                <Badge tone="success" size="sm" dot>Active</Badge>
              ) : (
                <Badge tone="danger" size="sm" dot>Disabled</Badge>
              )}
            </TD>
            <TD>
              <p className="text-xs text-ink-200">
                {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
              </p>
            </TD>
            <TD align="right">
              <Button
                size="sm"
                variant={u.is_active ? 'danger' : 'success'}
                isLoading={toggling}
                onClick={() => onToggle(u.user_id, u.full_name, u.is_active)}
              >
                {u.is_active ? 'Disable' : 'Enable'}
              </Button>
            </TD>
          </TR>
        ))}
      </TBody>
    </Table>
  );
}

function AuditTable({ query, search }) {
  if (query.isLoading) return <SkeletonTable rows={8} cols={5} />;
  if (query.isError)   return <EmptyState icon={History} title="Couldn't load audit log" />;

  const q = search.trim().toLowerCase();
  const logs = (query.data || []).filter((l) => {
    if (!q) return true;
    return (
      l.user_name?.toLowerCase().includes(q) ||
      l.action_type?.toLowerCase().includes(q) ||
      l.table_name?.toLowerCase().includes(q) ||
      String(l.record_id || '').includes(q)
    );
  });

  if (!logs.length) return <EmptyState icon={History} title="No log entries match" />;

  const ACTION_TONE = {
    INSERT: 'success',
    UPDATE: 'info',
    DELETE: 'danger',
  };

  return (
    <Table>
      <THead>
        <TR hoverable={false}>
          <TH>When</TH>
          <TH>User</TH>
          <TH>Action</TH>
          <TH>Entity</TH>
          <TH>Changes</TH>
        </TR>
      </THead>
      <TBody>
        {logs.map((l) => (
          <TR key={l.log_id}>
            <TD>
              <p className="text-sm text-white tabular-nums">
                {new Date(l.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
              <p className="text-xs text-ink-200">
                {new Date(l.timestamp).toLocaleDateString()}
              </p>
            </TD>
            <TD>
              <div className="flex items-center gap-2">
                <Avatar name={l.user_name || `User ${l.user_id}`} size="xs" />
                <p className="text-sm text-white truncate max-w-[180px]">
                  {l.user_name || `User #${l.user_id}`}
                </p>
              </div>
            </TD>
            <TD>
              <Badge tone={ACTION_TONE[l.action_type] || 'neutral'} size="sm">
                {l.action_type}
              </Badge>
            </TD>
            <TD>
              <p className="text-sm text-ink-100 font-mono">
                {l.table_name}{' '}
                {l.record_id != null && (
                  <span className="text-ink-300">#{l.record_id}</span>
                )}
              </p>
            </TD>
            <TD>
              <pre
                className="font-mono text-[10px] text-ink-200 bg-ink-900 border border-ink-500/40 rounded px-2 py-1 max-w-[320px] truncate"
                title={JSON.stringify(l.changes)}
              >
                {JSON.stringify(l.changes)}
              </pre>
            </TD>
          </TR>
        ))}
      </TBody>
    </Table>
  );
}

function CreateUserModal({ open, onClose }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create user"
      description="The new user can sign in immediately with the credentials you set."
    >
      {open && <CreateUserForm onClose={onClose} />}
    </Modal>
  );
}

function CreateUserForm({ onClose }) {
  const [form, setForm] = useState({ full_name: '', email: '', password: '', role: 'doctor' });
  const [errors, setErrors] = useState({});
  const create = useCreateUser();
  const toast = useToast();

  const setField = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e?.preventDefault();
    const errs = {};
    if (!form.full_name.trim()) errs.full_name = 'Required';
    if (!form.email.trim())     errs.email = 'Required';
    if (!form.password)         errs.password = 'Required';
    if (form.password && form.password.length < 8) errs.password = 'At least 8 characters';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    try {
      await create.mutateAsync({
        full_name: form.full_name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        role: form.role,
      });
      toast.success('User created', form.full_name);
      onClose();
    } catch (err) {
      toast.error('Could not create user', err.response?.data?.error || 'Unknown error');
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
        <Input
          label="Full name"
          value={form.full_name}
          onChange={setField('full_name')}
          error={errors.full_name}
          required
        />
        <Input
          label="Email"
          type="email"
          value={form.email}
          onChange={setField('email')}
          error={errors.email}
          required
        />
        <Input
          label="Password"
          type="password"
          value={form.password}
          onChange={setField('password')}
          error={errors.password}
          hint={!errors.password ? 'Minimum 8 characters' : undefined}
          required
        />
        <Select
          label="Role"
          value={form.role}
          onChange={setField('role')}
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>{r.replace('_', ' ')}</option>
          ))}
        </Select>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-ink-500/40">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            type="submit"
            isLoading={create.isPending}
            leftIcon={!create.isPending ? <Plus className="h-4 w-4" /> : undefined}
          >
            Create
          </Button>
        </div>
    </form>
  );
}
