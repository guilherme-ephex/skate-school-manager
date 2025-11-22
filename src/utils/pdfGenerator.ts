import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { StudentReport, WeeklyStats } from '../hooks/useReportsData';
import { Attendance } from '../types/database';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ClassAttendanceData {
    date: string;
    className: string;
    presences: number;
    absences: number;
    total: number;
    percentage: number;
}

export const generateReportPDF = (
    studentReports: StudentReport[],
    weeklyStats: WeeklyStats[],
    classAttendanceData: ClassAttendanceData[],
    selectedMonth: Date,
    includeHeader: boolean,
    includeSignatures: boolean
) => {
    const doc = new jsPDF();
    let yPos = 20;

    // Header
    if (includeHeader) {
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text('Skate School Manager', 105, yPos, { align: 'center' });
        yPos += 10;
        
        doc.setFontSize(14);
        doc.text('Relatório de Frequência', 105, yPos, { align: 'center' });
        yPos += 8;
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(format(selectedMonth, "MMMM 'de' yyyy", { locale: ptBR }), 105, yPos, { align: 'center' });
        yPos += 15;
    }

    // Weekly Statistics Summary
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Estatísticas Semanais', 14, yPos);
    yPos += 8;

    const weeklyTableData = weeklyStats.map(week => [
        week.name,
        week.presentes.toString(),
        week.faltas.toString(),
        `${week.presentes + week.faltas}`
    ]);

    autoTable(doc, {
        startY: yPos,
        head: [['Semana', 'Presenças', 'Faltas', 'Total']],
        body: weeklyTableData,
        theme: 'grid',
        headStyles: { fillColor: [15, 60, 92] },
        margin: { left: 14, right: 14 }
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;

    // NEW: Class Attendance Detail Table
    if (classAttendanceData.length > 0) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Detalhamento por Aula', 14, yPos);
        yPos += 8;

        const classTableData = classAttendanceData.map(record => [
            format(parseISO(record.date), 'dd/MM/yyyy'),
            record.className,
            record.presences.toString(),
            record.absences.toString(),
            `${record.percentage}%`
        ]);

        autoTable(doc, {
            startY: yPos,
            head: [['Data', 'Turma', 'Presenças', 'Faltas', '% Presença']],
            body: classTableData,
            theme: 'striped',
            headStyles: { fillColor: [15, 60, 92] },
            margin: { left: 14, right: 14 },
            styles: { fontSize: 9 },
            columnStyles: {
                0: { cellWidth: 30 },
                1: { cellWidth: 60 },
                2: { cellWidth: 30 },
                3: { cellWidth: 30 },
                4: { cellWidth: 30 }
            }
        });

        yPos = (doc as any).lastAutoTable.finalY + 15;
    }

    // Students Table
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    
    // Check if we need a new page
    if (yPos > 250) {
        doc.addPage();
        yPos = 20;
    }
    
    doc.text('Registro de Alunos', 14, yPos);
    yPos += 8;

    const studentsTableData = studentReports.map(report => [
        report.student.full_name,
        report.classes.map(c => c.name).join(', '),
        report.totalAbsences.toString(),
        `${report.attendanceRate}%`,
        report.status === 'risk' ? 'Risco' : 
        report.status === 'warning' ? 'Atenção' : 'Regular'
    ]);

    autoTable(doc, {
        startY: yPos,
        head: [['Aluno', 'Turmas', 'Faltas (Mês)', 'Frequência', 'Status']],
        body: studentsTableData,
        theme: 'striped',
        headStyles: { fillColor: [15, 60, 92] },
        margin: { left: 14, right: 14 },
        styles: { fontSize: 8 },
        columnStyles: {
            0: { cellWidth: 50 },
            1: { cellWidth: 50 },
            2: { cellWidth: 25 },
            3: { cellWidth: 25 },
            4: { cellWidth: 30 }
        },
        didParseCell: function(data) {
            if (data.section === 'body' && data.column.index === 4) {
                const status = data.cell.raw as string;
                if (status === 'Risco') {
                    data.cell.styles.textColor = [220, 38, 38];
                    data.cell.styles.fontStyle = 'bold';
                } else if (status === 'Atenção') {
                    data.cell.styles.textColor = [217, 119, 6];
                    data.cell.styles.fontStyle = 'bold';
                }
            }
        }
    });

    // Signatures
    if (includeSignatures) {
        const finalY = (doc as any).lastAutoTable.finalY + 20;
        
        if (finalY > 250) {
            doc.addPage();
            yPos = 20;
        } else {
            yPos = finalY;
        }

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        
        // Signature lines
        doc.line(14, yPos + 20, 90, yPos + 20);
        doc.text('Coordenador', 14, yPos + 25);
        
        doc.line(120, yPos + 20, 196, yPos + 20);
        doc.text('Responsável Administrativo', 120, yPos + 25);
    }

    // Footer with date
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(
            `Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`,
            105,
            doc.internal.pageSize.height - 10,
            { align: 'center' }
        );
        doc.text(
            `Página ${i} de ${pageCount}`,
            doc.internal.pageSize.width - 20,
            doc.internal.pageSize.height - 10,
            { align: 'right' }
        );
    }

    return doc;
};

// NEW: Individual Student Report
export const generateStudentReportPDF = (
    studentName: string,
    attendanceRecords: Array<{
        date: string;
        className: string;
        status: 'present' | 'absent' | 'justified';
    }>,
    includeHeader: boolean
) => {
    const doc = new jsPDF();
    let yPos = 20;

    // Header
    if (includeHeader) {
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text('Skate School Manager', 105, yPos, { align: 'center' });
        yPos += 10;
        
        doc.setFontSize(14);
        doc.text('Relatório Individual de Frequência', 105, yPos, { align: 'center' });
        yPos += 8;
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(`Aluno: ${studentName}`, 105, yPos, { align: 'center' });
        yPos += 15;
    }

    // Summary Stats
    const totalRecords = attendanceRecords.length;
    const presences = attendanceRecords.filter(r => r.status === 'present').length;
    const absences = attendanceRecords.filter(r => r.status === 'absent').length;
    const justified = attendanceRecords.filter(r => r.status === 'justified').length;
    const attendanceRate = totalRecords > 0 ? Math.round((presences / totalRecords) * 100) : 0;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Resumo Geral', 14, yPos);
    yPos += 8;

    const summaryData = [
        ['Total de Aulas', totalRecords.toString()],
        ['Presenças', presences.toString()],
        ['Faltas', absences.toString()],
        ['Justificadas', justified.toString()],
        ['Taxa de Presença', `${attendanceRate}%`]
    ];

    autoTable(doc, {
        startY: yPos,
        body: summaryData,
        theme: 'plain',
        styles: { fontSize: 10 },
        columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 60 },
            1: { cellWidth: 40 }
        },
        margin: { left: 14 }
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;

    // Detailed Attendance Table
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Histórico Detalhado', 14, yPos);
    yPos += 8;

    const detailTableData = attendanceRecords.map(record => [
        format(parseISO(record.date), 'dd/MM/yyyy'),
        record.className,
        record.status === 'present' ? 'Presente' : 
        record.status === 'absent' ? 'Falta' : 'Justificada'
    ]);

    autoTable(doc, {
        startY: yPos,
        head: [['Data', 'Turma', 'Status']],
        body: detailTableData,
        theme: 'striped',
        headStyles: { fillColor: [15, 60, 92] },
        margin: { left: 14, right: 14 },
        styles: { fontSize: 9 },
        columnStyles: {
            0: { cellWidth: 40 },
            1: { cellWidth: 80 },
            2: { cellWidth: 40 }
        },
        didParseCell: function(data) {
            if (data.section === 'body' && data.column.index === 2) {
                const status = data.cell.raw as string;
                if (status === 'Presente') {
                    data.cell.styles.textColor = [22, 163, 74];
                    data.cell.styles.fontStyle = 'bold';
                } else if (status === 'Falta') {
                    data.cell.styles.textColor = [220, 38, 38];
                    data.cell.styles.fontStyle = 'bold';
                } else if (status === 'Justificada') {
                    data.cell.styles.textColor = [217, 119, 6];
                    data.cell.styles.fontStyle = 'bold';
                }
            }
        }
    });

    // Footer with date
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(
            `Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`,
            105,
            doc.internal.pageSize.height - 10,
            { align: 'center' }
        );
        doc.text(
            `Página ${i} de ${pageCount}`,
            doc.internal.pageSize.width - 20,
            doc.internal.pageSize.height - 10,
            { align: 'right' }
        );
    }

    return doc;
};

export const generateReportCSV = (studentReports: StudentReport[], selectedMonth: Date) => {
    const headers = ['Aluno', 'Turmas', 'Faltas (Mês)', 'Frequência (%)', 'Status', 'Faltas Consecutivas'];
    
    const rows = studentReports.map(report => [
        report.student.full_name,
        report.classes.map(c => c.name).join('; '),
        report.totalAbsences,
        report.attendanceRate,
        report.status === 'risk' ? 'Risco' : report.status === 'warning' ? 'Atenção' : 'Regular',
        report.consecutiveAbsencesGlobal
    ]);

    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio_${format(selectedMonth, 'yyyy-MM')}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

