import { useState, useEffect } from 'react';
import { api, AnalyticsDashboard, AlunoAnalytics, Aluno } from '../../lib/api';
import { useTranslation } from '../../lib/i18n';
import { Card } from '../../components/ui/Card';
import { Select } from '../../components/ui/Select';

export default function AnalyticsPage() {
  const { t } = useTranslation();
  const [dashboard, setDashboard] = useState<AnalyticsDashboard | null>(null);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [selectedAlunoId, setSelectedAlunoId] = useState<string>('');
  const [alunoStats, setAlunoStats] = useState<AlunoAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedAlunoId) {
      loadAlunoStats(selectedAlunoId);
    } else {
      setAlunoStats(null);
    }
  }, [selectedAlunoId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [dashboardData, alunosData] = await Promise.all([
        api.analytics.dashboard(),
        api.alunos.list(1, 100),
      ]);
      setDashboard(dashboardData);
      setAlunos(alunosData.data);
    } catch (err) {
      console.error('Erro ao carregar analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAlunoStats = async (alunoId: string) => {
    try {
      const data = await api.analytics.alunoAnalytics(alunoId);
      setAlunoStats(data);
    } catch (err) {
      console.error('Erro ao carregar stats do aluno:', err);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">{t('common.loading')}</p>
      </div>
    );
  }

  const maxTreinos = Math.max(...(dashboard?.treinos_por_dia.map((d) => d.count) || [1]));

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">{t('analytics.title')}</h1>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gray-900 border-gray-800">
          <div className="p-4">
            <p className="text-sm text-gray-400">{t('analytics.alunosAtivos')}</p>
            <p className="text-3xl font-bold text-white mt-2">
              {dashboard?.alunos_ativos || 0}
            </p>
          </div>
        </Card>
        <Card className="bg-gray-900 border-gray-800">
          <div className="p-4">
            <p className="text-sm text-gray-400">{t('analytics.treinosSemana')}</p>
            <p className="text-3xl font-bold text-white mt-2">
              {dashboard?.treinos_semana || 0}
            </p>
          </div>
        </Card>
        <Card className="bg-gray-900 border-gray-800">
          <div className="p-4">
            <p className="text-sm text-gray-400">{t('analytics.taxaAderencia')}</p>
            <p className="text-3xl font-bold text-green-500 mt-2">
              {formatPercent(dashboard?.taxa_aderencia || 0)}
            </p>
          </div>
        </Card>
        <Card className="bg-gray-900 border-gray-800">
          <div className="p-4">
            <p className="text-sm text-gray-400">{t('analytics.receitaMes')}</p>
            <p className="text-3xl font-bold text-green-500 mt-2">
              {formatCurrency(dashboard?.receita_mes || 0)}
            </p>
          </div>
        </Card>
      </div>

      {/* Chart: Treinos por Dia */}
      <Card className="bg-gray-900 border-gray-800">
        <div className="p-6 space-y-4">
          <h2 className="text-xl font-bold text-white">{t('analytics.treinosPorDia')}</h2>
          <div className="flex items-end gap-1 h-64">
            {dashboard?.treinos_por_dia.map((item, idx) => {
              const height = maxTreinos > 0 ? (item.count / maxTreinos) * 100 : 0;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                  <div className="flex-1 flex items-end w-full">
                    <div
                      className="w-full bg-green-500 rounded-t transition-all hover:bg-green-400"
                      style={{ height: `${height}%` }}
                      title={`${item.data}: ${item.count} treinos`}
                    />
                  </div>
                  <p className="text-xs text-gray-500 transform -rotate-45 origin-top-left mt-2">
                    {new Date(item.data).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                    })}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 5 Ranking */}
        <Card className="bg-gray-900 border-gray-800">
          <div className="p-6 space-y-4">
            <h2 className="text-xl font-bold text-white">{t('analytics.topRanking')}</h2>
            <div className="space-y-2">
              {dashboard?.top_ranking.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                        idx === 0
                          ? 'bg-yellow-500 text-gray-900'
                          : idx === 1
                          ? 'bg-gray-400 text-gray-900'
                          : idx === 2
                          ? 'bg-orange-600 text-white'
                          : 'bg-gray-700 text-white'
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <p className="text-white font-medium">{item.aluno_nome}</p>
                  </div>
                  <p className="text-green-500 font-bold">{item.treinos} treinos</p>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Aluno Individual Analytics */}
        <Card className="bg-gray-900 border-gray-800">
          <div className="p-6 space-y-4">
            <h2 className="text-xl font-bold text-white">{t('analytics.alunoStats')}</h2>
            <Select
              value={selectedAlunoId}
              onChange={(e) => setSelectedAlunoId(e.target.value)}
              options={[
                { value: '', label: t('analytics.selectAluno') },
                ...alunos.map((a) => ({ value: a.id, label: a.nome })),
              ]}
            />
            {alunoStats && (
              <div className="space-y-3">
                <div className="p-3 bg-gray-800/50 rounded-lg">
                  <p className="text-sm text-gray-400">Total de Treinos</p>
                  <p className="text-2xl font-bold text-white">{alunoStats.total_treinos}</p>
                </div>
                <div className="p-3 bg-gray-800/50 rounded-lg">
                  <p className="text-sm text-gray-400">Frequência Média</p>
                  <p className="text-2xl font-bold text-white">
                    {alunoStats.frequencia_media.toFixed(1)}x/semana
                  </p>
                </div>
                <div className="p-3 bg-gray-800/50 rounded-lg">
                  <p className="text-sm text-gray-400">Última Execução</p>
                  <p className="text-lg font-medium text-white">
                    {formatDate(alunoStats.ultima_execucao)}
                  </p>
                </div>
                {alunoStats.evolucao_peso.length > 0 && (
                  <div className="p-3 bg-gray-800/50 rounded-lg">
                    <p className="text-sm text-gray-400 mb-2">Evolução de Peso</p>
                    <div className="space-y-1">
                      {alunoStats.evolucao_peso.slice(-5).map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-gray-400">{formatDate(item.data)}</span>
                          <span className="text-white font-medium">{item.peso} kg</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
