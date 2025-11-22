import React from 'react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Link } from 'react-router-dom';
import { useAdminDashboardData } from '../src/hooks/useAdminDashboardData';

export const AdminDashboard: React.FC = () => {
  const [showPendingModal, setShowPendingModal] = React.useState(false);
  const {
    loading,
    error,
    stats,
    weeklyAttendance,
    classDistribution,
    recentActivities,
    dateRange,
    totalActivities,
    currentPage,
    itemsPerPage,
    pendingAttendanceCount,
    pendingAttendanceList,
    notices,
    setCurrentPage,
  } = useAdminDashboardData();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto pb-10">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <span className="material-symbols-outlined text-red-600 text-4xl mb-2">error</span>
          <p className="text-red-800 font-bold">{error}</p>
        </div>
      </div>
    );
  }
  return (
    <div className="max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-text-light dark:text-text-dark">Visão Geral</h1>
          <p className="text-muted dark:text-muted-dark">Gestão pedagógica e acompanhamento de alunos.</p>
        </div>
        <div className="flex gap-3">
          <Link to="/reports" className="flex items-center gap-2 bg-white dark:bg-card-dark border border-border-light dark:border-border-dark px-4 py-2 rounded-lg text-sm font-bold text-muted dark:text-muted-dark hover:text-primary hover:border-primary/30 transition-colors shadow-sm">
            <span className="material-symbols-outlined text-lg">download</span>
            Relatório
          </Link>
          <Link to="/register" className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold shadow hover:bg-primary/90 transition-colors">
            <span className="material-symbols-outlined text-lg">add</span>
            Nova Matrícula
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* New Students (Growth) */}
        <div className="bg-card-light dark:bg-card-dark p-5 rounded-xl border border-border-light dark:border-border-dark shadow-sm flex flex-col justify-between group">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-teal-50 text-teal-600 rounded-lg group-hover:bg-teal-100 transition-colors">
              <span className="material-symbols-outlined">trending_up</span>
            </div>
            <span className="text-sm font-bold text-muted dark:text-muted-dark">Novos Alunos (Mês)</span>
          </div>
          <div>
            <h3 className="text-3xl font-black text-text-light dark:text-text-dark">{stats.newStudentsThisMonth}</h3>
            <p className="text-xs text-muted dark:text-muted-dark mt-1 font-medium text-teal-600">Novos este mês</p>
          </div>
        </div>

        {/* Total Students */}
        <div className="bg-card-light dark:bg-card-dark p-5 rounded-xl border border-border-light dark:border-border-dark shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <span className="material-symbols-outlined">groups</span>
            </div>
            <span className="text-sm font-bold text-muted dark:text-muted-dark">Total de Alunos</span>
          </div>
          <p className="text-3xl font-black text-text-light dark:text-text-dark">{stats.totalStudents}</p>
          <p className="text-xs text-muted dark:text-muted-dark mt-2">Alunos ativos no sistema</p>
        </div>

        {/* Active Classes */}
        <div className="bg-card-light dark:bg-card-dark p-5 rounded-xl border border-border-light dark:border-border-dark shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <span className="material-symbols-outlined">skateboarding</span>
            </div>
            <span className="text-sm font-bold text-muted dark:text-muted-dark">Turmas Ativas</span>
          </div>
          <p className="text-3xl font-black text-text-light dark:text-text-dark">{stats.activeClasses}</p>
          <div className="w-full bg-gray-100 dark:bg-gray-700 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-purple-500 h-full rounded-full" style={{ width: '100%' }}></div>
          </div>
          <p className="text-[10px] text-muted dark:text-muted-dark mt-1 font-bold">Todas com professor alocado</p>
        </div>

        {/* Alerts */}
        <div className="bg-card-light dark:bg-card-dark p-5 rounded-xl border border-red-100 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-red-500 blur-2xl opacity-10 rounded-full"></div>
          <div className="flex items-center gap-3 mb-2 relative z-10">
            <div className="p-2 bg-red-50 text-red-600 rounded-lg">
              <span className="material-symbols-outlined">warning</span>
            </div>
            <span className="text-sm font-bold text-red-800">Risco de Evasão</span>
          </div>
          <div className="flex items-end justify-between relative z-10">
            <p className="text-3xl font-black text-text-light dark:text-text-dark">{stats.riskStudents}</p>
            <Link to="/reports" className="text-xs font-bold text-red-600 hover:underline flex items-center">
              Ver lista <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>
          <p className="text-xs text-muted dark:text-muted-dark mt-2 relative z-10">Alunos com 3+ faltas consecutivas</p>
        </div>
      </div>

      {/* Alerts Section */}
      <div className="mb-8 space-y-4">
        {/* Pending Attendance Alert */}
        {pendingAttendanceCount > 0 && (
          <div className="animate-in slide-in-from-top-4 duration-500">
            <div
              onClick={() => setShowPendingModal(true)}
              className="bg-orange-50 border-l-4 border-orange-500 rounded-r-xl p-6 shadow-sm flex items-center justify-between cursor-pointer hover:bg-orange-100/50 transition-colors group relative overflow-hidden"
            >
              <div className="flex items-center gap-4 relative z-10">
                <div className="p-3 bg-orange-100 rounded-full text-orange-600 animate-pulse group-hover:bg-orange-200 transition-colors">
                  <span className="material-symbols-outlined text-3xl">history</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-orange-900 group-hover:text-orange-950 transition-colors">
                    {pendingAttendanceCount} {pendingAttendanceCount === 1 ? 'Chamada Pendente' : 'Chamadas Pendentes'}
                  </h3>
                  <p className="text-sm text-orange-700 mt-1">
                    {pendingAttendanceCount === 1
                      ? 'Há uma aula do mês atual sem registro de chamada.'
                      : `Há ${pendingAttendanceCount} aulas do mês atual sem registro de chamada.`
                    }
                  </p>
                  <p className="text-xs text-orange-600 mt-2 font-medium flex items-center gap-1 group-hover:text-orange-800 transition-colors">
                    Clique para ver detalhes e cobrar os professores
                    <span className="material-symbols-outlined text-sm transition-transform group-hover:translate-x-1">arrow_forward</span>
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2 relative z-10">
                <div className="text-right">
                  <p className="text-4xl font-black text-orange-600 group-hover:text-orange-700 transition-colors">{pendingAttendanceCount}</p>
                  <p className="text-xs text-orange-500 font-bold uppercase">Atrasadas</p>
                </div>
              </div>
              {/* Hover Effect Background */}
              <div className="absolute inset-0 bg-gradient-to-r from-orange-100/0 via-orange-100/0 to-orange-100/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
            </div>
          </div>
        )}

        {/* Active Notices Info Removed */}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Chart 1: Attendance (Main) */}
        <div className="lg:col-span-2 bg-card-light dark:bg-card-dark p-6 rounded-xl border border-border-light dark:border-border-dark shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-text-light dark:text-text-dark">Frequência Semanal</h2>
              <p className="text-sm text-muted dark:text-muted-dark">
                {dateRange.start && dateRange.end ? (
                  <>Últimos 7 dias ({dateRange.start} - {dateRange.end})</>
                ) : (
                  <>Comparativo de presenças nos últimos 7 dias</>
                )}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-3 text-xs font-bold">
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-primary"></div>Presentes</div>
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-gray-300"></div>Faltas</div>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted dark:text-muted-dark">Frequência do Mês</p>
                <p className="text-lg font-black text-primary">{stats.monthAttendanceRate}%</p>
              </div>
            </div>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyAttendance} barSize={32}>
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#718096', fontSize: 12, fontWeight: 500 }}
                  dy={10}
                />
                <Tooltip
                  cursor={{ fill: '#F7FAFC' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="presentes" stackId="a" fill="#0f3c5c" radius={[0, 0, 4, 4]} />
                <Bar dataKey="faltas" stackId="a" fill="#CBD5E0" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Distribution (Donut) */}
        <div className="bg-card-light dark:bg-card-dark p-6 rounded-xl border border-border-light dark:border-border-dark shadow-sm flex flex-col">
          <h2 className="text-lg font-bold text-text-light dark:text-text-dark mb-2">Turmas por Nível</h2>
          <p className="text-sm text-muted dark:text-muted-dark mb-6">Distribuição de turmas por nível de habilidade.</p>

          <div className="flex-grow relative">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={classDistribution as any}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {classDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Text */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
              <p className="text-3xl font-black text-text-light dark:text-text-dark">{stats.activeClasses}</p>
              <p className="text-[10px] font-bold text-muted dark:text-muted-dark uppercase">Turmas</p>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {classDistribution.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="font-medium text-text-light dark:text-text-dark">{item.name}</span>
                </div>
                <span className="font-bold text-muted dark:text-muted-dark">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity Feed */}
        <div className="lg:col-span-2 bg-card-light dark:bg-card-dark rounded-xl border border-border-light dark:border-border-dark shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-text-light dark:text-text-dark">Atividade Recente</h2>
            <span className="text-xs text-muted dark:text-muted-dark">
              Últimas {totalActivities} atividades
            </span>
          </div>
          <div className="space-y-6 mb-6">
            {recentActivities.length > 0 ? (
              recentActivities.map((activity, index) => (
                <div key={activity.id} className="flex items-start gap-4 relative">
                  <div className={`p-2 rounded-full flex-shrink-0 ${activity.color}`}>
                    <span className="material-symbols-outlined text-lg">{activity.icon}</span>
                  </div>
                  <div className="flex-grow">
                    <p className="font-bold text-text-light dark:text-text-dark text-sm">{activity.text}</p>
                    <p className="text-xs text-muted dark:text-muted-dark mt-0.5">{activity.time}</p>
                  </div>
                  {/* Line Connector */}
                  {index !== recentActivities.length - 1 && (
                    <div className="absolute left-[19px] top-10 bottom-[-24px] w-px bg-gray-100 dark:bg-gray-700"></div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-center text-muted dark:text-muted-dark py-4">Nenhuma atividade recente</p>
            )}
          </div>

          {/* Pagination */}
          {totalActivities > itemsPerPage && (
            <div className="flex items-center justify-center gap-2 pt-4 border-t border-border-light dark:border-border-dark">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded-lg hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Página anterior"
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </button>

              {Array.from({ length: Math.ceil(totalActivities / itemsPerPage) }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-lg font-bold text-sm transition-colors ${currentPage === page
                    ? 'bg-primary text-white'
                    : 'hover:bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-100'
                    }`}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === Math.ceil(totalActivities / itemsPerPage)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Próxima página"
              >
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-6">
          {/* Notice Board */}
          <section className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 shadow-lg text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 opacity-10">
              <span className="material-symbols-outlined text-8xl">campaign</span>
            </div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined text-yellow-400">notifications</span>
                  Mural de Avisos
                </h2>
                <Link to="/notices" className="text-xs font-bold text-blue-300 hover:text-blue-200 hover:underline">
                  Gerenciar
                </Link>
              </div>
              <div className="space-y-4">
                {notices.length > 0 ? (
                  notices.slice(0, 3).map((notice) => (
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
                  <p className="text-sm text-gray-400">Nenhum aviso ativo no momento.</p>
                )}
                {notices.length > 3 && (
                  <Link to="/notices" className="block text-center text-xs text-gray-400 hover:text-white mt-2">
                    Ver mais {notices.length - 3} avisos
                  </Link>
                )}
              </div>
            </div>
          </section>

          {/* Quick Actions Grid */}
          <div className="bg-card-light dark:bg-card-dark rounded-xl border border-border-light dark:border-border-dark shadow-sm p-6 flex flex-col">
            <h2 className="text-lg font-bold text-text-light dark:text-text-dark mb-6">Acesso Rápido</h2>
            <div className="grid grid-cols-2 gap-3">
              <Link to="/register" className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-primary/30 hover:bg-primary/5 hover:text-primary transition-all group">
                <span className="material-symbols-outlined text-3xl text-muted dark:text-muted-dark group-hover:text-primary mb-2">person_add</span>
                <span className="text-xs font-bold">Novo Aluno</span>
              </Link>
              <Link to="/calendar" className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-primary/30 hover:bg-primary/5 hover:text-primary transition-all group">
                <span className="material-symbols-outlined text-3xl text-muted dark:text-muted-dark group-hover:text-primary mb-2">calendar_month</span>
                <span className="text-xs font-bold">Ver Grade</span>
              </Link>
              <Link to="/reports" className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-primary/30 hover:bg-primary/5 hover:text-primary transition-all group md:col-span-2">
                <span className="material-symbols-outlined text-3xl text-muted dark:text-muted-dark group-hover:text-primary mb-2">assessment</span>
                <span className="text-xs font-bold">Relatórios de Frequência</span>
              </Link>
            </div>
            <div className="mt-6 pt-6 border-t border-border-light dark:border-border-dark">
              <div className="bg-primary/5 rounded-lg p-4 flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">support_agent</span>
                <div>
                  <p className="text-xs font-bold text-primary">Precisa de ajuda?</p>
                  <p className="text-[10px] text-muted dark:text-muted-dark">Contate o suporte do sistema</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Attendance Modal */}
      {showPendingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-card-dark rounded-xl p-6 max-w-3xl w-full shadow-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-6 flex-shrink-0">
              <div>
                <h3 className="text-2xl font-bold text-text-light dark:text-text-dark">Chamadas Pendentes</h3>
                <p className="text-sm text-muted dark:text-muted-dark mt-1">Lista de aulas que precisam de registro de presença.</p>
              </div>
              <button
                onClick={() => setShowPendingModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-100 transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="overflow-y-auto flex-grow pr-2">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-white dark:bg-card-dark z-10">
                  <tr className="border-b-2 border-gray-100">
                    <th className="py-3 px-4 text-xs font-bold text-muted dark:text-muted-dark uppercase bg-gray-50 dark:bg-gray-800 rounded-tl-lg">Data</th>
                    <th className="py-3 px-4 text-xs font-bold text-muted dark:text-muted-dark uppercase bg-gray-50 dark:bg-gray-800">Turma</th>
                    <th className="py-3 px-4 text-xs font-bold text-muted dark:text-muted-dark uppercase bg-gray-50 dark:bg-gray-800">Professor Responsável</th>
                    <th className="py-3 px-4 text-xs font-bold text-muted dark:text-muted-dark uppercase text-center bg-gray-50 dark:bg-gray-800 rounded-tr-lg">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pendingAttendanceList.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group">
                      <td className="py-3 px-4 text-sm text-gray-800 dark:text-white">
                        <div className="font-bold text-gray-900 dark:text-white">{item.dateFormatted}</div>
                        <div className="text-xs text-muted dark:text-muted-dark capitalize">{item.dayOfWeek}</div>
                      </td>
                      <td className="py-3 px-4 text-sm font-bold text-primary">
                        {item.className}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-100">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600 border border-blue-200">
                            {item.teacherName.charAt(0)}
                          </div>
                          <span className="font-medium">{item.teacherName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold bg-orange-100 text-orange-700 border border-orange-200">
                          <span className="material-symbols-outlined text-[14px]">schedule</span>
                          Pendente
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end flex-shrink-0">
              <button
                onClick={() => setShowPendingModal(false)}
                className="px-6 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-white rounded-lg font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
