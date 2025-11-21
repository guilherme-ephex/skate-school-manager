import React from 'react';
import { Link } from 'react-router-dom';

export const TeacherDashboard: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto">
      <header className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-black text-text-light mb-1">Olá, Carlos!</h1>
          <p className="text-muted">Aqui está um resumo do seu dia.</p>
        </div>
        <Link to="/attendance" className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-lg font-bold hover:bg-primary/90 transition-colors shadow-sm">
          <span className="material-symbols-outlined">checklist</span>
          Registrar Chamada
        </Link>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
            
          {/* Classes List */}
          <section className="bg-card-light rounded-xl p-6 shadow-sm border border-border-light">
            <h2 className="text-xl font-bold mb-4">Suas Turmas</h2>
            <div className="flex flex-col divide-y divide-gray-100">
              {[
                { name: 'Iniciante - Ter/Qui 16h', count: 12 },
                { name: 'Avançado - Sáb 10h', count: 8 },
                { name: 'Intermediário - Seg/Qua 18h', count: 10 }
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between py-4 hover:bg-gray-50 -mx-4 px-4 cursor-pointer transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-background-light flex items-center justify-center text-text-light">
                      <span className="material-symbols-outlined">groups</span>
                    </div>
                    <span className="font-medium text-text-light">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted">
                    <span>{item.count} alunos</span>
                    <span className="material-symbols-outlined">chevron_right</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Alerts */}
          <section className="bg-card-light rounded-xl p-6 shadow-sm border border-border-light">
            <h2 className="text-xl font-bold mb-4">Alunos com 3+ Faltas</h2>
            <div className="flex flex-col gap-4">
               {[
                 { name: 'Mariana Costa', class: 'Avançado - Sáb 10h', count: 3 },
                 { name: 'Lucas Pereira', class: 'Iniciante - Ter/Qui 16h', count: 4 },
               ].map((student, idx) => (
                 <div key={idx} className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-100">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-yellow-100 text-yellow-700 flex items-center justify-center">
                            <span className="material-symbols-outlined">warning</span>
                        </div>
                        <div>
                            <p className="font-bold text-text-light">{student.name}</p>
                            <p className="text-xs text-muted">Turma: {student.class}</p>
                        </div>
                    </div>
                    <span className="font-bold text-yellow-700">{student.count} Faltas</span>
                 </div>
               ))}
            </div>
          </section>
        </div>

        {/* Right Column - Upcoming */}
        <div>
           <section className="bg-card-light rounded-xl p-6 shadow-sm border border-border-light sticky top-6">
              <h2 className="text-xl font-bold mb-4">Próximas Aulas</h2>
              <div className="flex flex-col gap-4">
                 {[
                    { day: 'HOJE', time: '16:00', name: 'Iniciante - Ter/Qui 16h', loc: 'Pista Central', active: true },
                    { day: 'QUINTA', time: '16:00', name: 'Iniciante - Ter/Qui 16h', loc: 'Pista Central', active: false },
                    { day: 'SÁBADO', time: '10:00', name: 'Avançado - Sáb 10h', loc: 'Bowl Park', active: false },
                 ].map((cls, idx) => (
                    <div key={idx} className={`p-4 rounded-lg border ${cls.active ? 'bg-primary/5 border-primary/20' : 'bg-background-light border-border-light'}`}>
                        <p className={`text-xs font-bold mb-1 ${cls.active ? 'text-primary' : 'text-muted'}`}>{cls.day}, {cls.time}</p>
                        <p className="font-medium text-text-light mb-2">{cls.name}</p>
                        <div className="flex items-center gap-1 text-xs text-muted">
                            <span className="material-symbols-outlined text-sm">location_on</span>
                            {cls.loc}
                        </div>
                    </div>
                 ))}
              </div>
           </section>
        </div>
      </div>
    </div>
  );
};