import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export const Registration: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'students' | 'teachers' | 'classes'>('students');
    const location = useLocation();
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [formData, setFormData] = useState({
        full_name: '',
        date_of_birth: '',
        email: '',
        phone: '',
        parent_name: '',
        parent_phone: '',
        parent_email: '',
        avatar_url: ''
    });

    // Teacher Tab State
    const [usersList, setUsersList] = useState<any[]>([]);
    const [selectedTeacher, setSelectedTeacher] = useState<any>(null);
    const [teacherFormData, setTeacherFormData] = useState({
        full_name: '',
        date_of_birth: '',
        phone: '',
        avatar_url: ''
    });

    // Classes Tab State
    const [teachersList, setTeachersList] = useState<any[]>([]);
    const [classFormData, setClassFormData] = useState({
        name: '',
        level: 'Iniciante',
        teacher_id: '',
        capacity: '',
        days: [] as string[],
        time: '',
        location: ''
    });

    useEffect(() => {
        if (activeTab === 'teachers') {
            fetchUsers();
        } else if (activeTab === 'classes') {
            fetchTeachers();
        }
    }, [activeTab]);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const tab = params.get('tab');
        if (tab === 'classes') setActiveTab('classes');
        else if (tab === 'teachers') setActiveTab('teachers');
    }, [location.search]);

    const fetchUsers = async () => {
        const { data } = await supabase
            .from('profiles')
            .select('*')
            .order('full_name', { ascending: true });
        setUsersList(data || []);
    };

    const fetchTeachers = async () => {
        const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('role', 'TEACHER')
            .order('full_name', { ascending: true });
        setTeachersList(data || []);
    };

    const handleTeacherImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);
            if (!e.target.files || e.target.files.length === 0) {
                throw new Error('You must select an image to upload.');
            }

            const file = e.target.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) {
                throw uploadError;
            }

            const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);

            setTeacherFormData(prev => ({ ...prev, avatar_url: data.publicUrl }));
            alert('Foto carregada com sucesso!');
        } catch (error) {
            alert('Erro ao carregar imagem!');
            console.error(error);
        } finally {
            setUploading(false);
        }
    };

    const handleTeacherSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTeacher) return;
        setLoading(true);

        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: teacherFormData.full_name,
                    date_of_birth: teacherFormData.date_of_birth,
                    phone: teacherFormData.phone,
                    avatar_url: teacherFormData.avatar_url,
                    role: 'TEACHER'
                })
                .eq('id', selectedTeacher.id);

            if (error) throw error;

            alert('Professor cadastrado com sucesso!');
            setSelectedTeacher(null);
            setTeacherFormData({ full_name: '', date_of_birth: '', phone: '', avatar_url: '' });
            fetchUsers(); // Refresh list
        } catch (error) {
            alert('Erro ao cadastrar professor!');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleClassSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase
                .from('classes')
                .insert([
                    {
                        name: classFormData.name,
                        level: classFormData.level,
                        teacher_id: classFormData.teacher_id,
                        capacity: parseInt(classFormData.capacity),
                        days: classFormData.days,
                        time: classFormData.time,
                        location: classFormData.location
                    }
                ]);

            if (error) throw error;

            alert('Turma cadastrada com sucesso!');
            setClassFormData({
                name: '',
                level: 'Iniciante',
                teacher_id: '',
                capacity: '',
                days: [],
                time: '',
                location: ''
            });
        } catch (error) {
            alert('Erro ao cadastrar turma!');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const toggleDay = (day: string) => {
        setClassFormData(prev => {
            const days = prev.days.includes(day)
                ? prev.days.filter(d => d !== day)
                : [...prev.days, day];
            return { ...prev, days };
        });
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);
            if (!e.target.files || e.target.files.length === 0) {
                throw new Error('You must select an image to upload.');
            }

            const file = e.target.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) {
                throw uploadError;
            }

            const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);

            setFormData(prev => ({ ...prev, avatar_url: data.publicUrl }));
            alert('Foto carregada com sucesso!');
        } catch (error) {
            alert('Erro ao carregar imagem!');
            console.error(error);
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase
                .from('students')
                .insert([
                    {
                        full_name: formData.full_name,
                        date_of_birth: formData.date_of_birth,
                        email: formData.email,
                        phone: formData.phone,
                        parent_name: formData.parent_name,
                        parent_phone: formData.parent_phone,
                        parent_email: formData.parent_email,
                        avatar_url: formData.avatar_url,
                        contact_info: JSON.stringify({
                            phone: formData.phone,
                            email: formData.email,
                            parent_phone: formData.parent_phone,
                            parent_email: formData.parent_email
                        }) // Keeping backward compatibility if needed, or just for extra safety
                    }
                ]);

            if (error) throw error;

            alert('Aluno cadastrado com sucesso!');
            setFormData({
                full_name: '',
                date_of_birth: '',
                email: '',
                phone: '',
                parent_name: '',
                parent_phone: '',
                parent_email: '',
                avatar_url: ''
            });
        } catch (error) {
            alert('Erro ao cadastrar aluno!');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto pb-10">
            <div className="mb-8">
                <h1 className="text-3xl font-black text-text-light">Área de Cadastro</h1>
                <p className="text-muted">Cadastre novos alunos, professores e turmas no sistema.</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-8 border-b border-gray-200 mb-8">
                <button
                    onClick={() => setActiveTab('students')}
                    className={`pb-4 px-2 font-bold flex items-center gap-2 transition-colors ${activeTab === 'students'
                        ? 'text-primary border-b-2 border-primary'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <span className="material-symbols-outlined">person_add</span>
                    Alunos
                </button>
                <button
                    onClick={() => setActiveTab('teachers')}
                    className={`pb-4 px-2 font-bold flex items-center gap-2 transition-colors ${activeTab === 'teachers'
                        ? 'text-primary border-b-2 border-primary'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <span className="material-symbols-outlined">school</span>
                    Professores
                </button>
                <button
                    onClick={() => setActiveTab('classes')}
                    className={`pb-4 px-2 font-bold flex items-center gap-2 transition-colors ${activeTab === 'classes'
                        ? 'text-primary border-b-2 border-primary'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <span className="material-symbols-outlined">groups</span>
                    Turmas
                </button>
            </div>

            {/* Content */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                {activeTab === 'students' && (
                    <form onSubmit={handleSubmit} className="flex flex-col gap-8">

                        {/* Photo Upload Section */}
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200">
                                {formData.avatar_url ? (
                                    <img src={formData.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
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

                        {/* Dados Pessoais */}
                        <section>
                            <h3 className="text-lg font-bold text-gray-800 mb-4">Dados Pessoais do Aluno</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <label className="flex flex-col gap-1.5">
                                    <span className="text-sm font-bold text-gray-600">Nome completo</span>
                                    <input
                                        type="text"
                                        name="full_name"
                                        value={formData.full_name}
                                        onChange={handleInputChange}
                                        className="form-input rounded-lg border-gray-200 focus:border-primary focus:ring-primary h-12 bg-gray-50/50"
                                        placeholder="Insira o nome completo do aluno"
                                        required
                                    />
                                </label>
                                <label className="flex flex-col gap-1.5">
                                    <span className="text-sm font-bold text-gray-600">Data de nascimento</span>
                                    <div className="relative">
                                        <input
                                            type="date"
                                            name="date_of_birth"
                                            value={formData.date_of_birth}
                                            onChange={handleInputChange}
                                            className="form-input w-full rounded-lg border-gray-200 focus:border-primary focus:ring-primary h-12 bg-gray-50/50"
                                            required
                                        />
                                    </div>
                                </label>
                            </div>
                        </section>

                        <hr className="border-gray-100" />

                        {/* Contato do Aluno */}
                        <section>
                            <h3 className="text-lg font-bold text-gray-800 mb-4">Contato do Aluno</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <label className="flex flex-col gap-1.5">
                                    <span className="text-sm font-bold text-gray-600">Telefone</span>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        className="form-input rounded-lg border-gray-200 focus:border-primary focus:ring-primary h-12 bg-gray-50/50"
                                        placeholder="(00) 00000-0000"
                                    />
                                </label>
                                <label className="flex flex-col gap-1.5">
                                    <span className="text-sm font-bold text-gray-600">E-mail</span>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        className="form-input rounded-lg border-gray-200 focus:border-primary focus:ring-primary h-12 bg-gray-50/50"
                                        placeholder="exemplo@email.com"
                                    />
                                </label>
                            </div>
                        </section>

                        <hr className="border-gray-100" />

                        {/* Contato do Responsável */}
                        <section>
                            <h3 className="text-lg font-bold text-gray-800 mb-4">Contato do Responsável</h3>
                            <div className="flex flex-col gap-6">
                                <label className="flex flex-col gap-1.5">
                                    <span className="text-sm font-bold text-gray-600">Nome do responsável</span>
                                    <input
                                        type="text"
                                        name="parent_name"
                                        value={formData.parent_name}
                                        onChange={handleInputChange}
                                        className="form-input rounded-lg border-gray-200 focus:border-primary focus:ring-primary h-12 bg-gray-50/50"
                                        placeholder="Insira o nome do responsável"
                                    />
                                </label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <label className="flex flex-col gap-1.5">
                                        <span className="text-sm font-bold text-gray-600">Telefone do responsável</span>
                                        <input
                                            type="tel"
                                            name="parent_phone"
                                            value={formData.parent_phone}
                                            onChange={handleInputChange}
                                            className="form-input rounded-lg border-gray-200 focus:border-primary focus:ring-primary h-12 bg-gray-50/50"
                                            placeholder="(00) 00000-0000"
                                        />
                                    </label>
                                    <label className="flex flex-col gap-1.5">
                                        <span className="text-sm font-bold text-gray-600">E-mail do responsável</span>
                                        <input
                                            type="email"
                                            name="parent_email"
                                            value={formData.parent_email}
                                            onChange={handleInputChange}
                                            className="form-input rounded-lg border-gray-200 focus:border-primary focus:ring-primary h-12 bg-gray-50/50"
                                            placeholder="responsavel@email.com"
                                        />
                                    </label>
                                </div>
                            </div>
                        </section>

                        <div className="flex justify-end mt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-[#1e293b] text-white px-8 py-3 rounded-lg font-bold hover:bg-[#0f172a] transition-colors disabled:opacity-50"
                            >
                                {loading ? 'Cadastrando...' : 'Cadastrar Aluno'}
                            </button>
                        </div>
                    </form>
                )}

                {activeTab === 'teachers' && (
                    <div className="flex flex-col gap-8">
                        {/* Users List Section */}
                        <section>
                            <h3 className="text-lg font-bold text-gray-800 mb-4">Selecionar Usuário</h3>
                            <p className="text-sm text-gray-500 mb-4">Selecione um usuário da lista abaixo para vincular a um perfil de professor.</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto pr-2">
                                {usersList.length === 0 ? (
                                    <div className="col-span-full text-center py-12 text-gray-500">
                                        <span className="material-symbols-outlined text-4xl mb-2">person_search</span>
                                        <p>Nenhum usuário encontrado.</p>
                                        <p className="text-xs mt-1">Certifique-se de que há usuários cadastrados no sistema.</p>
                                    </div>
                                ) : (
                                    usersList.map((profile) => (
                                        <div
                                            key={profile.id}
                                            onClick={() => {
                                                setSelectedTeacher(profile);
                                                setTeacherFormData({
                                                    full_name: profile.full_name || '',
                                                    date_of_birth: profile.date_of_birth || '',
                                                    phone: profile.phone || '',
                                                    avatar_url: profile.avatar_url || ''
                                                });
                                            }}
                                            className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${selectedTeacher?.id === profile.id
                                                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                                                : 'border-gray-200 hover:border-primary/50 hover:bg-gray-50'
                                                }`}
                                        >
                                            <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0 flex items-center justify-center overflow-hidden">
                                                {profile.avatar_url ? (
                                                    <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="material-symbols-outlined text-gray-400">person</span>
                                                )}
                                            </div>
                                            <div className="flex-1 overflow-hidden">
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-bold text-gray-800 truncate">{profile.full_name || 'Sem nome'}</h4>
                                                    {profile.role === 'TEACHER' && (
                                                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full flex-shrink-0">Professor</span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-500 truncate">{profile.email || 'Sem e-mail'}</p>
                                            </div>
                                            {selectedTeacher?.id === profile.id && (
                                                <span className="material-symbols-outlined text-primary ml-auto flex-shrink-0">check_circle</span>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </section>

                        {selectedTeacher && (
                            <>
                                <hr className="border-gray-100" />

                                {/* Teacher Info Form */}
                                <form onSubmit={handleTeacherSubmit}>
                                    <h3 className="text-lg font-bold text-gray-800 mb-4">Informações do Professor</h3>
                                    <p className="text-sm text-gray-500 mb-6">Complemente os dados para finalizar o cadastro do professor.</p>

                                    {/* Teacher Photo Upload */}
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200">
                                            {teacherFormData.avatar_url ? (
                                                <img src={teacherFormData.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
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
                                                    onChange={handleTeacherImageUpload}
                                                    disabled={uploading}
                                                />
                                            </label>
                                            <p className="text-xs text-gray-500 mt-1">JPG, PNG ou GIF. Máx 2MB.</p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-6">
                                        <label className="flex flex-col gap-1.5">
                                            <span className="text-sm font-bold text-gray-600">Nome Completo</span>
                                            <input
                                                type="text"
                                                value={teacherFormData.full_name}
                                                onChange={(e) => setTeacherFormData({ ...teacherFormData, full_name: e.target.value })}
                                                className="form-input rounded-lg border-gray-200 focus:border-primary focus:ring-primary h-12 bg-gray-50/50"
                                            />
                                        </label>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <label className="flex flex-col gap-1.5">
                                                <span className="text-sm font-bold text-gray-600">Data de Nascimento</span>
                                                <input
                                                    type="date"
                                                    value={teacherFormData.date_of_birth}
                                                    onChange={(e) => setTeacherFormData({ ...teacherFormData, date_of_birth: e.target.value })}
                                                    className="form-input rounded-lg border-gray-200 focus:border-primary focus:ring-primary h-12 bg-gray-50/50"
                                                />
                                            </label>
                                            <label className="flex flex-col gap-1.5">
                                                <span className="text-sm font-bold text-gray-600">Telefone para Contato</span>
                                                <input
                                                    type="tel"
                                                    value={teacherFormData.phone}
                                                    onChange={(e) => setTeacherFormData({ ...teacherFormData, phone: e.target.value })}
                                                    className="form-input rounded-lg border-gray-200 focus:border-primary focus:ring-primary h-12 bg-gray-50/50"
                                                    placeholder="(00) 00000-0000"
                                                />
                                            </label>
                                        </div>

                                        <div className="flex justify-end mt-4">
                                            <button
                                                type="submit"
                                                disabled={loading}
                                                className="bg-[#1e293b] text-white px-8 py-3 rounded-lg font-bold hover:bg-[#0f172a] transition-colors disabled:opacity-50"
                                            >
                                                {loading ? 'Salvando...' : 'Salvar Professor'}
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            </>
                        )}
                    </div>
                )}

                {activeTab === 'classes' && (
                    <form onSubmit={handleClassSubmit} className="flex flex-col gap-8">
                        <section>
                            <h3 className="text-lg font-bold text-gray-800 mb-4">Dados da Turma</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <label className="flex flex-col gap-1.5">
                                    <span className="text-sm font-bold text-gray-600">Nome da Turma</span>
                                    <input
                                        type="text"
                                        value={classFormData.name}
                                        onChange={(e) => setClassFormData({ ...classFormData, name: e.target.value })}
                                        className="form-input rounded-lg border-gray-200 focus:border-primary focus:ring-primary h-12 bg-gray-50/50"
                                        placeholder="Ex: Skate Iniciante A"
                                        required
                                    />
                                </label>
                                <label className="flex flex-col gap-1.5">
                                    <span className="text-sm font-bold text-gray-600">Nível</span>
                                    <select
                                        value={classFormData.level}
                                        onChange={(e) => setClassFormData({ ...classFormData, level: e.target.value })}
                                        className="form-select rounded-lg border-gray-200 focus:border-primary focus:ring-primary h-12 bg-gray-50/50"
                                    >
                                        <option value="Iniciante">Iniciante</option>
                                        <option value="Intermediário">Intermediário</option>
                                        <option value="Avançado">Avançado</option>
                                    </select>
                                </label>
                                <label className="flex flex-col gap-1.5">
                                    <span className="text-sm font-bold text-gray-600">Professor</span>
                                    <select
                                        value={classFormData.teacher_id}
                                        onChange={(e) => setClassFormData({ ...classFormData, teacher_id: e.target.value })}
                                        className="form-select rounded-lg border-gray-200 focus:border-primary focus:ring-primary h-12 bg-gray-50/50"
                                        required
                                    >
                                        <option value="">Selecione um professor</option>
                                        {teachersList.map(teacher => (
                                            <option key={teacher.id} value={teacher.id}>
                                                {teacher.full_name}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                                <label className="flex flex-col gap-1.5">
                                    <span className="text-sm font-bold text-gray-600">Capacidade Máxima</span>
                                    <input
                                        type="number"
                                        value={classFormData.capacity}
                                        onChange={(e) => setClassFormData({ ...classFormData, capacity: e.target.value })}
                                        className="form-input rounded-lg border-gray-200 focus:border-primary focus:ring-primary h-12 bg-gray-50/50"
                                        placeholder="Ex: 10"
                                        required
                                    />
                                </label>
                            </div>
                        </section>

                        <hr className="border-gray-100" />

                        <section>
                            <h3 className="text-lg font-bold text-gray-800 mb-4">Horário e Local</h3>
                            <div className="flex flex-col gap-6">
                                <div className="flex flex-col gap-2">
                                    <span className="text-sm font-bold text-gray-600">Dias da Semana</span>
                                    <div className="flex flex-wrap gap-3">
                                        {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'].map((day) => (
                                            <button
                                                key={day}
                                                type="button"
                                                onClick={() => toggleDay(day)}
                                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${classFormData.days.includes(day)
                                                    ? 'bg-primary text-white'
                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                    }`}
                                            >
                                                {day}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <label className="flex flex-col gap-1.5">
                                        <span className="text-sm font-bold text-gray-600">Horário</span>
                                        <input
                                            type="time"
                                            value={classFormData.time}
                                            onChange={(e) => setClassFormData({ ...classFormData, time: e.target.value })}
                                            className="form-input rounded-lg border-gray-200 focus:border-primary focus:ring-primary h-12 bg-gray-50/50"
                                            required
                                        />
                                    </label>
                                    <label className="flex flex-col gap-1.5">
                                        <span className="text-sm font-bold text-gray-600">Local</span>
                                        <input
                                            type="text"
                                            value={classFormData.location}
                                            onChange={(e) => setClassFormData({ ...classFormData, location: e.target.value })}
                                            className="form-input rounded-lg border-gray-200 focus:border-primary focus:ring-primary h-12 bg-gray-50/50"
                                            placeholder="Ex: Pista Principal"
                                            required
                                        />
                                    </label>
                                </div>
                            </div>
                        </section>

                        <div className="flex justify-end mt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-[#1e293b] text-white px-8 py-3 rounded-lg font-bold hover:bg-[#0f172a] transition-colors disabled:opacity-50"
                            >
                                {loading ? 'Cadastrando...' : 'Cadastrar Turma'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};