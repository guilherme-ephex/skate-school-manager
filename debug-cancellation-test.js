// Cole este código no Console do navegador (F12) quando estiver na página de Attendance
// Ele vai testar se consegue salvar o campo is_cancelled

async function testCancellationSave() {
    console.log('🧪 Testando salvamento de cancelamento...');
    
    // Pegar supabase do window (disponível na aplicação)
    const supabase = window.supabase || (await import('../lib/supabase')).supabase;
    
    // Dados de teste
    const testRecord = {
        class_id: 'COLE_UM_CLASS_ID_VALIDO_AQUI', // Substitua por um ID real
        student_id: 'COLE_UM_STUDENT_ID_VALIDO_AQUI', // Substitua por um ID real
        date: '2024-11-22',
        status: 'absent',
        is_cancelled: true,
        cancelled_reason: 'Teste de cancelamento',
        created_by: 'SEU_USER_ID_AQUI' // Substitua pelo seu user ID
    };
    
    console.log('📤 Tentando inserir:', testRecord);
    
    const { data, error } = await supabase
        .from('attendance')
        .upsert([testRecord], {
            onConflict: 'student_id,class_id,date',
            ignoreDuplicates: false
        })
        .select();
    
    if (error) {
        console.error('❌ ERRO ao salvar:', error);
        return;
    }
    
    console.log('✅ Salvo com sucesso!', data);
    
    // Verificar se foi salvo corretamente
    console.log('🔍 Verificando se foi salvo...');
    const { data: checkData, error: checkError } = await supabase
        .from('attendance')
        .select('*')
        .eq('class_id', testRecord.class_id)
        .eq('student_id', testRecord.student_id)
        .eq('date', testRecord.date)
        .single();
    
    if (checkError) {
        console.error('❌ ERRO ao verificar:', checkError);
        return;
    }
    
    console.log('📥 Registro salvo:', checkData);
    console.log('✅ is_cancelled salvo?', checkData.is_cancelled === true ? 'SIM ✓' : 'NÃO ✗');
    console.log('✅ cancelled_reason salvo?', checkData.cancelled_reason ? 'SIM ✓' : 'NÃO ✗');
}

// Execute a função
testCancellationSave();


