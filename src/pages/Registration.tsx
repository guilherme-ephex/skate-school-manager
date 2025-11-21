import React, { useState } from 'react';
import { api } from '../lib/api';

type Tab = 'students' | 'teachers' | 'classes';

export const Registration: React.FC = () => {
    const [activeTab, setActiveTab] = useState<Tab>('students');
    const [loading, setLoading] = useState(false);

    // Student Form State
    const [studentForm, setStudentForm] = useState({
        fullName: '',
        dateOfBirth: '',
        email: '',
        phone: '',
        parentName: '',
        parentPhone: '',
        parentEmail: '',
        avatar: null as File | null,
    });

    const handleStudentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            let avatarUrl = null;
            if (studentForm.avatar) {
                avatarUrl = await api.uploadAvatar(studentForm.avatar);
            }

            await api.createStudent({
                full_name: studentForm.fullName,
                date_of_birth: studentForm.dateOfBirth || null,
                email: studentForm.email,
                phone: studentForm.phone,
                parent_name: studentForm.parentName,
                parent_phone: studentForm.parentPhone,
                parent_email: studentForm.parentEmail,
                avatar_url: avatarUrl,
            });

            alert('Aluno cadastrado com sucesso!');
            setStudentForm({
                fullName: '',
                dateOfBirth: '',
                email: '',
                phone: '',
                parentName: '',
                parentPhone: '',
                parentEmail: '',
                avatar: null,
            });
        } catch (error) {
            console.error(error);
            alert('Erro ao cadastrar aluno.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto pb-10">
            <div className="mb-8">
                <h1 className="text-3xl font-black text-text-light">Área de Cadastro</h1>
                <p className="text-muted">Cadastre novos alunos, professores e turmas no sistema.</p>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-8 border-b border-border-light mb-8">
                <button
                    onClick={() => setActiveTab('students')}
                    className={`pb-4 flex items-center gap-2 font-bold transition-colors relative ${activeTab === 'students' ? 'text-primary' : 'text-muted hover:text-text-light'
                        }`}
                >
                    <span className="material-symbols-outlined">person_add</span>
                    Alunos
                    {activeTab === 'students' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('teachers')}
                    className={`pb-4 flex items-center gap-2 font-bold transition-colors relative ${activeTab === 'teachers' ? 'text-primary' : 'text-muted hover:text-text-light'
                        }`}
                >
                    <span className="material-symbols-outlined">school</span>
                    Professores
                    {activeTab === 'teachers' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('classes')}
                    className={`pb-4 flex items-center gap-2 font-bold transition-colors relative ${activeTab === 'classes' ? 'text-primary' : 'text-muted hover:text-text-light'
                        }`}
                >
                    <span className="material-symbols-outlined">groups</span>
                    Turmas
                    {activeTab === 'classes' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
                    )}
                </button>
            </div>

            {/* Content */}
            <div className="bg-white rounded-xl shadow-sm border border-border-light p-8">
                {activeTab === 'students' && (
                    <form onSubmit={handleStudentSubmit} className="max-w-4xl">
                        {/* Avatar Upload - Kept as requested previously, though not in image */}
                        <div className="mb-8 flex items-center gap-6">
                            <div className="w-24 h-24 rounded-full bg-gray-50 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden relative group cursor-pointer hover:border-primary transition-colors">
                                {studentForm.avatar ? (
                                    <img
                                        src={URL.createObjectURL(studentForm.avatar)}
                                        alt="Preview"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <span className="material-symbols-outlined text-gray-400 text-3xl">add_a_photo</span>
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setStudentForm({ ...studentForm, avatar: e.target.files?.[0] || null })}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                />
                            </div>
                            <div>
                                <h3 className="font-bold text-text-light">Foto do Aluno</h3>
                                <p className="text-sm text-muted">Clique para adicionar uma foto</p>
                            </div>
                        </div>

                        {/* Dados Pessoais */}
                        <div className="mb-6">
                            <h2 className="text-lg font-bold text-text-light mb-4">Dados Pessoais do Aluno</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <label className="flex flex-col gap-1.5">
                                    <span className="text-sm font-bold text-text-light">Nome completo</span>
                                    <input
                                        type="text"
                                        required
                                        value={studentForm.fullName}
                                        onChange={(e) => setStudentForm({ ...studentForm, fullName: e.target.value })}
                                        className="w-full rounded-lg border-gray-200 bg-white px-4 h-12 text-sm focus:border-primary focus:ring-primary placeholder-gray-400"
                                        placeholder="Insira o nome completo do aluno"
                                    />
                                </label>
                                <label className="flex flex-col gap-1.5">
                                    <span className="text-sm font-bold text-text-light">Data de nascimento</span>
                                    <input
                                        type="date"
                                        value={studentForm.dateOfBirth}
                                        onChange={(e) => setStudentForm({ ...studentForm, dateOfBirth: e.target.value })}
                                        className="w-full rounded-lg border-gray-200 bg-white px-4 h-12 text-sm focus:border-primary focus:ring-primary text-gray-500"
                                    />
                                </label>
                            </div>
                        </div>

                        <hr className="border-gray-100 my-8" />

                        {/* Contato do Aluno */}
                        <div className="mb-6">
                            <h2 className="text-lg font-bold text-text-light mb-4">Contato do Aluno</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <label className="flex flex-col gap-1.5">
                                    <span className="text-sm font-bold text-text-light">Telefone</span>
                                    <input
                                        type="tel"
                                        value={studentForm.phone}
                                        onChange={(e) => setStudentForm({ ...studentForm, phone: e.target.value })}
                                        className="w-full rounded-lg border-gray-200 bg-white px-4 h-12 text-sm focus:border-primary focus:ring-primary placeholder-gray-400"
                                        placeholder="(00) 00000-0000"
                                    />
                                </label>
                                <label className="flex flex-col gap-1.5">
                                    <span className="text-sm font-bold text-text-light">E-mail</span>
                                    <input
                                        type="email"
                                        value={studentForm.email}
                                        onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                                        className="w-full rounded-lg border-gray-200 bg-white px-4 h-12 text-sm focus:border-primary focus:ring-primary placeholder-gray-400"
                                        placeholder="exemplo@email.com"
                                    />
                                </label>
                            </div>
                        </div>

                        <hr className="border-gray-100 my-8" />

                        {/* Contato do Responsável */}
                        <div className="mb-8">
                            <h2 className="text-lg font-bold text-text-light mb-4">Contato do Responsável</h2>
                            <div className="flex flex-col gap-6">
                                <label className="flex flex-col gap-1.5">
                                    <span className="text-sm font-bold text-text-light">Nome do responsável</span>
                                    <input
                                        type="text"
                                        value={studentForm.parentName}
                                        onChange={(e) => setStudentForm({ ...studentForm, parentName: e.target.value })}
                                        className="w-full rounded-lg border-gray-200 bg-white px-4 h-12 text-sm focus:border-primary focus:ring-primary placeholder-gray-400"
                                        placeholder="Insira o nome do responsável"
                                    />
                                </label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <label className="flex flex-col gap-1.5">
                                        <span className="text-sm font-bold text-text-light">Telefone do responsável</span>
                                        <input
                                            type="tel"
                                            value={studentForm.parentPhone}
                                            onChange={(e) => setStudentForm({ ...studentForm, parentPhone: e.target.value })}
                                            className="w-full rounded-lg border-gray-200 bg-white px-4 h-12 text-sm focus:border-primary focus:ring-primary placeholder-gray-400"
                                            placeholder="(00) 00000-0000"
                                        />
                                    </label>
                                    <label className="flex flex-col gap-1.5">
                                        <span className="text-sm font-bold text-text-light">E-mail do responsável</span>
                                        <input
                                            type="email"
                                            value={studentForm.parentEmail}
                                            onChange={(e) => setStudentForm({ ...studentForm, parentEmail: e.target.value })}
                                            className="w-full rounded-lg border-gray-200 bg-white px-4 h-12 text-sm focus:border-primary focus:ring-primary placeholder-gray-400"
                                            placeholder="responsavel@email.com"
                                        />
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-[#0f3c5c] text-white px-8 py-3 rounded-lg font-bold hover:bg-[#0A283D] transition-colors disabled:opacity-50 shadow-lg shadow-blue-900/20"
                            >
                                {loading ? 'Cadastrando...' : 'Cadastrar Aluno'}
                            </button>
                        </div>
                    </form>
                )}

                {activeTab === 'teachers' && (
                    <div className="text-center py-12 text-muted">
                        <span className="material-symbols-outlined text-4xl mb-2">engineering</span>
                        <p>Formulário de Professores em desenvolvimento</p>
                    </div>
                )}

                {activeTab === 'classes' && (
                    <div className="text-center py-12 text-muted">
                        <span className="material-symbols-outlined text-4xl mb-2">engineering</span>
                        <p>Formulário de Turmas em desenvolvimento</p>
                    </div>
                )}
            </div>
        </div>
    );
};
