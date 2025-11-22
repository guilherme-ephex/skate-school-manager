import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Student {
  id: string;
  full_name: string;
  avatar_url: string | null;
}

interface AttendanceRecord {
  student_id: string;
  status: 'present' | 'absent' | 'justified';
  justification?: string;
}

interface Class {
  id: string;
  name: string;
  level: string;
  time: string;
  location: string;
  teacher?: {
    full_name: string;
  };
}

export const Attendance: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const classId = searchParams.get('classId');
  const dateParam = searchParams.get('date');
  const shouldCancel = searchParams.get('cancel') === 'true';

  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Map<string, AttendanceRecord>>(new Map());

  // Use string YYYY-MM-DD directly to avoid timezone issues
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    if (dateParam) return dateParam;
    return new Date().toISOString().split('T')[0];
  });

  const [generalNotes, setGeneralNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Novos estados
  const [existingAttendance, setExistingAttendance] = useState<boolean>(false);
  const [isCancelled, setIsCancelled] = useState<boolean>(false);
  const [cancelReason, setCancelReason] = useState<string>('');
  const [canEdit, setCanEdit] = useState<boolean>(true);
  const [showCancelModal, setShowCancelModal] = useState(false);

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (classId) {
      loadClassData(classId);
    }
  }, [classId]);

  // Open cancel modal if shouldCancel parameter is present
  useEffect(() => {
    if (shouldCancel && selectedClass) {
      setShowCancelModal(true);
    }
  }, [shouldCancel, selectedClass]);

  const fetchClasses = async () => {
    try {
      let query = supabase
        .from('classes')
        .select(`
                    *,
                    teacher:profiles!classes_teacher_id_fkey(full_name)
                `);

      // Se for professor (e não admin), filtra apenas suas turmas
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profile?.role === 'TEACHER') {
          query = query.eq('teacher_id', user.id);
        }
      }

      const { data, error } = await query;

      if (error) throw error;
      setClasses(data || []);

      // Se não há classId na URL e há turmas, seleciona a primeira
      if (!classId && data && data.length > 0) {
        setSelectedClass(data[0]);
        loadClassData(data[0].id);
      }
    } catch (error) {
      console.error('Erro ao buscar turmas:', error);
      alert('Erro ao carregar turmas');
    }
  };

  const loadClassData = async (id: string) => {
    setLoading(true);
    try {
      // Buscar informações da turma
      const { data: classData, error: classError } = await supabase
        .from('classes')
        .select(`
                    *,
                    teacher:profiles!classes_teacher_id_fkey(full_name)
                `)
        .eq('id', id)
        .single();

      if (classError) throw classError;
      setSelectedClass(classData);

      // Buscar alunos matriculados
      const { data: enrollments, error: enrollError } = await supabase
        .from('enrollments')
        .select(`
                    student_id,
                    students (
                        id,
                        full_name,
                        avatar_url
                    )
                `)
        .eq('class_id', id)
        .eq('status', 'active');

      if (enrollError) throw enrollError;

      const studentsList = enrollments
        ?.map((e: any) => Array.isArray(e.students) ? e.students[0] : e.students)
        .filter((s: any): s is Student => s !== null && typeof s === 'object' && 'id' in s) || [];

      setStudents(studentsList);

      // Buscar registros de presença existentes para a data selecionada
      await loadExistingAttendance(id, selectedDate);

    } catch (error) {
      console.error('Erro ao carregar dados da turma:', error);
      alert('Erro ao carregar dados da turma');
    } finally {
      setLoading(false);
    }
  };

  const loadExistingAttendance = async (classId: string, dateStr: string) => {
    try {
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('class_id', classId)
        .eq('date', dateStr);

      if (error) throw error;

      console.log('🔍 Dados carregados da attendance:', {
        classId,
        date: dateStr,
        recordCount: data?.length || 0,
        firstRecord: data?.[0],
        isCancelled: data?.[0]?.is_cancelled
      });

      // Resetar estados
      setIsCancelled(false);
      setCancelReason('');
      setExistingAttendance(false);
      setCanEdit(true);

      const attendanceMap = new Map<string, AttendanceRecord>();

      if (data && data.length > 0) {
        setExistingAttendance(true);

        // Verificar se a aula foi cancelada (basta olhar o primeiro registro)
        if (data[0].is_cancelled) {
          setIsCancelled(true);
          setCancelReason(data[0].cancelled_reason || '');
          console.log('✅ Aula marcada como cancelada:', {
            reason: data[0].cancelled_reason
          });
        }

        // Verificar permissões
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

          const isCreator = data[0].created_by === user.id;
          const isAdmin = profile?.role === 'ADMIN';

          if (!isCreator && !isAdmin) {
            setCanEdit(false);
          }
        }

        data.forEach((record: any) => {
          attendanceMap.set(record.student_id, {
            student_id: record.student_id,
            status: record.status,
            justification: record.justification
          });
        });
      } else {
        // Se não existe registro, inicializar todos como presentes
        students.forEach(student => {
          attendanceMap.set(student.id, {
            student_id: student.id,
            status: 'present'
          });
        });
      }

      setAttendance(attendanceMap);
    } catch (error) {
      console.error('Erro ao carregar presença:', error);
    }
  };

  const handleStatusChange = (studentId: string, newStatus: 'present' | 'absent' | 'justified') => {
    setAttendance(prev => {
      const newMap = new Map<string, AttendanceRecord>(prev);
      const existing = newMap.get(studentId);
      newMap.set(studentId, {
        student_id: studentId,
        status: newStatus,
        justification: existing?.justification
      });
      return newMap;
    });
  };

  const handleJustificationChange = (studentId: string, justification: string) => {
    setAttendance(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(studentId) as AttendanceRecord | undefined;
      if (existing) {
        newMap.set(studentId, {
          student_id: existing.student_id,
          status: existing.status,
          justification: justification
        });
      }
      return newMap;
    });
  };

  const handleSaveAttendance = async (forceCancelled?: boolean) => {
    if (!selectedClass || !user) {
      alert('Erro: Usuário não autenticado ou turma não selecionada');
      return;
    }

    if (!canEdit) {
      alert('Você não tem permissão para editar esta chamada.');
      return;
    }

    setSaving(true);
    try {
      const dateStr = selectedDate;

      // Use forceCancelled se fornecido e for booleano, senão usa o estado
      const isThisCancelled = typeof forceCancelled === 'boolean' ? forceCancelled : isCancelled;

      // Preparar registros de presença
      // Se cancelada, salvamos um registro para cada aluno com status null ou mantemos o status mas marcamos is_cancelled
      // A decisão de design foi usar is_cancelled. Vamos manter o status atual mas marcar a flag.

      const attendanceRecords = students.map(student => {
        const record = attendance.get(student.id);
        // Quando cancelada, marcar como 'absent' pois a aula não aconteceu
        // Mas o importante é a flag is_cancelled
        const status: 'present' | 'absent' | 'justified' = isThisCancelled ? 'absent' : (record?.status || 'present');
        const justification: string | null = isThisCancelled ? null : (record?.justification || null);

        return {
          class_id: selectedClass.id,
          student_id: student.id,
          date: dateStr,
          status: status,
          justification: justification,
          is_cancelled: isThisCancelled,
          cancelled_reason: isThisCancelled ? cancelReason : null,
          created_by: user.id
        };
      });

      console.log('🔍 Salvando chamada:', {
        isCancelled: isThisCancelled,
        cancelReason,
        totalRecords: attendanceRecords.length,
        sampleRecord: attendanceRecords[0]
      });

      const { error, data } = await supabase
        .from('attendance')
        .upsert(attendanceRecords, {
          onConflict: 'student_id,class_id,date',
          ignoreDuplicates: false
        })
        .select();

      if (error) {
        console.error('❌ Erro ao salvar:', error);
        throw error;
      }

      console.log('✅ Dados salvos:', data);

      alert(isThisCancelled ? 'Aula cancelada com sucesso!' : 'Chamada salva com sucesso!');

      // Forçar recarregamento dos dados
      await loadExistingAttendance(selectedClass.id, selectedDate);

    } catch (error: any) {
      console.error('Erro detalhado ao salvar chamada:', error);
      // Evita JSON.stringify em objetos de erro complexos que podem ser cíclicos
      const errorMessage = error?.message ||
        error?.error_description ||
        error?.details ||
        (typeof error === 'string' ? error : 'Erro desconhecido');

      alert(`Erro ao salvar chamada: ${errorMessage}. Tente novamente.`);
    } finally {
      setSaving(false);
      setShowCancelModal(false);
    }
  };

  const toggleCancellation = () => {
    if (isCancelled) {
      // Reativar aula
      if (window.confirm('Deseja reativar esta aula? Os status de presença serão mantidos.')) {
        setIsCancelled(false);
        setCancelReason('');
      }
    } else {
      // Cancelar aula
      setShowCancelModal(true);
    }
  };

  const getStudentStatus = (studentId: string): 'present' | 'absent' | 'justified' => {
    const record = attendance.get(studentId);
    return record?.status || 'present';
  };

  const getStudentJustification = (studentId: string): string => {
    const record = attendance.get(studentId);
    return record?.justification || '';
  };

  const stats = {
    present: Array.from(attendance.values()).filter((a: AttendanceRecord) => a.status === 'present').length,
    absent: Array.from(attendance.values()).filter((a: AttendanceRecord) => a.status === 'absent').length,
    justified: Array.from(attendance.values()).filter((a: AttendanceRecord) => a.status === 'justified').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <span className="material-symbols-outlined text-6xl text-primary animate-pulse">hourglass_empty</span>
          <p className="text-muted dark:text-muted-dark mt-4">Carregando...</p>
        </div>
      </div>
    );
  }

  if (classes.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">school</span>
          <p className="text-muted dark:text-muted-dark mb-4">Nenhuma turma cadastrada ainda.</p>
          <button
            onClick={() => navigate('/cadastro')}
            className="bg-primary text-white px-6 py-3 rounded-lg font-bold hover:bg-primary/90"
          >
            Cadastrar Turma
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-32">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-text-light dark:text-text-dark">Registrar Chamada</h1>
        {selectedClass && (
          <button
            onClick={toggleCancellation}
            disabled={!canEdit}
            className={`px-4 py-2 rounded-lg font-bold border transition-colors ${isCancelled
              ? 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200'
              : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isCancelled ? 'Reativar Aula' : 'Cancelar Aula'}
          </button>
        )}
      </div>

      {!canEdit && existingAttendance && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 flex items-center gap-2">
          <span className="material-symbols-outlined">lock</span>
          <span>Esta chamada foi criada por outro professor e você não tem permissão para editá-la.</span>
        </div>
      )}

      {isCancelled && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-800 mb-2">
            <span className="material-symbols-outlined">event_busy</span>
            <span className="font-bold">Aula Cancelada</span>
          </div>
          <p className="text-red-600">Motivo: {cancelReason || 'Sem motivo especificado'}</p>
        </div>
      )}

      {/* Class Selector */}
      <div className="bg-card-light dark:bg-card-dark rounded-xl p-4 shadow-sm border border-border-light dark:border-border-dark mb-6">
        <p className="text-sm text-muted dark:text-muted-dark mb-2">Turma selecionada</p>
        <select
          value={selectedClass?.id || ''}
          onChange={(e) => {
            const classId = e.target.value;
            navigate(`/attendance?classId=${classId}`);
          }}
          className="w-full rounded-lg border-gray-300 dark:border-gray-600 focus:border-primary focus:ring-primary"
        >
          {classes.map(c => {
            const cls = c as any;
            return (
              <option key={cls.id} value={cls.id}>
                {cls.name} — {cls.level} — {cls.time}
              </option>
            );
          })}
        </select>
      </div>

      {/* Date Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-text-light dark:text-text-dark mb-2">Data da Chamada</label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => {
            if (e.target.value) {
              const newDateStr = e.target.value;
              setSelectedDate(newDateStr);
              if (selectedClass) {
                loadExistingAttendance(selectedClass.id, newDateStr);
              }
            }
          }}
          className="w-full md:w-auto rounded-lg border-gray-300 dark:border-gray-600 focus:border-primary focus:ring-primary"
        />
      </div>

      {/* Student List */}
      {students.length === 0 ? (
        <div className="text-center py-12">
          <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">group_off</span>
          <p className="text-muted dark:text-muted-dark">Nenhum aluno matriculado nesta turma.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {students.map(student => {
            const status = getStudentStatus(student.id);
            const justification = getStudentJustification(student.id);

            return (
              <div
                key={student.id}
                className={`bg-card-light rounded-xl p-4 shadow-sm border-l-4 transition-all ${isCancelled
                  ? 'border-gray-300 dark:border-gray-600 opacity-75'
                  : status === 'present'
                    ? 'border-success'
                    : status === 'absent'
                      ? 'border-danger'
                      : 'border-warning'
                  }`}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                    {student.avatar_url ? (
                      <img src={student.avatar_url} alt={student.full_name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="material-symbols-outlined text-gray-400">person</span>
                    )}
                  </div>
                  <span className="font-semibold text-lg text-text-light dark:text-text-dark">{student.full_name}</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleStatusChange(student.id, 'present')}
                    disabled={isCancelled || !canEdit}
                    className={`flex flex-col items-center gap-1 p-3 rounded-lg transition-colors ${status === 'present' ? 'bg-success text-white' : 'bg-gray-100 dark:bg-gray-700 text-muted'} disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <span className="material-symbols-outlined">check_circle</span>
                    <span className="text-sm font-bold">Presente</span>
                  </button>
                  <button
                    onClick={() => handleStatusChange(student.id, 'absent')}
                    disabled={isCancelled || !canEdit}
                    className={`flex flex-col items-center gap-1 p-3 rounded-lg transition-colors ${status === 'absent' ? 'bg-danger text-white' : 'bg-gray-100 dark:bg-gray-700 text-muted'} disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <span className="material-symbols-outlined">cancel</span>
                    <span className="text-sm font-bold">Falta</span>
                  </button>
                  <button
                    onClick={() => handleStatusChange(student.id, 'justified')}
                    disabled={isCancelled || !canEdit}
                    className={`flex flex-col items-center gap-1 p-3 rounded-lg transition-colors ${status === 'justified' ? 'bg-warning text-white' : 'bg-gray-100 dark:bg-gray-700 text-muted'} disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <span className="material-symbols-outlined">event_note</span>
                    <span className="text-sm font-bold">Justificada</span>
                  </button>
                </div>

                {status === 'justified' && !isCancelled && (
                  <div className="mt-4">
                    <label className="text-sm font-medium text-text-light dark:text-text-dark block mb-2">
                      Motivo da Justificativa
                    </label>
                    <input
                      type="text"
                      value={justification}
                      onChange={(e) => handleJustificationChange(student.id, e.target.value)}
                      disabled={!canEdit}
                      placeholder="Ex: Consulta médica"
                      className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary disabled:bg-gray-100 dark:bg-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Cancelamento */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-card-dark rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4 text-red-600">Cancelar Aula</h3>
            <p className="text-gray-600 dark:text-gray-100 mb-4">
              Tem certeza que deseja cancelar esta aula? Isso não contará como falta para os alunos.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                Motivo do cancelamento
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                rows={3}
                placeholder="Ex: Chuva forte, Professor doente..."
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-100 hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-800 rounded-lg"
              >
                Voltar
              </button>
              <button
                onClick={() => {
                  setIsCancelled(true);
                  handleSaveAttendance(true); // Força is_cancelled = true
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Confirmar Cancelamento
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8">
        <label className="block text-sm font-medium text-text-light dark:text-text-dark mb-2">
          Observações gerais da aula (opcional)
        </label>
        <textarea
          value={generalNotes}
          onChange={(e) => setGeneralNotes(e.target.value)}
          className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          rows={4}
          placeholder="Algum detalhe importante sobre a aula de hoje?"
        />
      </div>

      {/* Footer Sticky */}
      <div className="fixed bottom-0 left-0 lg:left-64 right-0 bg-white dark:bg-card-dark/90 backdrop-blur-sm border-t border-border-light dark:border-border-dark p-4 z-40">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center gap-4">
          <div className="grid grid-cols-3 gap-8 text-center w-full sm:w-auto">
            <div>
              <p className="font-bold text-lg text-success">{stats.present}</p>
              <p className="text-xs text-muted dark:text-muted-dark">Presentes</p>
            </div>
            <div>
              <p className="font-bold text-lg text-danger">{stats.absent}</p>
              <p className="text-xs text-muted dark:text-muted-dark">Faltas</p>
            </div>
            <div>
              <p className="font-bold text-lg text-warning">{stats.justified}</p>
              <p className="text-xs text-muted dark:text-muted-dark">Justificados</p>
            </div>
          </div>
          <button
            onClick={() => handleSaveAttendance()}
            disabled={saving || students.length === 0 || !canEdit}
            className="w-full sm:w-auto flex-grow h-12 bg-primary text-white rounded-lg font-bold flex items-center justify-center gap-2 shadow hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined">save</span>
            {saving ? 'Salvando...' : (existingAttendance ? 'Atualizar Chamada' : 'Salvar Chamada')}
          </button>
        </div>
      </div>
    </div>
  );
};
