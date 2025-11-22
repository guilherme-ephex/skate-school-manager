import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useReportsData } from '../src/hooks/useReportsData';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../src/lib/api';
import { supabase } from '../lib/supabase';
import { generateReportPDF, generateReportCSV, generateStudentReportPDF } from '../src/utils/pdfGenerator';
import { format, subMonths, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const Reports: React.FC = () => {
    const { user } = useAuth();
    const [selectedMonthDate, setSelectedMonthDate] = useState(new Date());
    const [exportFormat, setExportFormat] = useState<'PDF' | 'CSV'>('PDF');
    const [includeHeader, setIncludeHeader] = useState(true);
    const [includeSignatures, setIncludeSignatures] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [contactModalOpen, setContactModalOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<{ id: string; name: string } | null>(null);
    const [contactNotes, setContactNotes] = useState('');
    const [contactType, setContactType] = useState<'phone' | 'email' | 'in_person' | 'other'>('phone');
    const [processingContact, setProcessingContact] = useState(false);

    // Student Report Modal
    const [studentReportModalOpen, setStudentReportModalOpen] = useState(false);
    const [selectedStudentForReport, setSelectedStudentForReport] = useState<string>('');
    const [generatingStudentReport, setGeneratingStudentReport] = useState(false);

    const { 
        loading, 
        error, 
        studentReports, 
        riskStudents, 
        weeklyStats, 
        classAttendanceData,
        monthlyStats,
        topAbsentStudents,
        mostActiveClasses,
        bestAttendanceClasses
    } = useReportsData(selectedMonthDate);

    // Generate month options (last 6 months)
    const monthOptions = Array.from({ length: 6 }, (_, i) => {
        const date = subMonths(new Date(), i);
        return {
            value: format(date, 'yyyy-MM'),
            label: format(date, "MMMM 'de' yyyy", { locale: ptBR })
        };
    });

    const handleExport = () => {
        if (exportFormat === 'PDF') {
            const pdf = generateReportPDF(
                studentReports,
                weeklyStats,
                classAttendanceData,
                selectedMonthDate,
                includeHeader,
                includeSignatures
            );
            pdf.save(`relatorio_${format(selectedMonthDate, 'yyyy-MM')}.pdf`);
        } else {
            generateReportCSV(studentReports, selectedMonthDate);
        }
    };

    const handleGenerateStudentReport = async () => {
        if (!selectedStudentForReport) {
            alert('Selecione um aluno');
            return;
        }

        setGeneratingStudentReport(true);
        try {
            // Find student info
            const studentReport = studentReports.find(r => r.student.id === selectedStudentForReport);
            if (!studentReport) {
                alert('Aluno não encontrado');
                return;
            }

            // Fetch all attendance for this student
            const { data: attendanceData, error: attendanceError } = await supabase
                .from('attendance')
                .select('*, classes(name)')
                .eq('student_id', selectedStudentForReport)
                .order('date', { ascending: false });

            if (attendanceError) throw attendanceError;

            const attendanceRecords = attendanceData.map((record: any) => ({
                date: record.date,
                className: record.classes.name,
                status: record.status
            }));

            const pdf = generateStudentReportPDF(
                studentReport.student.full_name,
                attendanceRecords,
                includeHeader
            );

            pdf.save(`relatorio_individual_${studentReport.student.full_name.replace(/\s+/g, '_')}.pdf`);
            setStudentReportModalOpen(false);
        } catch (err) {
            console.error('Error generating student report:', err);
            alert('Erro ao gerar relatório do aluno');
        } finally {
            setGeneratingStudentReport(false);
        }
    };

    const handleInactivate = async (studentId: string, studentName: string) => {
        if (!window.confirm(`Tem certeza que deseja INATIVAR o aluno "${studentName}"? Ele será ocultado de todas as listagens e não contabilizado mais.`)) {
            return;
        }

        try {
            await api.inactivateStudent(studentId);
            alert('Aluno inativado com sucesso!');
            window.location.reload(); // Reload to update data
        } catch (err) {
            console.error('Error inactivating student:', err);
            alert('Erro ao inativar aluno. Tente novamente.');
        }
    };

    const handleOpenContactModal = (studentId: string, studentName: string) => {
        setSelectedStudent({ id: studentId, name: studentName });
        setContactModalOpen(true);
        setContactNotes('');
    };

    const handleSaveContact = async () => {
        if (!selectedStudent || !user || !contactNotes.trim()) {
            alert('Preencha as observações do contato.');
            return;
        }

        setProcessingContact(true);
        try {
            await api.createContactLog({
                student_id: selectedStudent.id,
                contacted_by: user.id,
                contact_type: contactType,
                notes: contactNotes.trim()
            });

            alert('Contato registrado com sucesso!');
            setContactModalOpen(false);
            setContactNotes('');
            setSelectedStudent(null);
        } catch (err) {
            console.error('Error creating contact log:', err);
            alert('Erro ao registrar contato. Tente novamente.');
        } finally {
            setProcessingContact(false);
        }
    };

    const filteredReports = studentReports.filter(report =>
        report.student.full_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
        <div className="max-w-7xl mx-auto pb-20">
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-text-light dark:text-text-dark">Relatórios e Prestação de Contas</h1>
                    <p className="text-muted dark:text-muted-dark">Acompanhamento de frequência, evasão e exportação mensal.</p>
                </div>

                <div className="w-full md:w-auto">
                    <div className="flex items-center gap-3 bg-white dark:bg-card-dark px-4 py-2 rounded-lg border border-border-light dark:border-border-dark shadow-sm relative group hover:border-primary/30 transition-colors">
                        <div className="p-2 bg-primary/5 rounded-lg group-hover:bg-primary/10 transition-colors">
                            <span className="material-symbols-outlined text-primary">calendar_month</span>
                        </div>
                        <div className="flex flex-col items-start relative min-w-[140px]">
                            <label className="text-[10px] font-bold text-muted dark:text-muted-dark uppercase tracking-wide">Mês de Referência</label>
                            <select
                                value={format(selectedMonthDate, 'yyyy-MM')}
                                onChange={(e) => setSelectedMonthDate(parseISO(e.target.value + '-01'))}
                                className="appearance-none bg-transparent font-bold text-lg text-primary border-none p-0 pr-8 focus:ring-0 cursor-pointer outline-none w-full leading-tight"
                            >
                                {monthOptions.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                            <span className="material-symbols-outlined absolute right-0 top-1/2 mt-1 -translate-y-1/2 text-sm text-muted dark:text-muted-dark pointer-events-none">expand_more</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* SECTION: MONTH OVERVIEW & RANKINGS */}
            <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
                <h2 className="text-xl font-bold text-text-light dark:text-text-dark mb-4">Visão Geral do Mês</h2>
                
                {/* KPIs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white dark:bg-card-dark p-4 rounded-xl border border-border-light dark:border-border-dark shadow-sm">
                        <p className="text-sm font-bold text-muted dark:text-muted-dark mb-1">Aulas Previstas</p>
                        <p className="text-2xl font-black text-text-light dark:text-text-dark">{monthlyStats.expectedClasses}</p>
                    </div>
                    <div className="bg-white dark:bg-card-dark p-4 rounded-xl border border-border-light dark:border-border-dark shadow-sm">
                        <p className="text-sm font-bold text-muted dark:text-muted-dark mb-1">Aulas Praticadas</p>
                        <p className="text-2xl font-black text-green-600">{monthlyStats.practicedClasses}</p>
                    </div>
                    <div className="bg-white dark:bg-card-dark p-4 rounded-xl border border-border-light dark:border-border-dark shadow-sm">
                        <p className="text-sm font-bold text-muted dark:text-muted-dark mb-1">Aulas Canceladas</p>
                        <p className="text-2xl font-black text-red-500">{monthlyStats.cancelledClasses}</p>
                    </div>
                    <div className="bg-white dark:bg-card-dark p-4 rounded-xl border border-border-light dark:border-border-dark shadow-sm relative overflow-hidden">
                        <div className="relative z-10">
                            <p className="text-sm font-bold text-muted dark:text-muted-dark mb-1">Taxa de Frequência</p>
                            <p className="text-2xl font-black text-primary">{monthlyStats.generalAttendanceRate}%</p>
                        </div>
                        <div className="absolute right-0 top-0 w-16 h-16 bg-primary/10 rounded-bl-full -mr-2 -mt-2"></div>
                    </div>
                </div>

                {/* RANKINGS */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Top Absent Students */}
                    <div className="bg-white dark:bg-card-dark rounded-xl border border-border-light dark:border-border-dark shadow-sm p-5">
                        <div className="flex items-center gap-2 mb-4 text-red-600">
                            <span className="material-symbols-outlined">person_off</span>
                            <h3 className="font-bold">Alunos com Mais Faltas</h3>
                        </div>
                        <div className="space-y-3">
                            {topAbsentStudents.length > 0 ? (
                                topAbsentStudents.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center text-sm">
                                        <div>
                                            <p className="font-bold text-text-light dark:text-text-dark">{item.name}</p>
                                            <p className="text-xs text-muted dark:text-muted-dark truncate max-w-[180px]">{item.subtitle}</p>
                                        </div>
                                        <span className="font-black text-red-600 bg-red-50 px-2 py-1 rounded-md">{item.value}</span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-muted dark:text-muted-dark text-center py-2">Sem dados</p>
                            )}
                        </div>
                    </div>

                    {/* Most Active Classes */}
                    <div className="bg-white dark:bg-card-dark rounded-xl border border-border-light dark:border-border-dark shadow-sm p-5">
                        <div className="flex items-center gap-2 mb-4 text-blue-600">
                            <span className="material-symbols-outlined">skateboarding</span>
                            <h3 className="font-bold">Turmas Mais Ativas</h3>
                        </div>
                        <div className="space-y-3">
                            {mostActiveClasses.length > 0 ? (
                                mostActiveClasses.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center text-sm">
                                        <div>
                                            <p className="font-bold text-text-light dark:text-text-dark">{item.name}</p>
                                            <p className="text-xs text-muted dark:text-muted-dark">{item.subtitle}</p>
                                        </div>
                                        <span className="font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-md">{item.value}</span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-muted dark:text-muted-dark text-center py-2">Sem dados</p>
                            )}
                        </div>
                    </div>

                    {/* Best Attendance */}
                    <div className="bg-white dark:bg-card-dark rounded-xl border border-border-light dark:border-border-dark shadow-sm p-5">
                        <div className="flex items-center gap-2 mb-4 text-green-600">
                            <span className="material-symbols-outlined">verified</span>
                            <h3 className="font-bold">Melhor Frequência</h3>
                        </div>
                        <div className="space-y-3">
                            {bestAttendanceClasses.length > 0 ? (
                                bestAttendanceClasses.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center text-sm">
                                        <div>
                                            <p className="font-bold text-text-light dark:text-text-dark">{item.name}</p>
                                            <p className="text-xs text-muted dark:text-muted-dark">{item.subtitle}</p>
                                        </div>
                                        <span className="font-black text-green-600 bg-green-50 px-2 py-1 rounded-md">{item.value}%</span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-muted dark:text-muted-dark text-center py-2">Sem dados</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* SECTION 1: CRITICAL ALERTS (3+ Absences) */}
            {riskStudents.length > 0 ? (
                <div className="mb-8 animate-in slide-in-from-top-4 duration-500">
                    <div className="bg-red-50 border border-red-200 rounded-xl p-6 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5">
                            <span className="material-symbols-outlined text-9xl text-red-600">warning</span>
                        </div>

                        <div className="relative z-10">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-red-100 rounded-full text-red-600 animate-pulse">
                                        <span className="material-symbols-outlined">notifications_active</span>
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-red-900">Risco de Evasão Detectado</h2>
                                        <p className="text-red-700 text-sm">{riskStudents.length} aluno(s) com 3 ou mais faltas consecutivas.</p>
                                    </div>
                                </div>
                                <div className="bg-white dark:bg-card-dark/50 px-3 py-1 rounded text-xs text-red-800 font-medium border border-red-100">
                                    * Calculado com base no histórico completo
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                {riskStudents.map((risk, idx) => (
                                    <div key={idx} className="bg-white dark:bg-card-dark p-5 rounded-lg border border-red-100 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 transition-transform hover:scale-[1.01]">
                                        <div className="flex-grow">
                                            <div className="flex items-center gap-2 mb-1">
                                                <p className="font-bold text-gray-900 text-lg">{risk.student.full_name}</p>
                                                <span className="px-2 py-0.5 bg-red-100 text-red-800 text-[10px] font-bold uppercase tracking-wide rounded-full border border-red-200">
                                                    {risk.consecutiveAbsences} Faltas Consecutivas
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-500 dark:text-gray-300 mb-2">
                                                Turma(s): {risk.classes.join(', ')} • Responsável: <span className="font-medium text-gray-700 dark:text-white">{risk.parentName}</span>
                                            </p>

                                            {/* Visual History */}
                                            <div className="flex items-center gap-1 flex-wrap">
                                                {risk.history.slice(0, 10).map((h, hIdx) => (
                                                    <div
                                                        key={hIdx}
                                                        className={`w-8 h-8 rounded flex items-center justify-center text-xs font-bold text-white ${h === 'absent' ? 'bg-red-500' :
                                                            h === 'justified' ? 'bg-yellow-500' :
                                                                'bg-green-500'
                                                            }`}
                                                        title={h === 'absent' ? 'Falta' : h === 'justified' ? 'Justificada' : 'Presente'}
                                                    >
                                                        {h === 'absent' ? 'F' : h === 'justified' ? 'J' : 'P'}
                                                    </div>
                                                ))}
                                                <span className="text-xs text-gray-400 ml-2">Histórico Recente</span>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-3 w-full lg:w-auto mt-2 lg:mt-0">
                                            <button
                                                onClick={() => handleOpenContactModal(risk.student.id, risk.student.full_name)}
                                                className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                                            >
                                                <span className="material-symbols-outlined text-lg">contact_phone</span>
                                                Registrar Contato
                                            </button>

                                            <button
                                                onClick={() => handleInactivate(risk.student.id, risk.student.full_name)}
                                                className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-card-dark text-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 text-sm font-bold rounded-lg hover:bg-gray-50 dark:bg-gray-800 hover:text-red-600 hover:border-red-200 transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-lg">person_off</span>
                                                Inativar Aluno
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="mb-8 bg-green-50 border border-green-200 rounded-xl p-6 flex items-center gap-3 text-green-800">
                    <span className="material-symbols-outlined text-2xl">check_circle</span>
                    <p className="font-bold">Excelente! Nenhum aluno em risco de evasão no momento.</p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                {/* SECTION 2: EXPORT */}
                <div className="lg:col-span-1 bg-primary text-white rounded-xl p-6 shadow-lg flex flex-col h-full relative overflow-hidden">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-white dark:bg-card-dark/10 rounded-full blur-2xl"></div>

                    <div className="mb-6 relative z-10">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-white dark:bg-card-dark/20 rounded-lg flex items-center justify-center">
                                <span className="material-symbols-outlined text-xl text-primary dark:text-white">file_save</span>
                            </div>
                            <h2 className="text-xl font-bold">Exportar Relatório</h2>
                        </div>
                        <p className="text-white/80 text-sm">Gere o documento de <strong>{format(selectedMonthDate, "MMMM 'de' yyyy", { locale: ptBR })}</strong> para prestação de contas.</p>
                    </div>

                    <div className="flex flex-col gap-4 flex-grow relative z-10">
                        <div className="grid grid-cols-2 gap-3">
                            <div
                                className={`rounded-lg p-3 border cursor-pointer transition-all ${exportFormat === 'PDF' ? 'bg-white text-primary border-white' : 'bg-white/10 border-white/20 hover:bg-white/20'}`}
                                onClick={() => setExportFormat('PDF')}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className="material-symbols-outlined">picture_as_pdf</span>
                                    {exportFormat === 'PDF' && <span className="material-symbols-outlined text-green-500">check_circle</span>}
                                </div>
                                <p className="font-bold text-sm">PDF Oficial</p>
                            </div>
                            <div
                                className={`rounded-lg p-3 border cursor-pointer transition-all ${exportFormat === 'CSV' ? 'bg-white text-primary border-white' : 'bg-white/10 border-white/20 hover:bg-white/20'}`}
                                onClick={() => setExportFormat('CSV')}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className="material-symbols-outlined">table_view</span>
                                    {exportFormat === 'CSV' && <span className="material-symbols-outlined text-green-500">check_circle</span>}
                                </div>
                                <p className="font-bold text-sm">Planilha CSV</p>
                            </div>
                        </div>

                        {exportFormat === 'PDF' && (
                            <div className="bg-black/20 rounded-lg p-4 space-y-3">
                                <p className="text-xs font-bold uppercase text-white/70">Configurações do Documento</p>

                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${includeHeader ? 'bg-green-500 border-green-500' : 'border-white/50'}`}>
                                        {includeHeader && <span className="material-symbols-outlined text-sm text-white">check</span>}
                                    </div>
                                    <input type="checkbox" checked={includeHeader} onChange={(e) => setIncludeHeader(e.target.checked)} className="hidden" />
                                    <span className="text-sm text-white/90 group-hover:text-white">Incluir Logo e Cabeçalho</span>
                                </label>

                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${includeSignatures ? 'bg-green-500 border-green-500' : 'border-white/50'}`}>
                                        {includeSignatures && <span className="material-symbols-outlined text-sm text-white">check</span>}
                                    </div>
                                    <input type="checkbox" checked={includeSignatures} onChange={(e) => setIncludeSignatures(e.target.checked)} className="hidden" />
                                    <span className="text-sm text-white/90 group-hover:text-white">Lista de Assinaturas</span>
                                </label>
                            </div>
                        )}

                        <button
                            onClick={handleExport}
                            className="w-full h-12 bg-white dark:bg-card-dark text-primary hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-800 font-bold rounded-lg shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined">download</span>
                            Baixar {exportFormat} Geral
                        </button>

                        <button
                            onClick={() => setStudentReportModalOpen(true)}
                            className="w-full h-12 bg-white/20 border-2 border-white/40 text-white hover:bg-white dark:bg-card-dark/30 font-bold rounded-lg transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined">person_search</span>
                            Relatório Individual
                        </button>
                    </div>
                </div>

                {/* SECTION 3: TREND CHART */}
                <div className="lg:col-span-2 bg-card-light dark:bg-card-dark p-6 rounded-xl border border-border-light dark:border-border-dark shadow-sm flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-text-light dark:text-text-dark">Tendência de Frequência</h3>
                            <p className="text-sm text-muted dark:text-muted-dark">Comparativo de presenças vs. faltas em {format(selectedMonthDate, "MMMM", { locale: ptBR })}.</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 text-sm font-medium">
                                <div className="w-3 h-3 rounded-full bg-primary"></div> Presentes
                            </div>
                            <div className="flex items-center gap-2 text-sm font-medium">
                                <div className="w-3 h-3 rounded-full bg-red-500"></div> Faltas
                            </div>
                        </div>
                    </div>

                    <div className="flex-grow min-h-[250px]">
                        <ResponsiveContainer width="100%" height={250}>
                            <AreaChart data={weeklyStats} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorPresentes" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#0f3c5c" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#0f3c5c" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#718096' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#718096' }} />
                                <CartesianGrid vertical={false} stroke="#E2E8F0" strokeDasharray="3 3" />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="presentes"
                                    stroke="#0f3c5c"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorPresentes)"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="faltas"
                                    stroke="#EF4444"
                                    strokeWidth={2}
                                    fill="transparent"
                                    strokeDasharray="5 5"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* SECTION 4: DETAILED LIST */}
            <div className="bg-card-light dark:bg-card-dark rounded-xl border border-border-light dark:border-border-dark shadow-sm overflow-hidden">
                <div className="p-6 border-b border-border-light dark:border-border-dark flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h3 className="text-lg font-bold text-text-light dark:text-text-dark">Registro Geral de Alunos</h3>
                        <p className="text-sm text-muted dark:text-muted-dark">Lista completa consolidada de <strong>{format(selectedMonthDate, "MMMM 'de' yyyy", { locale: ptBR })}</strong>.</p>
                    </div>
                    <div className="relative w-full sm:w-64">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-muted dark:text-muted-dark">search</span>
                        <input
                            type="text"
                            placeholder="Buscar aluno..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 h-10 rounded-lg border-gray-300 dark:border-gray-600 focus:border-primary focus:ring-primary text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-xs font-bold text-muted dark:text-muted-dark uppercase">Aluno</th>
                                <th className="px-6 py-3 text-xs font-bold text-muted dark:text-muted-dark uppercase">Turmas</th>
                                <th className="px-6 py-3 text-xs font-bold text-muted dark:text-muted-dark uppercase text-center">Faltas (Mês)</th>
                                <th className="px-6 py-3 text-xs font-bold text-muted dark:text-muted-dark uppercase text-center">Frequência</th>
                                <th className="px-6 py-3 text-xs font-bold text-muted dark:text-muted-dark uppercase text-center">Consecutivas</th>
                                <th className="px-6 py-3 text-xs font-bold text-muted dark:text-muted-dark uppercase text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredReports.map((report, i) => (
                                <tr key={i} className="hover:bg-gray-50 dark:bg-gray-800">
                                    <td className="px-6 py-4 font-medium text-text-light dark:text-text-dark">{report.student.full_name}</td>
                                    <td className="px-6 py-4 text-muted dark:text-muted-dark text-sm">{report.classes.map(c => c.name).join(', ')}</td>
                                    <td className="px-6 py-4 text-center font-bold text-text-light dark:text-text-dark">{report.totalAbsences}</td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${report.attendanceRate > 85 ? 'bg-green-500' : report.attendanceRate > 70 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                                    style={{ width: `${report.attendanceRate}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-xs font-medium w-8">{report.attendanceRate}%</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center font-bold text-text-light dark:text-text-dark">
                                        {report.consecutiveAbsencesGlobal > 0 ? (
                                            <span className={`${report.consecutiveAbsencesGlobal >= 3 ? 'text-red-600' : 'text-gray-600 dark:text-gray-100'}`}>
                                                {report.consecutiveAbsencesGlobal}
                                            </span>
                                        ) : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${report.status === 'regular' ? 'bg-green-100 text-green-800' :
                                            report.status === 'risk' ? 'bg-red-100 text-red-800' :
                                                'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {report.status === 'regular' ? 'Regular' :
                                                report.status === 'risk' ? 'Risco' : 'Atenção'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Contact Modal */}
            {contactModalOpen && selectedStudent && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-card-dark rounded-xl p-6 max-w-md w-full shadow-2xl">
                        <h3 className="text-xl font-bold text-text-light dark:text-text-dark mb-4">Registrar Contato</h3>
                        <p className="text-sm text-muted dark:text-muted-dark mb-6">Aluno: <strong>{selectedStudent.name}</strong></p>

                        <div className="mb-4">
                            <label className="block text-sm font-bold text-text-light dark:text-text-dark mb-2">Tipo de Contato</label>
                            <select
                                value={contactType}
                                onChange={(e) => setContactType(e.target.value as any)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            >
                                <option value="phone">Telefone</option>
                                <option value="email">E-mail</option>
                                <option value="in_person">Presencial</option>
                                <option value="other">Outro</option>
                            </select>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-bold text-text-light dark:text-text-dark mb-2">Observações</label>
                            <textarea
                                value={contactNotes}
                                onChange={(e) => setContactNotes(e.target.value)}
                                placeholder="Descreva o que foi conversado com o responsável..."
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none h-32 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setContactModalOpen(false);
                                    setSelectedStudent(null);
                                    setContactNotes('');
                                }}
                                disabled={processingContact}
                                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-white rounded-lg hover:bg-gray-50 dark:bg-gray-800 font-bold transition-colors disabled:opacity-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSaveContact}
                                disabled={processingContact || !contactNotes.trim()}
                                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 font-bold transition-colors disabled:opacity-50"
                            >
                                {processingContact ? 'Salvando...' : 'Salvar Contato'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Student Report Modal */}
            {studentReportModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-card-dark rounded-xl p-6 max-w-md w-full shadow-2xl">
                        <h3 className="text-xl font-bold text-text-light dark:text-text-dark mb-4">Relatório Individual de Aluno</h3>
                        <p className="text-sm text-muted dark:text-muted-dark mb-6">Selecione o aluno para gerar o relatório completo de frequência.</p>

                        <div className="mb-6">
                            <label className="block text-sm font-bold text-text-light dark:text-text-dark mb-2">Selecionar Aluno</label>
                            <select
                                value={selectedStudentForReport}
                                onChange={(e) => setSelectedStudentForReport(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            >
                                <option value="">-- Escolha um aluno --</option>
                                {studentReports.map(report => (
                                    <option key={report.student.id} value={report.student.id}>
                                        {report.student.full_name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setStudentReportModalOpen(false);
                                    setSelectedStudentForReport('');
                                }}
                                disabled={generatingStudentReport}
                                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-white rounded-lg hover:bg-gray-50 dark:bg-gray-800 font-bold transition-colors disabled:opacity-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleGenerateStudentReport}
                                disabled={generatingStudentReport || !selectedStudentForReport}
                                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {generatingStudentReport ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        Gerando...
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined text-lg">picture_as_pdf</span>
                                        Gerar PDF
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
