import React, { useState, useEffect } from 'react';
import { api } from '../src/lib/api';
import { Student, Class } from '../src/types/database';

export const Enrollment: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [enrolledClasses, setEnrolledClasses] = useState<string[]>([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editFormData, setEditFormData] = useState({
    full_name: '',
    date_of_birth: '',
    email: '',
    phone: '',
    parent_name: '',
    parent_phone: '',
    parent_email: '',
    avatar_url: '',
    medical_info: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [studentsData, classesData] = await Promise.all([
        api.getStudents(),
        api.getClasses()
      ]);
      setStudents(studentsData);
      setClasses(classesData);
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Erro ao carregar dados.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = async (student: Student) => {
    setSelectedStudent(student);
    setShowModal(true);
    setModalLoading(true);
    try {
      const studentClasses = await api.getStudentClasses(student.id);
      setEnrolledClasses(studentClasses.map(c => c.id));
    } catch (error) {
      console.error('Error fetching student classes:', error);
      alert('Erro ao carregar matrículas do aluno.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleOpenEditModal = (student: Student) => {
    setSelectedStudent(student);
    setEditFormData({
      full_name: student.full_name || '',
      date_of_birth: student.date_of_birth || '',
      email: student.email || '',
      phone: student.phone || '',
      parent_name: student.parent_name || '',
      parent_phone: student.parent_phone || '',
      parent_email: student.parent_email || '',
      avatar_url: student.avatar_url || '',
      medical_info: student.medical_info || ''
    });
    setShowEditModal(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!e.target.files || e.target.files.length === 0) {
        throw new Error('Você deve selecionar uma imagem.');
      }

      const file = e.target.files[0];
      const avatarUrl = await api.uploadAvatar(file);
      setEditFormData(prev => ({ ...prev, avatar_url: avatarUrl }));
      alert('Foto carregada com sucesso!');
    } catch (error) {
      alert('Erro ao carregar imagem!');
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;

    try {
      setLoading(true);
      await api.updateStudent(selectedStudent.id, editFormData);
      alert('Aluno atualizado com sucesso!');
      setShowEditModal(false);
      await fetchData(); // Refresh the list
    } catch (error) {
      console.error('Error updating student:', error);
      alert('Erro ao atualizar aluno.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleClass = async (classId: string) => {
    if (!selectedStudent) return;

    const isEnrolled = enrolledClasses.includes(classId);
    try {
      if (isEnrolled) {
        await api.unenrollStudent(selectedStudent.id, classId);
        setEnrolledClasses(prev => prev.filter(id => id !== classId));
      } else {
        await api.enrollStudent(selectedStudent.id, classId);
        setEnrolledClasses(prev => [...prev, classId]);
      }
    } catch (error) {
      console.error('Error updating enrollment:', error);
      alert('Erro ao atualizar matrícula.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-10">
      <div className="flex items-center gap-2 text-sm text-muted mb-4">
        <span>Painel</span> <span>/</span> <span>Alunos</span> <span>/</span> <span className="font-bold text-text-light">Matricular</span>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-black text-text-light">Matricular Aluno</h1>
        <p className="text-muted">Gerencie as matrículas dos alunos nas turmas disponíveis.</p>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 mb-6 flex gap-4 shadow-sm">
        <div className="relative flex-grow">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <span className="material-symbols-outlined">search</span>
          </div>
          <input
            type="text"
            className="w-full pl-10 pr-4 h-12 rounded-lg border-none bg-gray-50 focus:ring-2 focus:ring-primary"
            placeholder="Buscar por nome do aluno..."
          />
        </div>
      </div>

      {/* List */}
      <div className="flex flex-col gap-4">
        {loading ? (
          <p className="text-center text-gray-500">Carregando...</p>
        ) : (
          students.map(student => (
            <div key={student.id} className="bg-white p-4 rounded-xl border border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                  {student.avatar_url ? (
                    <img src={student.avatar_url} alt={student.full_name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="material-symbols-outlined text-gray-400">person</span>
                  )}
                </div>
                <div>
                  <p className="font-bold text-gray-800">{student.full_name}</p>
                  <p className="text-sm text-gray-500">{student.email || 'Sem e-mail'}</p>
                </div>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={() => handleOpenEditModal(student)}
                  className="flex-1 sm:flex-none h-10 px-4 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-50 transition-colors flex items-center justify-center gap-1"
                >
                  <span className="material-symbols-outlined text-base">edit</span>
                  Editar
                </button>
                <button
                  onClick={() => handleOpenModal(student)}
                  className="flex-1 sm:flex-none h-10 px-6 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors"
                >
                  Gerenciar Matrículas
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && selectedStudent && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Matrículas de {selectedStudent.full_name}</h2>
                <p className="text-sm text-gray-500">Selecione as turmas para matricular o aluno.</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {modalLoading ? (
                <div className="flex justify-center py-8">
                  <span className="material-symbols-outlined animate-spin text-primary text-3xl">progress_activity</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {classes.map(cls => {
                    const isEnrolled = enrolledClasses.includes(cls.id);
                    return (
                      <label
                        key={cls.id}
                        className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${isEnrolled
                          ? 'border-primary bg-primary/5 ring-1 ring-primary'
                          : 'border-gray-200 hover:border-primary/50 hover:bg-gray-50'
                          }`}
                      >
                        <div className={`w-6 h-6 rounded border flex items-center justify-center transition-colors ${isEnrolled ? 'bg-primary border-primary' : 'border-gray-300 bg-white'
                          }`}>
                          {isEnrolled && <span className="material-symbols-outlined text-white text-sm">check</span>}
                        </div>
                        <input
                          type="checkbox"
                          checked={isEnrolled}
                          onChange={() => handleToggleClass(cls.id)}
                          className="hidden"
                        />
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <p className="font-bold text-gray-800">{cls.name}</p>
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${cls.level === 'Iniciante' ? 'bg-green-100 text-green-700' :
                              cls.level === 'Intermediário' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                              {cls.level}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-base">schedule</span>
                              {cls.days?.join(', ')} - {cls.time}
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-base">person</span>
                              {(cls as any).teacher?.full_name || 'Sem professor'}
                            </span>
                          </div>
                        </div>
                      </label>
                    );
                  })}
                  {classes.length === 0 && (
                    <p className="text-center text-gray-500 py-4">Nenhuma turma cadastrada.</p>
                  )}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-3 rounded-lg bg-gray-800 text-white font-bold hover:bg-gray-900 transition-colors"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {showEditModal && selectedStudent && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Editar Aluno</h2>
                <p className="text-sm text-gray-500">Atualize as informações do aluno.</p>
              </div>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="overflow-y-auto flex-1">
              <div className="p-6 space-y-6">
                {/* Photo Upload Section */}
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200">
                    {editFormData.avatar_url ? (
                      <img src={editFormData.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="material-symbols-outlined text-gray-400 text-3xl">person</span>
                    )}
                  </div>
                  <div>
                    <label className="cursor-pointer bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors inline-block">
                      {uploading ? 'Carregando...' : 'Carregar foto'}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                        disabled={uploading}
                      />
                    </label>
                    <p className="text-xs text-gray-500 mt-1">JPG, PNG ou GIF. Máx 2MB.</p>
                  </div>
                </div>

                {/* Personal Information */}
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Dados Pessoais</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="flex flex-col gap-1.5">
                      <span className="text-sm font-bold text-gray-600">Nome completo</span>
                      <input
                        type="text"
                        value={editFormData.full_name}
                        onChange={(e) => setEditFormData({ ...editFormData, full_name: e.target.value })}
                        className="form-input rounded-lg border-gray-200 focus:border-primary focus:ring-primary h-12 bg-gray-50/50"
                        required
                      />
                    </label>
                    <label className="flex flex-col gap-1.5">
                      <span className="text-sm font-bold text-gray-600">Data de nascimento</span>
                      <input
                        type="date"
                        value={editFormData.date_of_birth}
                        onChange={(e) => setEditFormData({ ...editFormData, date_of_birth: e.target.value })}
                        className="form-input rounded-lg border-gray-200 focus:border-primary focus:ring-primary h-12 bg-gray-50/50"
                      />
                    </label>
                  </div>
                </div>

                {/* Contact Information */}
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Contato do Aluno</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="flex flex-col gap-1.5">
                      <span className="text-sm font-bold text-gray-600">Telefone</span>
                      <input
                        type="tel"
                        value={editFormData.phone}
                        onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                        className="form-input rounded-lg border-gray-200 focus:border-primary focus:ring-primary h-12 bg-gray-50/50"
                        placeholder="(00) 00000-0000"
                      />
                    </label>
                    <label className="flex flex-col gap-1.5">
                      <span className="text-sm font-bold text-gray-600">E-mail</span>
                      <input
                        type="email"
                        value={editFormData.email}
                        onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                        className="form-input rounded-lg border-gray-200 focus:border-primary focus:ring-primary h-12 bg-gray-50/50"
                        placeholder="exemplo@email.com"
                      />
                    </label>
                  </div>
                </div>

                {/* Parent Contact */}
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Contato do Responsável</h3>
                  <div className="space-y-4">
                    <label className="flex flex-col gap-1.5">
                      <span className="text-sm font-bold text-gray-600">Nome do responsável</span>
                      <input
                        type="text"
                        value={editFormData.parent_name}
                        onChange={(e) => setEditFormData({ ...editFormData, parent_name: e.target.value })}
                        className="form-input rounded-lg border-gray-200 focus:border-primary focus:ring-primary h-12 bg-gray-50/50"
                        placeholder="Insira o nome do responsável"
                      />
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <label className="flex flex-col gap-1.5">
                        <span className="text-sm font-bold text-gray-600">Telefone do responsável</span>
                        <input
                          type="tel"
                          value={editFormData.parent_phone}
                          onChange={(e) => setEditFormData({ ...editFormData, parent_phone: e.target.value })}
                          className="form-input rounded-lg border-gray-200 focus:border-primary focus:ring-primary h-12 bg-gray-50/50"
                          placeholder="(00) 00000-0000"
                        />
                      </label>
                      <label className="flex flex-col gap-1.5">
                        <span className="text-sm font-bold text-gray-600">E-mail do responsável</span>
                        <input
                          type="email"
                          value={editFormData.parent_email}
                          onChange={(e) => setEditFormData({ ...editFormData, parent_email: e.target.value })}
                          className="form-input rounded-lg border-gray-200 focus:border-primary focus:ring-primary h-12 bg-gray-50/50"
                          placeholder="responsavel@email.com"
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Medical Information */}
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Informações Médicas</h3>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-sm font-bold text-gray-600">Observações médicas</span>
                    <textarea
                      value={editFormData.medical_info}
                      onChange={(e) => setEditFormData({ ...editFormData, medical_info: e.target.value })}
                      className="form-textarea rounded-lg border-gray-200 focus:border-primary focus:ring-primary bg-gray-50/50"
                      rows={3}
                      placeholder="Alergias, condições médicas, medicamentos, etc."
                    />
                  </label>
                </div>
              </div>

              <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-6 py-3 rounded-lg bg-white border border-gray-300 text-gray-700 font-bold hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 rounded-lg bg-gray-800 text-white font-bold hover:bg-gray-900 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};