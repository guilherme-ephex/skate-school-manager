import React from 'react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Link } from 'react-router-dom';
import { useAdminDashboardData } from '../src/hooks/useAdminDashboardData';

export const AdminDashboard: React.FC = () => {
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
          <h1 className="text-3xl font-black text-text-light">Visão Geral</h1>
          <p className="text-muted">Gestão pedagógica e acompanhamento de alunos.</p>
        </div>
        <div className="flex gap-3">
          <Link to="/reports" className="flex items-center gap-2 bg-white border border-border-light px-4 py-2 rounded-lg text-sm font-bold text-muted hover:text-primary hover:border-primary/30 transition-colors shadow-sm">
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
        <div className="bg-card-light p-5 rounded-xl border border-border-light shadow-sm flex flex-col justify-between group">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-teal-50 text-teal-600 rounded-lg group-hover:bg-teal-100 transition-colors">
              <span className="material-symbols-outlined">trending_up</span>
            </div>
            <span className="text-sm font-bold text-muted">Novos Alunos (Mês)</span>
          </div>
          <div>
            <h3 className="text-3xl font-black text-text-light">{stats.newStudentsThisMonth}</h3>
            <p className="text-xs text-muted mt-1 font-medium text-teal-600">Novos este mês</p>
          </div>
        </div>

        {/* Total Students */}
        <div className="bg-card-light p-5 rounded-xl border border-border-light shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <span className="material-symbols-outlined">groups</span>
            </div>
            <span className="text-sm font-bold text-muted">Total de Alunos</span>
          </div>
          <p className="text-3xl font-black text-text-light">{stats.totalStudents}</p>
          <p className="text-xs text-muted mt-2">Alunos ativos no sistema</p>
        </div>

        {/* Active Classes */}
        <div className="bg-card-light p-5 rounded-xl border border-border-light shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <span className="material-symbols-outlined">skateboarding</span>
            </div>
            <span className="text-sm font-bold text-muted">Turmas Ativas</span>
          </div>
          <p className="text-3xl font-black text-text-light">{stats.activeClasses}</p>
          <div className="w-full bg-gray-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-purple-500 h-full rounded-full" style={{ width: '100%' }}></div>
          </div>
          <p className="text-[10px] text-muted mt-1 font-bold">Todas com professor alocado</p>
        </div>

        {/* Alerts */}
        <div className="bg-card-light p-5 rounded-xl border border-red-100 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-red-500 blur-2xl opacity-10 rounded-full"></div>
          <div className="flex items-center gap-3 mb-2 relative z-10">
            <div className="p-2 bg-red-50 text-red-600 rounded-lg">
              <span className="material-symbols-outlined">warning</span>
            </div>
            <span className="text-sm font-bold text-red-800">Risco de Evasão</span>
          </div>
          <div className="flex items-end justify-between relative z-10">
            <p className="text-3xl font-black text-text-light">{stats.riskStudents}</p>
            <Link to="/reports" className="text-xs font-bold text-red-600 hover:underline flex items-center">
              Ver lista <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>
          <p className="text-xs text-muted mt-2 relative z-10">Alunos com 3+ faltas consecutivas</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Chart 1: Attendance (Main) */}
        <div className="lg:col-span-2 bg-card-light p-6 rounded-xl border border-border-light shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-text-light">Frequência Semanal</h2>
              <p className="text-sm text-muted">
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
                <p className="text-xs text-muted">Frequência do Mês</p>
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
        <div className="bg-card-light p-6 rounded-xl border border-border-light shadow-sm flex flex-col">
          <h2 className="text-lg font-bold text-text-light mb-2">Turmas por Nível</h2>
          <p className="text-sm text-muted mb-6">Distribuição de turmas por nível de habilidade.</p>

          <div className="flex-grow relative">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={classDistribution}
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
              <p className="text-3xl font-black text-text-light">{stats.activeClasses}</p>
              <p className="text-[10px] font-bold text-muted uppercase">Turmas</p>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {classDistribution.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="font-medium text-text-light">{item.name}</span>
                </div>
                <span className="font-bold text-muted">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity Feed */}
        <div className="lg:col-span-2 bg-card-light rounded-xl border border-border-light shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-text-light">Atividade Recente</h2>
            <span className="text-xs text-muted">
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
                    <p className="font-bold text-text-light text-sm">{activity.text}</p>
                    <p className="text-xs text-muted mt-0.5">{activity.time}</p>
                  </div>
                  {/* Line Connector */}
                  {index !== recentActivities.length - 1 && (
                    <div className="absolute left-[19px] top-10 bottom-[-24px] w-px bg-gray-100"></div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-center text-muted py-4">Nenhuma atividade recente</p>
            )}
          </div>

          {/* Pagination */}
          {totalActivities > itemsPerPage && (
            <div className="flex items-center justify-center gap-2 pt-4 border-t border-border-light">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Página anterior"
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </button>

              {Array.from({ length: Math.ceil(totalActivities / itemsPerPage) }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-lg font-bold text-sm transition-colors ${
                    currentPage === page
                      ? 'bg-primary text-white'
                      : 'hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === Math.ceil(totalActivities / itemsPerPage)}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Próxima página"
              >
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          )}
        </div>

        {/* Quick Actions Grid */}
        <div className="bg-card-light rounded-xl border border-border-light shadow-sm p-6 flex flex-col">
          <h2 className="text-lg font-bold text-text-light mb-6">Acesso Rápido</h2>
          <div className="grid grid-cols-2 gap-3">
            <Link to="/register" className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-primary/30 hover:bg-primary/5 hover:text-primary transition-all group">
              <span className="material-symbols-outlined text-3xl text-muted group-hover:text-primary mb-2">person_add</span>
              <span className="text-xs font-bold">Novo Aluno</span>
            </Link>
            <Link to="/calendar" className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-primary/30 hover:bg-primary/5 hover:text-primary transition-all group">
              <span className="material-symbols-outlined text-3xl text-muted group-hover:text-primary mb-2">calendar_month</span>
              <span className="text-xs font-bold">Ver Grade</span>
            </Link>
            <Link to="/reports" className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-primary/30 hover:bg-primary/5 hover:text-primary transition-all group md:col-span-2">
              <span className="material-symbols-outlined text-3xl text-muted group-hover:text-primary mb-2">assessment</span>
              <span className="text-xs font-bold">Relatórios de Frequência</span>
            </Link>
          </div>
          <div className="mt-6 pt-6 border-t border-border-light">
            <div className="bg-primary/5 rounded-lg p-4 flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">support_agent</span>
              <div>
                <p className="text-xs font-bold text-primary">Precisa de ajuda?</p>
                <p className="text-[10px] text-muted">Contate o suporte do sistema</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};