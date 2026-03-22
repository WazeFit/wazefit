import { useState, useEffect } from 'react';
import { api, AdminTenant, AdminStats, AdminLog } from '../../lib/api';
import { useTranslation } from '../../lib/i18n';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';

export default function AdminDashboardPage() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [tenants, setTenants] = useState<AdminTenant[]>([]);
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal de edição
  const [selectedTenant, setSelectedTenant] = useState<AdminTenant | null>(null);
  const [editPlano, setEditPlano] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsData, tenantsData, logsData] = await Promise.all([
        api.admin.stats(),
        api.admin.tenants(),
        api.admin.logs(50),
      ]);
      setStats(statsData);
      setTenants(tenantsData);
      setLogs(logsData);
    } catch (err) {
      console.error('Erro ao carregar dados admin:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    try {
      const data = await api.admin.tenants(busca);
      setTenants(data);
    } catch (err) {
      console.error('Erro ao buscar tenants:', err);
    }
  };

  const openEditModal = (tenant: AdminTenant) => {
    setSelectedTenant(tenant);
    setEditPlano(tenant.plano);
    setEditStatus(tenant.status);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!selectedTenant) return;
    try {
      await api.admin.updateTenant(selectedTenant.id, {
        plano: editPlano,
        status: editStatus,
      });
      setModalOpen(false);
      loadData();
    } catch (err) {
      console.error('Erro ao atualizar tenant:', err);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('pt-BR');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">{t('admin.title')}</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gray-900 border-gray-800">
          <div className="p-4">
            <p className="text-sm text-gray-400">{t('admin.stats.tenants')}</p>
            <p className="text-3xl font-bold text-white mt-2">{stats?.total_tenants || 0}</p>
          </div>
        </Card>
        <Card className="bg-gray-900 border-gray-800">
          <div className="p-4">
            <p className="text-sm text-gray-400">{t('admin.stats.alunos')}</p>
            <p className="text-3xl font-bold text-white mt-2">{stats?.total_alunos || 0}</p>
          </div>
        </Card>
        <Card className="bg-gray-900 border-gray-800">
          <div className="p-4">
            <p className="text-sm text-gray-400">{t('admin.stats.treinos')}</p>
            <p className="text-3xl font-bold text-white mt-2">{stats?.total_treinos || 0}</p>
          </div>
        </Card>
        <Card className="bg-gray-900 border-gray-800">
          <div className="p-4">
            <p className="text-sm text-gray-400">{t('admin.stats.revenue')}</p>
            <p className="text-3xl font-bold text-green-500 mt-2">
              {formatCurrency(stats?.revenue || 0)}
            </p>
          </div>
        </Card>
      </div>

      {/* Tenants Table */}
      <Card className="bg-gray-900 border-gray-800">
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">{t('admin.tenants.title')}</h2>
            <div className="flex gap-2">
              <Input
                value={busca}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBusca(e.target.value)}
                placeholder={t('common.search')}
                className="w-64"
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch}>{t('common.search')}</Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                    {t('common.name')}
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                    {t('common.email')}
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                    {t('admin.tenants.plan')}
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                    {t('admin.tenants.alunosCount')}
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                    {t('common.status')}
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                    {t('admin.tenants.lastLogin')}
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                    {t('common.actions')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {tenants.map((tenant) => (
                  <tr key={tenant.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="py-3 px-4 text-white">{tenant.nome}</td>
                    <td className="py-3 px-4 text-gray-400">{tenant.email}</td>
                    <td className="py-3 px-4">
                      <Badge variant="info">{tenant.plano}</Badge>
                    </td>
                    <td className="py-3 px-4 text-white">{tenant.alunos_count}</td>
                    <td className="py-3 px-4">
                      <Badge variant={tenant.status === 'active' ? 'success' : 'info'}>
                        {tenant.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-gray-400 text-sm">
                      {formatDate(tenant.last_login)}
                    </td>
                    <td className="py-3 px-4">
                      <Button size="sm" onClick={() => openEditModal(tenant)}>
                        {t('common.edit')}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      {/* Audit Log */}
      <Card className="bg-gray-900 border-gray-800">
        <div className="p-6 space-y-4">
          <h2 className="text-xl font-bold text-white">{t('admin.auditLog.title')}</h2>
          <div className="space-y-2">
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg"
              >
                <div className="flex-1">
                  <p className="text-white font-medium">{log.action}</p>
                  <p className="text-sm text-gray-400">
                    {log.user_nome} • {log.tenant_nome}
                  </p>
                </div>
                <p className="text-sm text-gray-500">{formatDate(log.timestamp)}</p>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}>
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white">{t('admin.tenants.edit')}</h2>
          {selectedTenant && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  {t('common.name')}
                </label>
                <Input value={selectedTenant.nome} disabled />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  {t('admin.tenants.plan')}
                </label>
                <Select
                  value={editPlano}
                  onChange={(e) => setEditPlano(e.target.value)}
                  options={[
                    { value: 'free', label: 'Free' },
                    { value: 'pro', label: 'Pro' },
                    { value: 'enterprise', label: 'Enterprise' },
                  ]}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  {t('common.status')}
                </label>
                <Select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  options={[
                    { value: 'active', label: t('common.active') },
                    { value: 'inactive', label: t('common.inactive') },
                  ]}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="secondary" onClick={() => setModalOpen(false)}>
                  {t('common.cancel')}
                </Button>
                <Button onClick={handleSave}>{t('common.save')}</Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
