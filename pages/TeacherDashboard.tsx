import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AreaChart, Area, ResponsiveContainer } from 'recharts'; // Keeping for potential future use or if we can map history
import { useTeacherDashboardData } from '../src/hooks/useTeacherDashboardData';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../src/lib/api';

export const TeacherDashboard: React.FC = () => {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [editFormData, setEditFormData] = useState({
    days: [] as string[],
    time: '',
    location: ''
  });
  const [saving, setSaving] = useState(false);

  const {
    loading,
    error,
    stats,
    classes,
    riskStudents,
    schedule,
    notices,
    pendingAttendance,
    pendingClasses
  } = useTeacherDashboardData();

  // Get first name
  const firstName = session?.user?.user_metadata?.full_name?.split(' ')[0] || 'Professor';

  const handleOpenEditModal = (cls: any) => {
    setSelectedClass(cls);
    setEditFormData({
      days: cls.days || [],
      time: cls.time || '',
      location: cls.location || ''
    });
    setShowEditModal(true);
  };

  const handleDayToggle = (day: string) => {
    setEditFormData(prev => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter(d => d !== day)
        : [...prev.days, day]
    }));
  };

  const handleSaveSchedule = async () => {
    if (!selectedClass) return;

    if (editFormData.days.length === 0) {
      alert('Selecione pelo menos um dia da semana');
      return;
    }

    if (!editFormData.time.trim()) {
      alert('Informe o horário da turma');
      return;
    }

    setSaving(true);
    try {
      await api.updateClassSchedule(selectedClass.id, editFormData);
      alert('Horários atualizados com sucesso!');
      setShowEditModal(false);
      window.location.reload(); // Reload to update data
    } catch (err) {
      console.error('Error updating schedule:', err);
      alert('Erro ao atualizar horários. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 text-center p-10">{error}</div>;
  }

  return (
    <div className="max-w-6xl mx-auto pb-10">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-text-light dark:text-text-dark mb-1">Olá, {firstName}!</h1>
          <p className="text-muted dark:text-muted-dark">Você tem <strong className="text-primary">{stats.classesToday} aulas</strong> agendadas para hoje.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden md:block">
            {schedule.length > 0 ? (
              <>
                <p className="text-xs font-bold text-muted dark:text-muted-dark uppercase">Próxima Aula</p>
                <p className="font-bold text-text-light dark:text-text-dark">{schedule[0].name} - {schedule[0].time}</p>
              </>
            ) : (
              <p className="text-sm font-bold text-muted dark:text-muted-dark">Sem mais aulas hoje</p>
            )}
          </div>
          <div className="h-10 w-px bg-gray-300 hidden md:block"></div>
          <Link to="/attendance" className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-lg font-bold hover:bg-primary/90 transition-colors shadow-lg hover:shadow-xl active:scale-95">
            <span className="material-symbols-outlined">checklist</span>
            Registrar Chamada
          </Link>
        </div>
      </header>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-card-light dark:bg-card-dark p-4 rounded-xl border border-border-light dark:border-border-dark shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <span className="material-symbols-outlined">calendar_today</span>
            </div>
            <span className="text-sm font-bold text-muted dark:text-muted-dark">Aulas Hoje</span>
          </div>
          <p className="text-3xl font-black text-text-light dark:text-text-dark">{stats.classesToday}</p>
        </div>

        <div className="bg-card-light dark:bg-card-dark p-4 rounded-xl border border-border-light dark:border-border-dark shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <span className="material-symbols-outlined">groups</span>
            </div>
            <span className="text-sm font-bold text-muted dark:text-muted-dark">Alunos Esperados</span>
          </div>
          <p className="text-3xl font-black text-text-light dark:text-text-dark">{stats.studentsExpected}</p>
        </div>

        <div className="bg-card-light dark:bg-card-dark p-4 rounded-xl border border-border-light dark:border-border-dark shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center gap-3 mb-2 relative z-10">
            <div className="p-2 bg-green-50 text-green-600 rounded-lg">
              <span className="material-symbols-outlined">trending_up</span>
            </div>
            <span className="text-sm font-bold text-muted dark:text-muted-dark">Frequência Média</span>
          </div>
          <div className="flex items-end justify-between relative z-10">
            <p className="text-3xl font-black text-text-light dark:text-text-dark">{stats.attendanceRate}%</p>
            {/* Placeholder for trend */}
            {/* <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full">+4% essa semana</span> */}
          </div>
          {/* Sparkline removed as we don't have daily history readily available yet */}
        </div>

        <div className="bg-card-light dark:bg-card-dark p-4 rounded-xl border border-orange-200 shadow-sm flex flex-col justify-between bg-orange-50/30">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
              <span className="material-symbols-outlined">assignment_late</span>
            </div>
            <span className="text-sm font-bold text-orange-800">Pendências</span>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-3xl font-black text-orange-900">{pendingAttendance ? 1 : 0}</p>
            {pendingAttendance && (
              <Link to="/attendance" className="text-xs font-bold text-orange-700 hover:underline">Resolver</Link>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 flex flex-col gap-8">

          {/* Pending Attendance Alert */}
          {pendingAttendance && (
            <section className="bg-white dark:bg-card-dark border-l-4 border-orange-500 rounded-r-xl shadow-sm p-4 flex items-center justify-between animate-in fade-in slide-in-from-left-4 duration-500">
              <div className="flex items-center gap-4">
                <div className="bg-orange-100 p-2 rounded-full text-orange-600">
                  <span className="material-symbols-outlined">history</span>
                </div>
                <div>
                  <h3 className="font-bold text-text-light dark:text-text-dark">
                    {pendingAttendance.count > 1
                      ? `${pendingAttendance.count} Chamadas Pendentes`
                      : 'Chamada Pendente'
                    }
                  </h3>
                  <p className="text-sm text-muted dark:text-muted-dark">
                    {pendingAttendance.count > 1
                      ? `Última: ${pendingAttendance.className} (${pendingAttendance.date}). Verifique todas as aulas do mês.`
                      : `${pendingAttendance.className} (${pendingAttendance.date}) ainda não foi registrada.`
                    }
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPendingModal(true)}
                className="px-4 py-2 bg-orange-100 text-orange-700 font-bold rounded-lg text-sm hover:bg-orange-200 transition-colors"
              >
                Ver Todas
              </button>
            </section>
          )}

          {/* Classes List */}
          <section className="bg-card-light dark:bg-card-dark rounded-xl p-6 shadow-sm border border-border-light dark:border-border-dark">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Suas Turmas</h2>
              {/* <button className="text-sm font-bold text-primary hover:underline">Ver grade completa</button> */}
            </div>
            <div className="grid grid-cols-1 gap-4">
              {classes.length > 0 ? (
                classes.map((cls) => (
                  <div
                    key={cls.id}
                    onClick={() => handleOpenEditModal(cls)}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-border-light dark:border-border-dark rounded-xl hover:border-primary/30 hover:shadow-md transition-all bg-white dark:bg-card-dark group cursor-pointer"
                  >
                    <div className="flex items-center gap-4 mb-3 sm:mb-0">
                      <div className="w-12 h-12 rounded-lg bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                        <span className="material-symbols-outlined">skateboarding</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-text-light dark:text-text-dark text-lg">{cls.name}</h3>
                        <p className="text-sm text-muted dark:text-muted-dark">
                          {cls.days?.join('/')} {cls.time}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 sm:gap-8">
                      <div className="text-right">
                        <div className="flex items-center gap-2 justify-end">
                          <span className="text-lg font-bold text-text-light dark:text-text-dark">{cls.student_count}</span>
                          <span className="material-symbols-outlined text-muted dark:text-muted-dark text-sm">person</span>
                        </div>
                        <p className="text-xs text-muted dark:text-muted-dark">Alunos ativos</p>
                      </div>
                      <span className="material-symbols-outlined text-muted dark:text-muted-dark group-hover:text-primary transition-colors">chevron_right</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted dark:text-muted-dark py-4">Nenhuma turma encontrada.</p>
              )}
            </div>
          </section>

          {/* Risk Alerts */}
          <section className="bg-card-light dark:bg-card-dark rounded-xl p-6 shadow-sm border border-border-light dark:border-border-dark">
            <div className="flex items-center gap-2 mb-4 text-red-600">
              <span className="material-symbols-outlined">warning</span>
              <h2 className="text-xl font-bold text-text-light dark:text-text-dark">Atenção Necessária</h2>
            </div>
            <p className="text-muted dark:text-muted-dark mb-4 text-sm">Alunos que atingiram o limite de faltas consecutivas (3+).</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {riskStudents.length > 0 ? (
                riskStudents.map((risk, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-100">
                    <div className="flex items-center gap-3">
                      {risk.student.avatar_url ? (
                        <img src={risk.student.avatar_url} alt={risk.student.full_name} className="w-10 h-10 rounded-full border-2 border-white shadow-sm" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-red-200 flex items-center justify-center text-red-700 font-bold">
                          {risk.student.full_name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-gray-800 dark:text-white text-sm">{risk.student.full_name}</p>
                        <p className="text-xs text-red-600/80 font-medium">{risk.className}</p>
                      </div>
                    </div>
                    <div className="text-center">
                      <span className="block font-black text-xl text-red-600 leading-none">{risk.consecutiveAbsences}</span>
                      <span className="text-[10px] font-bold text-red-400 uppercase">Faltas</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted dark:text-muted-dark text-sm col-span-2">Nenhum aluno em risco no momento.</p>
              )}
            </div>
          </section>
        </div>

        {/* Right Column - Sidebar */}
        <div className="flex flex-col gap-6">
          {/* Upcoming Classes */}
          <section className="bg-card-light dark:bg-card-dark rounded-xl p-6 shadow-sm border border-border-light dark:border-border-dark">
            <h2 className="text-xl font-bold mb-4">Agenda de Hoje</h2>
            <div className="relative pl-4 border-l-2 border-gray-100 space-y-6">
              {schedule.length > 0 ? (
                schedule.map((cls, idx) => (
                  <div key={idx} className="relative">
                    <div className={`absolute -left-[21px] top-1.5 w-3 h-3 rounded-full border-2 border-white shadow-sm ${cls.status === 'active' ? 'bg-primary ring-4 ring-primary/10' : 'bg-gray-300'}`}></div>
                    <div className={`p-3 rounded-lg border transition-colors ${cls.status === 'active' ? 'bg-primary/5 border-primary/20' : 'bg-gray-50 border-gray-100'}`}>
                      <div className="flex justify-between items-start mb-1">
                        <span className={`text-xs font-bold ${cls.status === 'active' ? 'text-primary' : 'text-muted'}`}>
                          {cls.time} - {cls.endTime}
                        </span>
                        {cls.status === 'active' && <span className="inline-block w-2 h-2 bg-red-500 rounded-full animate-pulse" title="Acontecendo agora"></span>}
                      </div>
                      <p className="font-bold text-text-light dark:text-text-dark">{cls.name}</p>
                      <div className="flex items-center gap-1 text-xs text-muted dark:text-muted-dark mt-1">
                        <span className="material-symbols-outlined text-[14px]">location_on</span>
                        {cls.location}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted dark:text-muted-dark text-sm">Nenhuma aula agendada para hoje.</p>
              )}
            </div>
          </section>

          {/* Notice Board */}
          <section className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 shadow-lg text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 opacity-10">
              <span className="material-symbols-outlined text-8xl">campaign</span>
            </div>
            <div className="relative z-10">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-yellow-400">notifications</span>
                Avisos da Coordenação
              </h2>
              <div className="space-y-4">
                {notices.length > 0 ? (
                  notices.map((notice) => (
                    <div key={notice.id} className="bg-white/5 p-3 rounded-lg border border-white/10 backdrop-blur-sm">
                      <p className={`text-xs font-bold mb-1 uppercase ${notice.type === 'maintenance' ? 'text-yellow-400' :
                          notice.type === 'event' ? 'text-blue-300' : 'text-gray-300'
                        }`}>
                        {notice.type === 'maintenance' ? 'Manutenção' : notice.type === 'event' ? 'Evento' : 'Aviso'}
                      </p>
                      <p className="text-sm leading-relaxed">{notice.content}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-400">Nenhum aviso no momento.</p>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Pending Classes Modal */}
      {showPendingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-card-dark rounded-xl p-6 max-w-2xl w-full shadow-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-text-light dark:text-text-dark">Chamadas Pendentes</h3>
              <button
                onClick={() => setShowPendingModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-100 transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {pendingClasses.length === 0 ? (
              <div className="text-center py-8">
                <span className="material-symbols-outlined text-6xl text-green-500 mb-4">check_circle</span>
                <p className="text-lg font-bold text-gray-800 dark:text-white">Todas as chamadas em dia!</p>
                <p className="text-sm text-muted dark:text-muted-dark">Nenhuma aula pendente no mês atual.</p>
              </div>
            ) : (
              <>
                <p className="text-sm text-muted dark:text-muted-dark mb-4">
                  {pendingClasses.length} aula(s) do mês atual sem registro de chamada.
                  Clique em "Registrar" para fazer a chamada ou "Cancelar Aula" se ela não ocorreu.
                </p>

                <div className="space-y-3">
                  {pendingClasses.map((pending, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-orange-50 border border-orange-200 rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center gap-3 mb-3 sm:mb-0">
                        <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
                          <span className="material-symbols-outlined">event</span>
                        </div>
                        <div>
                          <p className="font-bold text-gray-800 dark:text-white">{pending.className}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-100">
                            {pending.dateFormatted} • {pending.dayOfWeek}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setShowPendingModal(false);
                            navigate(`/attendance?classId=${pending.classId}&date=${pending.date}`);
                          }}
                          className="flex-1 sm:flex-none px-4 py-2 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-colors text-sm"
                        >
                          Registrar
                        </button>
                        <button
                          onClick={() => {
                            setShowPendingModal(false);
                            navigate(`/attendance?classId=${pending.classId}&date=${pending.date}&cancel=true`);
                          }}
                          className="flex-1 sm:flex-none px-4 py-2 bg-white dark:bg-card-dark text-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 font-bold rounded-lg hover:bg-gray-50 dark:bg-gray-800 transition-colors text-sm"
                        >
                          Cancelar Aula
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Edit Class Schedule Modal */}
      {showEditModal && selectedClass && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-card-dark rounded-xl p-6 max-w-lg w-full shadow-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-text-light dark:text-text-dark">Editar Horários</h3>
                <p className="text-sm text-muted dark:text-muted-dark mt-1">{selectedClass.name}</p>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-100 transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-6">
              {/* Days Selection */}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-white mb-3">
                  Dias da Semana
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'].map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleDayToggle(day)}
                      className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${editFormData.days.includes(day)
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-100 hover:bg-gray-200'
                        }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Input */}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-white mb-2">
                  Horário
                </label>
                <input
                  type="text"
                  value={editFormData.time}
                  onChange={(e) => setEditFormData({ ...editFormData, time: e.target.value })}
                  placeholder="Ex: 14:00 - 16:00"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
                <p className="text-xs text-gray-500 dark:text-gray-300 mt-1">Formato sugerido: 14:00 - 16:00</p>
              </div>

              {/* Location Input */}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-white mb-2">
                  Local
                </label>
                <input
                  type="text"
                  value={editFormData.location}
                  onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
                  placeholder="Ex: Pista Principal"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setShowEditModal(false)}
                disabled={saving}
                className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-white rounded-lg hover:bg-gray-50 dark:bg-gray-800 font-bold transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveSchedule}
                disabled={saving}
                className="flex-1 px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Salvando...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-lg">save</span>
                    Salvar Alterações
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
