import { useEffect, useState, useCallback } from 'react';
import { Wrench, Plus, X, Edit, Trash2, MapPin, Phone, FileText, Calendar, Lock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { usePermissions } from '../../hooks/usePermissions';
import { useRefresh } from '../../contexts/RefreshContext';
import { useNotification } from '../../contexts/NotificationContext';
import { getFerramentaPermissions } from '../../utils/permissions';
import { AssistenciaTecnica, Ferramenta } from '../../types';

interface AssistenciaWithFerramentas extends AssistenciaTecnica {
  ferramentas?: Ferramenta[];
}

export default function AssistenciasTecnicasPage() {
  const { user } = useAuth();
  const { isHost } = usePermissions();
  const { refreshTrigger, triggerRefresh } = useRefresh();
  const { showToast } = useNotification();
  const [assistencias, setAssistencias] = useState<AssistenciaWithFerramentas[]>([]);
  const [ferramentas, setFerramentas] = useState<Ferramenta[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddFerramentaModal, setShowAddFerramentaModal] = useState(false);
  const [selectedAssistencia, setSelectedAssistencia] = useState<AssistenciaWithFerramentas | null>(null);
  const [selectedFerramentaId, setSelectedFerramentaId] = useState('');
  const [saving, setSaving] = useState(false);
  const [allowedFerramentaIds, setAllowedFerramentaIds] = useState<Set<string>>(new Set());
  const canInteract = isHost || allowedFerramentaIds.size > 0;

  const [formData, setFormData] = useState({
    name: '',
    endereco: '',
    contato: '',
    observacoes: '',
  });

  const loadData = useCallback(async () => {
    try {
      if (!user?.id) {
        setAssistencias([]);
        setFerramentas([]);
        setLoading(false);
        return;
      }

      // Para hosts: busca apenas suas ferramentas
      // Para funcionários: busca ferramentas do host dele
      const ownerId = user.role === 'host' ? user.id : user.host_id;
      console.log('🔍 Carregando dados para owner_id:', ownerId, '| Usuário:', user.email, '| Role:', user.role);

      const [assistenciasRes, ferramentasRes] = await Promise.all([
        supabase
          .from('assistencias_tecnicas')
          .select('*')
          .eq('owner_id', ownerId)
          .eq('status', 'ativa')
          .order('created_at', { ascending: false }),

        supabase
          .from('ferramentas')
          .select('*')
          .eq('owner_id', ownerId)
          .neq('status', 'desaparecida'),
      ]);

      if (assistenciasRes.error) {
        console.error('Erro ao carregar assistências:', assistenciasRes.error);
        setAssistencias([]);
      } else {
        const allAssistencias = assistenciasRes.data || [];

        if (ferramentasRes.data) {
          const assistenciasComFerramentas = allAssistencias.map(assistencia => ({
            ...assistencia,
            ferramentas: ferramentasRes.data.filter(
              f => f.current_id === assistencia.id && f.current_type === 'assistencia_tecnica'
            )
          }));
          setAssistencias(assistenciasComFerramentas);
        } else {
          setAssistencias(allAssistencias);
        }
      }

      if (ferramentasRes.error) {
        console.error('Erro ao carregar ferramentas:', ferramentasRes.error);
        setFerramentas([]);
      } else {
        const allFerramentas = ferramentasRes.data || [];
        console.log('🔧 Total ferramentas carregadas:', allFerramentas.length);
        console.log('Ferramentas disponíveis:', allFerramentas.filter(f =>
          f.status === 'disponivel' || (!f.current_id && f.status !== 'em_uso')
        ).length);
        setFerramentas(allFerramentas);
      }

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setAssistencias([]);
      setFerramentas([]);
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

      console.log('🔑 Carregando permissões para:', user.role, user.email);

      if (user.role === 'host') {
        const allIds = new Set(ferramentas.map(f => f.id));
        console.log('✅ HOST - Permissão para todas as', allIds.size, 'ferramentas');
        setAllowedFerramentaIds(allIds);
      } else {
        const permissions = await getFerramentaPermissions(user.id);
        console.log('✅ FUNCIONÁRIO - Permissões carregadas:', permissions.size, 'ferramentas');
        console.log('Ferramentas permitidas:', Array.from(permissions));
        setAllowedFerramentaIds(permissions);
      }
    };

    loadPermissions();
  }, [user, ferramentas]);

  const handleAddAssistencia = async () => {
    if (!formData.name.trim()) {
      showToast('error', 'Nome da assistência técnica é obrigatório');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('assistencias_tecnicas')
        .insert({
          name: formData.name,
          endereco: formData.endereco || null,
          contato: formData.contato || null,
          observacoes: formData.observacoes || null,
          owner_id: user?.id,
          status: 'ativa',
        });

      if (error) throw error;

      await supabase.from('historico').insert({
        tipo_evento: 'assistencia_criada',
        descricao: `Assistência técnica "${formData.name}" foi cadastrada`,
        user_id: user?.id,
        owner_id: user?.id,
      });

      showToast('success', 'Assistência técnica cadastrada com sucesso!');
      setShowAddModal(false);
      setFormData({ name: '', endereco: '', contato: '', observacoes: '' });
      await loadData();
      triggerRefresh();
    } catch (error: unknown) {
      console.error('Erro ao adicionar assistência:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao cadastrar assistência técnica';
      showToast('error', errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleEditAssistencia = async () => {
    if (!selectedAssistencia || !formData.name.trim()) {
      showToast('error', 'Nome da assistência técnica é obrigatório');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('assistencias_tecnicas')
        .update({
          name: formData.name,
          endereco: formData.endereco || null,
          contato: formData.contato || null,
          observacoes: formData.observacoes || null,
        })
        .eq('id', selectedAssistencia.id);

      if (error) throw error;

      await supabase.from('historico').insert({
        tipo_evento: 'assistencia_editada',
        descricao: `Assistência técnica "${formData.name}" foi atualizada`,
        user_id: user?.id,
        owner_id: user?.id,
      });

      showToast('success', 'Assistência técnica atualizada com sucesso!');
      setShowEditModal(false);
      setSelectedAssistencia(null);
      setFormData({ name: '', endereco: '', contato: '', observacoes: '' });
      await loadData();
      triggerRefresh();
    } catch (error: unknown) {
      console.error('Erro ao editar assistência:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao atualizar assistência técnica';
      showToast('error', errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAssistencia = async (assistencia: AssistenciaTecnica) => {
    if (!confirm(`Tem certeza que deseja excluir "${assistencia.name}"?`)) return;

    try {
      const { error } = await supabase
        .from('assistencias_tecnicas')
        .update({ status: 'inativa' })
        .eq('id', assistencia.id);

      if (error) throw error;

      await supabase.from('historico').insert({
        tipo_evento: 'assistencia_removida',
        descricao: `Assistência técnica "${assistencia.name}" foi removida`,
        user_id: user?.id,
        owner_id: user?.id,
      });

      showToast('success', 'Assistência técnica removida com sucesso!');
      await loadData();
      triggerRefresh();
    } catch (error: unknown) {
      console.error('Erro ao deletar assistência:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao remover assistência técnica';
      showToast('error', errorMessage);
    }
  };

  const handleAddFerramenta = async () => {
    if (!selectedFerramentaId || !selectedAssistencia) return;

    setSaving(true);
    try {
      const ferramenta = ferramentas.find(f => f.id === selectedFerramentaId);
      const fromType = ferramenta?.current_type;
      const fromId = ferramenta?.current_id;

      const { error: updateError } = await supabase
        .from('ferramentas')
        .update({
          current_type: 'assistencia_tecnica',
          current_id: selectedAssistencia.id,
          status: 'em_uso',
        })
        .eq('id', selectedFerramentaId);

      if (updateError) throw updateError;

      const { data: movData, error: movError } = await supabase
        .from('movimentacoes')
        .insert({
          ferramenta_id: selectedFerramentaId,
          from_type: fromType,
          from_id: fromId,
          to_type: 'assistencia_tecnica',
          to_id: selectedAssistencia.id,
          user_id: user?.id,
          note: `Enviado para assistência técnica ${selectedAssistencia.name}`,
        })
        .select()
        .single();

      if (movError) throw movError;

      await supabase.from('historico').insert({
        tipo_evento: 'movimentacao',
        descricao: `Equipamento "${ferramenta?.name}" enviado para assistência técnica ${selectedAssistencia.name}`,
        movimentacao_id: movData?.id,
        user_id: user?.id,
        owner_id: user?.id,
        metadata: {
          ferramenta_nome: ferramenta?.name,
          destino: selectedAssistencia.name,
          tipo_destino: 'assistencia_tecnica'
        }
      });

      showToast('success', `Equipamento enviado para ${selectedAssistencia.name}!`);
      setShowAddFerramentaModal(false);
      setSelectedAssistencia(null);
      setSelectedFerramentaId('');
      await loadData();
      triggerRefresh();
    } catch (error: unknown) {
      console.error('Erro ao adicionar ferramenta:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao adicionar equipamento';
      showToast('error', errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const ferramentasDisponiveis = ferramentas.filter(
    f => {
      // Ferramenta está disponível se:
      // 1. Status é 'disponivel' OU
      // 2. Não está em uso, desaparecida e não tem localização definida
      const isAvailable = f.status === 'disponivel' ||
                         (f.status !== 'em_uso' && f.status !== 'desaparecida' && !f.current_id);

      const hasPermission = user?.role === 'host' || allowedFerramentaIds.has(f.id);

      console.log(`🔍 Ferramenta: ${f.name} | Status: ${f.status} | current_id: ${f.current_id || 'null'} | current_type: ${f.current_type || 'null'} | Disponível: ${isAvailable} | Permissão: ${hasPermission}`);

      return isAvailable && hasPermission;
    }
  );

  console.log('📦 Total ferramentas carregadas:', ferramentas.length);
  console.log('📦 Total ferramentas disponíveis para seleção:', ferramentasDisponiveis.length);
  console.log('🔐 Permissões do usuário:', allowedFerramentaIds.size, 'ferramentas');

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-64 bg-white/10 rounded-lg animate-pulse"></div>
            <div className="h-4 w-48 bg-white/5 rounded animate-pulse"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-white/5 border border-white/10 rounded-2xl animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-white mb-2">Assistências Técnicas</h1>
          <p className="text-gray-400">
            {isHost
              ? 'Gerencie as assistências técnicas e equipamentos'
              : canInteract
              ? 'Visualize e gerencie equipamentos com permissão'
              : 'Visualização das assistências técnicas'}
          </p>
          {!isHost && !canInteract && (
            <div className="flex items-center space-x-2 mt-2 text-yellow-400 text-sm">
              <Lock className="w-4 h-4" />
              <span>Modo somente leitura - Sem permissões de edição</span>
            </div>
          )}
        </div>
        {isHost && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl hover:shadow-lg hover:shadow-red-500/50 transition-all duration-200"
          >
            <Plus className="w-5 h-5" />
            <span>Nova Assistência</span>
          </button>
        )}
      </div>

      {assistencias.length === 0 ? (
        <div className="text-center py-12">
          <Wrench className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg mb-2">Nenhuma assistência técnica cadastrada</p>
          <p className="text-gray-500 text-sm">Clique em "Nova Assistência" para começar</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assistencias.map((assistencia) => (
            <div
              key={assistencia.id}
              className="relative overflow-hidden rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl hover:bg-white/10 transition-all duration-200 group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>
              <div className="relative p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-white mb-2">{assistencia.name}</h3>
                    {assistencia.endereco && (
                      <div className="flex items-start space-x-2 text-gray-400 text-sm mb-2">
                        <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>{assistencia.endereco}</span>
                      </div>
                    )}
                    {assistencia.contato && (
                      <div className="flex items-center space-x-2 text-gray-400 text-sm mb-2">
                        <Phone className="w-4 h-4 flex-shrink-0" />
                        <span>{assistencia.contato}</span>
                      </div>
                    )}
                    {assistencia.observacoes && (
                      <div className="flex items-start space-x-2 text-gray-400 text-sm">
                        <FileText className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span className="line-clamp-2">{assistencia.observacoes}</span>
                      </div>
                    )}
                  </div>
                  {isHost && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedAssistencia(assistencia);
                          setFormData({
                            name: assistencia.name,
                            endereco: assistencia.endereco || '',
                            contato: assistencia.contato || '',
                            observacoes: assistencia.observacoes || '',
                          });
                          setShowEditModal(true);
                        }}
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all duration-200"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteAssistencia(assistencia)}
                        className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-all duration-200"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {assistencia.ferramentas && assistencia.ferramentas.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-300">Equipamentos</span>
                      <span className="text-xs text-gray-500">{assistencia.ferramentas.length}</span>
                    </div>
                    {assistencia.ferramentas.slice(0, 3).map((ferramenta) => (
                      <div
                        key={ferramenta.id}
                        className="flex items-center space-x-3 p-2 rounded-lg bg-black/30 hover:bg-black/40 transition-colors"
                      >
                        <div className="p-1.5 rounded-lg bg-gradient-to-br from-orange-600 to-orange-500">
                          <Wrench className="w-3 h-3 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-xs font-medium truncate">{ferramenta.name}</p>
                          <div className="flex items-center space-x-2 mt-0.5">
                            {ferramenta.modelo && (
                              <span className="text-gray-400 text-xs truncate">{ferramenta.modelo}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {assistencia.ferramentas.length > 3 && (
                      <p className="text-gray-500 text-xs text-center pt-1">
                        +{assistencia.ferramentas.length - 3} equipamento(s)
                      </p>
                    )}
                  </div>
                )}

                {canInteract ? (
                  <button
                    onClick={() => {
                      setSelectedAssistencia(assistencia);
                      setShowAddFerramentaModal(true);
                    }}
                    className="mt-4 w-full flex items-center justify-center space-x-2 px-4 py-2 bg-white/5 border border-white/10 text-white rounded-xl hover:bg-white/10 hover:border-red-500/30 transition-all duration-200"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="text-sm">Adicionar Equipamento</span>
                  </button>
                ) : (
                  <div className="mt-4 w-full flex items-center justify-center space-x-2 px-4 py-2 bg-white/5 border border-white/10 text-gray-500 rounded-xl cursor-not-allowed opacity-50">
                    <Lock className="w-4 h-4" />
                    <span className="text-sm">Sem permissão para adicionar</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md animate-scale-in">
            <div className="relative backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 shadow-2xl overflow-hidden">
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-white">Nova Assistência Técnica</h2>
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      setFormData({ name: '', endereco: '', contato: '', observacoes: '' });
                    }}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all duration-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">Nome *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all duration-200"
                    placeholder="Nome da assistência técnica"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">Endereço</label>
                  <input
                    type="text"
                    value={formData.endereco}
                    onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all duration-200"
                    placeholder="Endereço ou localização"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">Contato</label>
                  <input
                    type="text"
                    value={formData.contato}
                    onChange={(e) => setFormData({ ...formData, contato: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all duration-200"
                    placeholder="Telefone, email, etc"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">Observações</label>
                  <textarea
                    value={formData.observacoes}
                    onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all duration-200 resize-none"
                    placeholder="Informações complementares"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      setFormData({ name: '', endereco: '', contato: '', observacoes: '' });
                    }}
                    className="flex-1 px-4 py-3 bg-white/5 border border-white/10 text-white rounded-xl hover:bg-white/10 transition-all duration-200 font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleAddAssistencia}
                    disabled={!formData.name.trim() || saving}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl hover:shadow-lg hover:shadow-red-500/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                  >
                    {saving ? 'Salvando...' : 'Cadastrar'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showEditModal && selectedAssistencia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md animate-scale-in">
            <div className="relative backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 shadow-2xl overflow-hidden">
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-white">Editar Assistência Técnica</h2>
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedAssistencia(null);
                      setFormData({ name: '', endereco: '', contato: '', observacoes: '' });
                    }}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all duration-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">Nome *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all duration-200"
                    placeholder="Nome da assistência técnica"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">Endereço</label>
                  <input
                    type="text"
                    value={formData.endereco}
                    onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all duration-200"
                    placeholder="Endereço ou localização"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">Contato</label>
                  <input
                    type="text"
                    value={formData.contato}
                    onChange={(e) => setFormData({ ...formData, contato: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all duration-200"
                    placeholder="Telefone, email, etc"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">Observações</label>
                  <textarea
                    value={formData.observacoes}
                    onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all duration-200 resize-none"
                    placeholder="Informações complementares"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedAssistencia(null);
                      setFormData({ name: '', endereco: '', contato: '', observacoes: '' });
                    }}
                    className="flex-1 px-4 py-3 bg-white/5 border border-white/10 text-white rounded-xl hover:bg-white/10 transition-all duration-200 font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleEditAssistencia}
                    disabled={!formData.name.trim() || saving}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl hover:shadow-lg hover:shadow-red-500/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                  >
                    {saving ? 'Salvando...' : 'Salvar'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddFerramentaModal && selectedAssistencia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md animate-scale-in">
            <div className="relative backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 shadow-2xl overflow-hidden">
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-white">Adicionar Equipamento</h2>
                    <p className="text-gray-400 text-sm mt-1">{selectedAssistencia.name}</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowAddFerramentaModal(false);
                      setSelectedAssistencia(null);
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
                      setShowAddFerramentaModal(false);
                      setSelectedAssistencia(null);
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
