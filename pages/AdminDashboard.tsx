import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Link } from 'react-router-dom';

const data = [
  { name: 'Seg', uv: 20 },
  { name: 'Ter', uv: 45 },
  { name: 'Qua', uv: 75 },
  { name: 'Qui', uv: 50 },
  { name: 'Sex', uv: 90 },
  { name: 'Sáb', uv: 30 },
];

export const AdminDashboard: React.FC = () => {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black text-text-light">Dashboard do Administrador</h1>
        <p className="text-muted">Visão geral do desempenho da escola hoje.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-card-light p-6 rounded-xl border border-border-light shadow-sm flex items-center gap-4">
          <div className="bg-primary/10 text-primary p-3 rounded-lg">
            <span className="material-symbols-outlined text-3xl">groups</span>
          </div>
          <div>
            <p className="text-muted font-medium">Total de Alunos</p>
            <p className="text-3xl font-bold">85</p>
          </div>
        </div>
        
        <div className="bg-card-light p-6 rounded-xl border border-border-light shadow-sm flex items-center gap-4">
          <div className="bg-primary/10 text-primary p-3 rounded-lg">
             <span className="material-symbols-outlined text-3xl">view_carousel</span>
          </div>
          <div>
            <p className="text-muted font-medium">Total de Turmas</p>
            <p className="text-3xl font-bold">12</p>
          </div>
        </div>

        <div className="bg-primary text-white p-6 rounded-xl shadow-lg flex items-center gap-4">
          <div className="bg-white/20 p-3 rounded-lg">
            <span className="material-symbols-outlined text-3xl">warning</span>
          </div>
          <div>
            <p className="text-white/80 font-medium">Alertas de 3 Faltas</p>
            <p className="text-3xl font-bold">5</p>
          </div>
        </div>

        <div className="bg-card-light p-6 rounded-xl border border-border-light shadow-sm flex items-center gap-4">
          <div className="bg-primary/10 text-primary p-3 rounded-lg">
            <span className="material-symbols-outlined text-3xl">calendar_month</span>
          </div>
          <div>
            <p className="text-muted font-medium">Aulas no Mês</p>
            <p className="text-3xl font-bold">48</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 bg-card-light p-6 rounded-xl border border-border-light shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Visão Geral de Presença</h2>
            <div className="flex items-center gap-2">
                <span className="text-5xl font-bold text-primary">85%</span>
                <div className="flex flex-col">
                    <span className="text-success text-sm font-bold flex items-center">
                        <span className="material-symbols-outlined text-sm">arrow_upward</span>
                        +5%
                    </span>
                    <span className="text-muted text-xs">vs. semana passada</span>
                </div>
            </div>
          </div>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#718096', fontSize: 12}}
                    dy={10}
                />
                <Tooltip 
                    cursor={{fill: 'transparent'}}
                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="uv" radius={[4, 4, 0, 0]}>
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.uv > 60 ? '#0f3c5c' : '#CBD5E0'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-card-light p-6 rounded-xl border border-border-light shadow-sm">
          <h2 className="text-xl font-bold mb-6">Acesso Rápido</h2>
          <div className="flex flex-col gap-4">
            <Link to="/register" className="flex items-center justify-center gap-3 h-12 w-full bg-primary text-white rounded-lg font-bold hover:bg-primary/90 transition-colors">
              <span className="material-symbols-outlined">person_add</span>
              Cadastrar Aluno
            </Link>
            <Link to="/register" className="flex items-center justify-center gap-3 h-12 w-full bg-primary/10 text-primary rounded-lg font-bold hover:bg-primary/20 transition-colors">
              <span className="material-symbols-outlined">badge</span>
              Cadastrar Professor
            </Link>
            <Link to="/register" className="flex items-center justify-center gap-3 h-12 w-full bg-primary/10 text-primary rounded-lg font-bold hover:bg-primary/20 transition-colors">
              <span className="material-symbols-outlined">add_box</span>
              Cadastrar Turma
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};