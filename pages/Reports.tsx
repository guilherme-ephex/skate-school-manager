import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Presentes', value: 18 },
  { name: 'Faltas', value: 4 },
];

const COLORS = ['#0f3c5c', '#e2e8f0'];

export const Reports: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto pb-10">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-text-light">Relatórios Detalhados</h1>
        <p className="text-muted">Gere e exporte listas de presença para prestação de contas.</p>
      </div>

      {/* Export Card */}
      <div className="bg-primary text-white rounded-xl p-6 mb-8 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
                <h2 className="text-xl font-bold">Exportar Lista de Presença Mensal</h2>
                <p className="text-white/80">Essencial para a prestação de contas da ONG.</p>
            </div>
            <button className="h-12 px-6 bg-white text-primary rounded-lg font-bold flex items-center justify-center gap-2 shadow hover:bg-gray-100">
                <span className="material-symbols-outlined">download</span>
                Gerar e Exportar
            </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <label className="flex flex-col gap-1">
                <span className="text-sm font-medium text-white/90">Mês</span>
                <select className="h-10 rounded-lg bg-white/10 border border-white/20 text-white focus:bg-primary">
                    <option>Junho</option>
                    <option>Maio</option>
                </select>
            </label>
            <label className="flex flex-col gap-1">
                <span className="text-sm font-medium text-white/90">Ano</span>
                <select className="h-10 rounded-lg bg-white/10 border border-white/20 text-white focus:bg-primary">
                    <option>2024</option>
                    <option>2023</option>
                </select>
            </label>
            <label className="flex flex-col gap-1">
                <span className="text-sm font-medium text-white/90">Turma</span>
                <select className="h-10 rounded-lg bg-white/10 border border-white/20 text-white focus:bg-primary">
                    <option>Todas as Turmas</option>
                    <option>Iniciantes A</option>
                </select>
            </label>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
         {/* Chart */}
         <div className="bg-card-light p-6 rounded-xl border border-border-light shadow-sm flex flex-col">
            <h3 className="text-lg font-bold mb-1">Presença do Dia</h3>
            <p className="text-sm text-muted mb-4">Relatório visual de hoje: 17 de Junho</p>
            <div className="flex-grow min-h-[250px] relative flex items-center justify-center">
                 <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                        <Pie
                            data={data}
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                    </PieChart>
                 </ResponsiveContainer>
                 {/* Center Text Mock */}
                 <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                        <span className="text-2xl font-bold text-primary">82%</span>
                    </div>
                 </div>
            </div>
            <div className="flex justify-center gap-6 mt-4">
                <div className="flex items-center gap-2 text-sm"><div className="w-3 h-3 rounded-full bg-primary"></div>Presentes</div>
                <div className="flex items-center gap-2 text-sm"><div className="w-3 h-3 rounded-full bg-gray-300"></div>Faltas</div>
            </div>
         </div>

         {/* Student Search */}
         <div className="bg-card-light p-6 rounded-xl border border-border-light shadow-sm">
            <h3 className="text-lg font-bold mb-1">Relatório por Aluno</h3>
            <p className="text-sm text-muted mb-4">Selecione um aluno para ver seu histórico.</p>
            <div className="relative mb-6">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-muted">search</span>
                <input type="text" className="w-full pl-10 h-10 rounded-lg border-border-light" placeholder="Buscar aluno..." />
            </div>
            {/* Placeholder for list or specific student stats */}
            <div className="text-center py-10 text-muted bg-gray-50 rounded-lg border border-dashed border-gray-300">
                Pesquise um aluno para ver detalhes
            </div>
         </div>
      </div>

      {/* Table */}
      <div className="bg-card-light rounded-xl border border-border-light shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border-light">
             <h3 className="text-lg font-bold mb-1">Últimos Registros de Presença</h3>
             <p className="text-sm text-muted">Visão geral das últimas aulas registradas.</p>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                        <th className="px-6 py-3 text-xs font-bold text-muted uppercase">Aluno</th>
                        <th className="px-6 py-3 text-xs font-bold text-muted uppercase">Turma</th>
                        <th className="px-6 py-3 text-xs font-bold text-muted uppercase">Data</th>
                        <th className="px-6 py-3 text-xs font-bold text-muted uppercase text-center">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {[
                        { name: 'Bruno Alves', class: 'Iniciantes A', date: '17/06/2024', status: 'Presente', color: 'bg-green-100 text-green-800' },
                        { name: 'Carla Dias', class: 'Intermediário', date: '17/06/2024', status: 'Presente', color: 'bg-green-100 text-green-800' },
                        { name: 'Fernando Lima', class: 'Iniciantes A', date: '17/06/2024', status: 'Falta', color: 'bg-red-100 text-red-800' },
                        { name: 'Mariana Costa', class: 'Avançado', date: '15/06/2024', status: 'Presente', color: 'bg-green-100 text-green-800' },
                    ].map((row, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                            <td className="px-6 py-4 font-medium text-text-light">{row.name}</td>
                            <td className="px-6 py-4 text-muted">{row.class}</td>
                            <td className="px-6 py-4 text-muted">{row.date}</td>
                            <td className="px-6 py-4 text-center">
                                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${row.color}`}>
                                    {row.status}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};