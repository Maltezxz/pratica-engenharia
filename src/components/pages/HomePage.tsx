import { useEffect, useState, useCallback } from 'react';
import { Building2, Wrench, AlertTriangle, TrendingUp, Clock, Plus, Edit, CheckCircle, Trash2, MoveRight, MapPin, X, Calendar } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useRefresh } from '../../contexts/RefreshContext';
import { useNotification } from '../../contexts/NotificationContext';
import { getFerramentaPermissions } from '../../utils/permissions';
import { Obra, Ferramenta } from '../../types';

interface ObraWithFerramentas extends Obra {
  ferramentas?: Ferramenta[];
}

export default function HomePage() {
  const { user } = useAuth();
  const { refreshTrigger, triggerRefresh } = useRefresh();
  const { showToast } = useNotification();
  const [obras, setObras] = useState<ObraWithFerramentas[]>([]);
  const [ferramentas, setFerramentas] = useState<Ferramenta[]>([]);
  const [todasFerramentas, setTodasFerramentas] = useState<Ferramenta[]>([]);
  const [loading, setLoading] = useState(true);
  const [atividadesRecentes, setAtividadesRecentes] = useState<any[]>([]);
  const [selectedObra, setSelectedObra] = useState<ObraWithFerramentas | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedFerramentaId, setSelectedFerramentaId] = useState('');
  const [saving, setSaving] = useState(false);
  const [allowedFerramentaIds, setAllowedFerramentaIds] = useState<Set<string>>(new Set());

  const getActivityIcon = (tipoEvento: string) => {
    switch (tipoEvento) {
      case 'obra_criada':
        return { Icon: Plus, color: 'text-green-400', bg: 'bg-green-500/10' };
      case 'obra_editada':
        return { Icon: Edit, color: 'text-blue-400', bg: 'bg-blue-500/10' };
      case 'obra_finalizada':
        return { Icon: CheckCircle, color: 'text-purple-400', bg: 'bg-purple-500/10' };
      case 'movimentacao':
        return { Icon: MoveRight, color: 'text-orange-400', bg: 'bg-orange-500/10' };
      case 'ferramenta_criada':
        return { Icon: Wrench, color: 'text-emerald-400', bg: 'bg-emerald-500/10' };
      case 'ferramenta_editada':
        return { Icon: Edit, color: 'text-cyan-400', bg: 'bg-cyan-500/10' };
      case 'ferramenta_removida':
        return { Icon: Trash2, color: 'text-red-400', bg: 'bg-red-500/10' };
      case 'desaparecimento':
        return { Icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-500/10' };
      case 'localizacao_atualizada':
        return { Icon: MapPin, color: 'text-indigo-400', bg: 'bg-indigo-500/10' };
      default:
        return { Icon: Clock, color: 'text-gray-400', bg: 'bg-gray-500/10' };
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}/${month} - ${hours}:${minutes}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const loadData = useCallback(async () => {
    try {
      if (!user?.id) {
        setObras([]);
        setFerramentas([]);
        setTodasFerramentas([]);
        setAtividadesRecentes([]);
        setLoading(false);
        return;
      }

      console.log('🔄 [HOME] Carregando dados para:', user.name, 'Role:', user.role);

      const [obrasRes, ferramRes, historicoRes] = await Promise.all([
        supabase
          .from('obras')
          .select('id, title, endereco, engenheiro, created_at, image_url')
          .eq('status', 'ativa')
          .order('created_at', { ascending: false })
          .limit(5),

        supabase
          .from('ferramentas')
          .select('id, name, tipo, modelo, serial, current_type, current_id, status, created_at')
          .neq('status', 'desaparecida'),

        supabase
          .from('historico')
          .select('id, tipo_evento, descricao, created_at')
          .order('created_at', { ascending: false })
          .limit(5)
      ]);

      if (obrasRes.error) {
        console.error('❌ Erro obras:', obrasRes.error);
        setObras([]);
      } else {
        const allObras = obrasRes.data || [];

        if (ferramRes.data) {
          const obrasComFerramentas = allObras.map(obra => ({
            ...obra,
            ferramentas: ferramRes.data.filter(
              f => f.current_id === obra.id && f.current_type === 'obra'
            )
          }));
          setObras(obrasComFerramentas);
        } else {
          setObras(allObras);
        }
      }

      if (ferramRes.error) {
        console.error('❌ Erro ferramentas:', ferramRes.error);
        setFerramentas([]);
        setTodasFerramentas([]);
      } else {
        const allFerramentas = ferramRes.data || [];
        setFerramentas(allFerramentas);
        setTodasFerramentas(allFerramentas);
      }

      if (historicoRes.error) {
        console.error('❌ Erro histórico:', historicoRes.error);
        setAtividadesRecentes([]);
      } else {
        const allHistorico = historicoRes.data || [];
        setAtividadesRecentes(allHistorico.slice(0, 5));
      }

    } catch (error) {
      console.error('❌ [HOME] Erro geral:', error);
      setObras([]);
      setFerramentas([]);
      setTodasFerramentas([]);
      setAtividadesRecentes([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData, refreshTrigger]);

  useEffect(() => {
    const loadPermissions = async () => {
      if (!user?.id) return;

      if (user.role === 'host') {
        const allIds = new Set(todasFerramentas.map(f => f.id));
        setAllowedFerramentaIds(allIds);
      } else {
        const permissions = await getFerramentaPermissions(user.id);
        setAllowedFerramentaIds(permissions);
      }
    };

    loadPermissions();
  }, [user, todasFerramentas]);

  const totalEquipamentos = ferramentas.length;
  const [totalDesaparecidos, setTotalDesaparecidos] = useState(0);

  useEffect(() => {
    const fetchDesaparecidos = async () => {
      const { count } = await supabase
        .from('ferramentas')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'desaparecida');
      setTotalDesaparecidos(count || 0);
    };
    fetchDesaparecidos();
  }, [refreshTrigger]);

  const handleObraClick = (obra: ObraWithFerramentas) => {
    setSelectedObra(obra);
    setShowAddModal(true);
    setSelectedFerramentaId('');
  };

  const handleAddFerramenta = async () => {
    if (!selectedFerramentaId || !selectedObra) return;

    setSaving(true);
    try {
      const { error: updateError } = await supabase
        .from('ferramentas')
        .update({
          current_type: 'obra',
          current_id: selectedObra.id,
          status: 'em_uso',
        })
        .eq('id', selectedFerramentaId);

      if (updateError) throw updateError;

      const { data: movData, error: movError } = await supabase
        .from('movimentacoes')
        .insert({
          ferramenta_id: selectedFerramentaId,
          to_type: 'obra',
          to_id: selectedObra.id,
          user_id: user?.id,
          note: `Adicionado à obra ${selectedObra.title} via Home`,
        })
        .select()
        .single();

      if (movError) throw movError;

      const ferramenta = todasFerramentas.find(f => f.id === selectedFerramentaId);
      await supabase.from('historico').insert({
        tipo_evento: 'movimentacao',
        descricao: `Equipamento "${ferramenta?.name}" adicionado à ${selectedObra.title}`,
        movimentacao_id: movData?.id,
        user_id: user?.id,
        owner_id: user?.id,
        metadata: {
          ferramenta_nome: ferramenta?.name,
          destino: selectedObra.title,
          origem: 'Home'
        }
      });

      showToast('success', `Equipamento adicionado à ${selectedObra.title}!`);
      setShowAddModal(false);
      setSelectedObra(null);
      setSelectedFerramentaId('');
      await loadData();
      triggerRefresh();
    } catch (error: unknown) {
      console.error('Error adding ferramenta:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao adicionar equipamento';
      showToast('error', errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const ferramentasDisponiveis = todasFerramentas.filter(
    f => {
      const isAvailable = f.status === 'disponivel' || (!f.current_id && f.status !== 'em_uso' && f.status !== 'desaparecida');
      const hasPermission = user?.role === 'host' || allowedFerramentaIds.has(f.id);
      return isAvailable && hasPermission;
    }
  );

  const stats = [
    {
      label: 'Obras Ativas',
      value: obras.length,
      icon: Building2,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
    },
    {
      label: 'Equipamentos',
      value: totalEquipamentos,
      icon: Wrench,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20',
    },
    {
      label: 'Desaparecidos',
      value: totalDesaparecidos,
      icon: AlertTriangle,
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/20',
    },
  ];

  if (loading) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-64 bg-white/10 rounded-lg animate-pulse"></div>
            <div className="h-4 w-48 bg-white/5 rounded animate-pulse"></div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="relative overflow-hidden rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-white/10 rounded-xl animate-pulse"></div>
                <div className="w-5 h-5 bg-white/5 rounded animate-pulse"></div>
              </div>
              <div className="space-y-2">
                <div className="h-8 w-16 bg-white/10 rounded animate-pulse"></div>
                <div className="h-4 w-24 bg-white/5 rounded animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-white mb-2">
            Bem-vindo, {user?.name}
          </h1>
          <p className="text-gray-400">
            Visão geral das suas operações
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className={`relative group overflow-hidden rounded-2xl ${stat.bgColor} border ${stat.borderColor} backdrop-blur-xl transition-all duration-300 hover:scale-105`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>
              <div className="relative p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color}`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <TrendingUp className="w-5 h-5 text-gray-500" />
                </div>
                <div className="space-y-1">
                  <p className="text-3xl font-bold text-white">{stat.value}</p>
                  <p className="text-sm text-gray-400">{stat.label}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="relative overflow-hidden rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>
          <div className="relative p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Obras Ativas</h2>
              <Building2 className="w-5 h-5 text-gray-400" />
            </div>
            <div className="space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar">
              {obras.length === 0 ? (
                <p className="text-gray-400 text-sm py-8 text-center">
                  Nenhuma obra ativa
                </p>
              ) : (
                obras.slice(0, 5).map((obra) => {
                  const equipmentCount = obra.ferramentas?.length || 0;
                  return (
                    <div
                      key={obra.id}
                      onClick={() => handleObraClick(obra)}
                      className="relative p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-red-500/30 transition-all duration-200 group cursor-pointer"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="text-white font-medium mb-1 group-hover:text-red-400 transition-colors">
                            {obra.title}
                          </h3>
                          <p className="text-gray-400 text-sm">{obra.endereco}</p>
                          {obra.engenheiro && (
                            <p className="text-gray-500 text-xs mt-1">
                              Eng: {obra.engenheiro}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-black/50 backdrop-blur-sm">
                          <Wrench className="w-3.5 h-3.5 text-white" />
                          <span className="text-xs font-bold text-white">{equipmentCount}</span>
                        </div>
                      </div>

                      {obra.ferramentas && obra.ferramentas.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
                          {obra.ferramentas.slice(0, 3).map((ferramenta) => (
                            <div
                              key={ferramenta.id}
                              className="flex items-center space-x-3 p-2 rounded-lg bg-black/30 hover:bg-black/40 transition-colors"
                            >
                              <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-600 to-purple-500">
                                <Wrench className="w-3 h-3 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-white text-xs font-medium truncate">
                                  {ferramenta.name}
                                </p>
                                <div className="flex items-center space-x-2 mt-0.5">
                                  {ferramenta.modelo && (
                                    <span className="text-gray-400 text-xs truncate">
                                      {ferramenta.modelo}
                                    </span>
                                  )}
                                  {ferramenta.created_at && (
                                    <span className="text-gray-500 text-xs flex items-center space-x-1">
                                      <Calendar className="w-2.5 h-2.5" />
                                      <span>{formatDate(ferramenta.created_at)}</span>
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                          {obra.ferramentas.length > 3 && (
                            <p className="text-gray-500 text-xs text-center pt-1">
                              +{obra.ferramentas.length - 3} equipamento(s)
                            </p>
                          )}
                        </div>
                      )}

                      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Plus className="w-5 h-5 text-red-400" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>
          <div className="relative p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Atividades Recentes</h2>
              <Clock className="w-5 h-5 text-gray-400" />
            </div>
            <div className="space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar">
              {atividadesRecentes.length === 0 ? (
                <p className="text-gray-400 text-sm py-8 text-center">
                  Nenhuma atividade recente
                </p>
              ) : (
                atividadesRecentes.map((atividade, index) => {
                  const { Icon, color, bg } = getActivityIcon(atividade.tipo_evento);
                  return (
                    <div
                      key={atividade.id}
                      className="relative p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-200 group animate-fade-in"
                      style={{
                        animationDelay: `${index * 50}ms`
                      }}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`p-2 rounded-lg ${bg} flex-shrink-0`}>
                          <Icon className={`w-4 h-4 ${color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm leading-relaxed">
                            {atividade.descricao}
                          </p>
                          <div className="flex items-center space-x-2 mt-2">
                            <Clock className="w-3 h-3 text-gray-500" />
                            <span className="text-xs text-gray-500">
                              {formatDateTime(atividade.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {showAddModal && selectedObra && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md animate-scale-in">
            <div className="relative backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 shadow-2xl overflow-hidden">
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-white">Adicionar Equipamento</h2>
                    <p className="text-gray-400 text-sm mt-1">{selectedObra.title}</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      setSelectedObra(null);
                      setSelectedFerramentaId('');
                    }}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all duration-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-200">
                    Selecione o Equipamento
                  </label>
                  {user?.role !== 'host' && allowedFerramentaIds.size === 0 ? (
                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                      <p className="text-sm text-red-400 font-medium mb-1">
                        Sem permissões
                      </p>
                      <p className="text-xs text-gray-400">
                        Você não tem permissão para adicionar equipamentos. Entre em contato com o administrador.
                      </p>
                    </div>
                  ) : ferramentasDisponiveis.length === 0 ? (
                    <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                      <p className="text-sm text-yellow-400 font-medium mb-1">
                        Nenhum equipamento disponível
                      </p>
                      <p className="text-xs text-gray-400">
                        {user?.role === 'host'
                          ? 'Todos os equipamentos estão alocados ou cadastre novos na aba Equipamentos.'
                          : 'Todos os equipamentos permitidos para você estão alocados.'}
                      </p>
                    </div>
                  ) : (
                    <select
                      value={selectedFerramentaId}
                      onChange={(e) => setSelectedFerramentaId(e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all duration-200"
                    >
                      <option value="" className="bg-gray-900">Selecione...</option>
                      {ferramentasDisponiveis.map((ferramenta) => (
                        <option key={ferramenta.id} value={ferramenta.id} className="bg-gray-900">
                          {ferramenta.name} {ferramenta.modelo ? `- ${ferramenta.modelo}` : ''}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setSelectedObra(null);
                      setSelectedFerramentaId('');
                    }}
                    className="flex-1 px-4 py-3 bg-white/5 border border-white/10 text-white rounded-xl hover:bg-white/10 transition-all duration-200 font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleAddFerramenta}
                    disabled={!selectedFerramentaId || saving}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl hover:shadow-lg hover:shadow-red-500/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                  >
                    {saving ? 'Adicionando...' : 'Adicionar'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
