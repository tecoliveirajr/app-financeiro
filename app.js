
// Espera a página HTML inteira ser carregada antes de executar qualquer código.
// Isso é uma boa prática para evitar erros.
document.addEventListener('DOMContentLoaded', () => {

    // =================================================================================
    // BANCO DE DADOS INICIAL - Onde definimos todas as missões possíveis.
    // =================================================================================
    let TAREFAS_PREDEFINIDAS = [
        // Categoria: Educação
        { id: 1, nome: 'Completar todas as lições de casa', categoria: 'Educação', pontos: 5 },
        { id: 2, nome: 'Ler um capítulo de livro', categoria: 'Educação', pontos: 7 },
        { id: 3, nome: 'Estudar para uma prova (1h)', categoria: 'Educação', pontos: 10 },
        // Categoria: Casa
        { id: 10, nome: 'Lavar a louça do jantar', categoria: 'Casa', pontos: 8 },
        { id: 11, nome: 'Ajudar a guardar as compras', categoria: 'Casa', pontos: 7 },
        { id: 12, nome: 'Arrumar o próprio quarto', categoria: 'Casa', pontos: 5 },
        // Categoria: Comportamental
        { id: 20, nome: 'Cumprir os horários combinados', categoria: 'Comportamental', pontos: 5 },
        { id: 21, nome: 'Ser elogiado na escola por comportamento', categoria: 'Comportamental', pontos: 25 },
        // Obrigações (com penalidade)
        { id: 100, nome: 'NÃO arrumou o quarto quando pedido', categoria: 'Penalidade', pontos: -5 },
        { id: 101, nome: 'NÃO cumpriu o tempo de tela', categoria: 'Penalidade', pontos: -10 },
    ];
    const tarefasSalvas = JSON.parse(localStorage.getItem('tarefasDoApp'));
if (tarefasSalvas) {
    TAREFAS_PREDEFINIDAS = tarefasSalvas;
}

    // Definição da Meta Principal
    const META_PRINCIPAL = {
        nome: 'Comprar Jogo Novo',
        valor: 300 // Valor em pontos
    };

    // =================================================================================
    // CARREGANDO E SALVANDO DADOS - A memória do nosso app.
    // =================================================================================
    // Tenta carregar os lançamentos salvos no navegador. Se não houver nada, começa com uma lista vazia.
    let lancamentos = JSON.parse(localStorage.getItem('lancamentosDoApp')) || [];

    // Função para salvar a lista de lançamentos atual no navegador.
    function salvarDados() {
        localStorage.setItem('lancamentosDoApp', JSON.stringify(lancamentos));
        localStorage.setItem('tarefasDoApp', JSON.stringify(TAREFAS_PREDEFINIDAS));
    }

    // =================================================================================
    // LÓGICA DE ATUALIZAÇÃO DA TELA (RENDERIZAÇÃO)
    // =================================================================================
    // Pega os elementos do HTML que vamos manipular, para não ter que procurá-los toda hora.
    const saldoTotalEl = document.getElementById('saldo-total');
    const metaNomeEl = document.getElementById('meta-atual-nome');
    const metaProgressEl = document.getElementById('meta-progress');
    const listaLancamentosEl = document.getElementById('lista-lancamentos');
    const graficoCanvas = document.getElementById('grafico-categorias').getContext('2d');
    let meuGrafico; // Variável para guardar nosso gráfico e poder atualizá-lo

    // A função mais importante: Pega os dados atuais e atualiza TODA a tela.
    function renderizarTudo() {
        // 1. Calcula o saldo total somando os pontos de todos os lançamentos.
        const saldoAtual = lancamentos.reduce((total, lanc) => total + lanc.pontos, 0);
        
        // 2. Atualiza os textos no cabeçalho.
        saldoTotalEl.textContent = `R$ ${saldoAtual.toFixed(2)}`; // toFixed(2) garante duas casas decimais.
        metaNomeEl.textContent = META_PRINCIPAL.nome;

        // 3. Atualiza a barra de progresso da meta.
        const progressoPercentual = Math.min((saldoAtual / META_PRINCIPAL.valor) * 100, 100);
        metaProgressEl.style.width = `${progressoPercentual}%`;

        // 4. Limpa a lista de missões antigas e cria a nova.
        listaLancamentosEl.innerHTML = '';
        // Pega apenas os 10 últimos lançamentos para não sobrecarregar a tela.
        const lancamentosRecentes = lancamentos.slice(0, 10); 
        if (lancamentosRecentes.length === 0) {
            listaLancamentosEl.innerHTML = '<p style="text-align:center;">Nenhuma missão registrada ainda. Cumpra uma!</p>';
        } else {
            lancamentosRecentes.forEach(lanc => {
                const item = document.createElement('div');
                item.className = 'lancamento-item';
                // Adiciona a classe 'negativo' se os pontos forem menores que 0.
                if (lanc.pontos < 0) {
                    item.classList.add('negativo');
                }
                item.innerHTML = `
                    <div>
                        <strong>${lanc.nome}</strong>
                        <small style="display:block; color:#888;">${new Date(lanc.data).toLocaleDateString('pt-BR')}</small>
                    </div>
                    <span>${lanc.pontos > 0 ? '+' : ''}${lanc.pontos} pts</span>
                `;
                listaLancamentosEl.appendChild(item);
            });
        }

        // 5. Atualiza o gráfico de pizza.
        renderizarGrafico();

        // 6. Salva os dados no navegador para não perder nada.
        salvarDados();
    }

    // Função específica para criar ou atualizar o gráfico.
    function renderizarGrafico() {
        // Agrupa os pontos por categoria.
        const dadosGrafico = TAREFAS_PREDEFINIDAS.reduce((acc, tarefa) => {
            if (tarefa.pontos > 0) { // Considera apenas pontos positivos para o gráfico
                acc[tarefa.categoria] = 0;
            }
            return acc;
        }, {});

        lancamentos.forEach(lanc => {
            if (lanc.pontos > 0 && dadosGrafico.hasOwnProperty(lanc.categoria)) {
                dadosGrafico[lanc.categoria] += lanc.pontos;
            }
        });

        // Se o gráfico já existe, destrói o antigo antes de criar um novo.
        if (meuGrafico) {
            meuGrafico.destroy();
        }

        // Cria um novo gráfico usando a biblioteca Chart.js.
        meuGrafico = new Chart(graficoCanvas, {
            type: 'doughnut', // Tipo de gráfico: rosca
            data: {
                labels: Object.keys(dadosGrafico), // Nomes das categorias
                datasets: [{
                    label: 'Pontos por Categoria',
                    data: Object.values(dadosGrafico), // Valores de cada categoria
                    backgroundColor: ['#4a90e2', '#50e3c2', '#f5a623', '#e74c3c'],
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                }
            }
        });
    }

    // =================================================================================
    // INTERATIVIDADE - Onde fazemos os botões funcionarem.
    // =================================================================================
    // Pega os elementos de navegação e pop-up.
    const navBotoes = document.querySelectorAll('.nav-button');
    const telas = document.querySelectorAll('.tela');
    const modal = document.getElementById('modal-adicionar');
    const btnAdicionarFlutuante = document.getElementById('btn-adicionar-flutuante');
    const btnCancelarModal = document.getElementById('btn-cancelar');
    const formTarefa = document.getElementById('form-tarefa');
    const selectTarefaEl = document.getElementById('select-tarefa');

    // Lógica para a navegação inferior.
    navBotoes.forEach(button => {
        button.addEventListener('click', () => {
            // Remove a classe 'ativa' de todos os botões e telas.
            navBotoes.forEach(btn => btn.classList.remove('ativo'));
            telas.forEach(tela => tela.classList.remove('ativa'));

            // Adiciona a classe 'ativa' apenas no botão e tela clicados.
            button.classList.add('ativo');
            const idTela = button.dataset.tela; // Pega o nome da tela do atributo 'data-tela'
            document.getElementById(`tela-${idTela}`).classList.add('ativa');
        });
    });

    // Lógica para abrir e fechar o pop-up (modal).
    btnAdicionarFlutuante.addEventListener('click', () => modal.classList.add('visivel'));
    btnCancelarModal.addEventListener('click', () => modal.classList.remove('visivel'));
    // Fecha o modal se clicar fora da caixa de conteúdo.
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('visivel');
        }
    });

    // Lógica para quando o formulário de nova missão é enviado.
    formTarefa.addEventListener('submit', (e) => {
        e.preventDefault(); // Impede o recarregamento da página.

        const tarefaId = parseInt(selectTarefaEl.value);
        const tarefaSelecionada = TAREFAS_PREDEFINIDAS.find(t => t.id === tarefaId);
        const observacao = document.getElementById('obs-tarefa').value;

        // Cria um novo objeto de lançamento.
        const novoLancamento = {
            ...tarefaSelecionada, // Copia todas as propriedades da tarefa selecionada
            data: new Date().toISOString(), // Adiciona a data e hora atual
            obs: observacao
        };

        // Adiciona o novo lançamento no início da lista.
        lancamentos.unshift(novoLancamento);

        // Fecha o modal, reseta o formulário e atualiza a tela.
        modal.classList.remove('visivel');
        formTarefa.reset();
        renderizarTudo();
    });

    // =================================================================================
    // INICIALIZAÇÃO - O que acontece assim que o app abre.
    // =================================================================================
    // Preenche a lista de seleção de tarefas no pop-up.
    TAREFAS_PREDEFINIDAS.forEach(tarefa => {
        const option = document.createElement('option');
        option.value = tarefa.id;
        option.textContent = `${tarefa.nome} (${tarefa.pontos} pts)`;
        selectTarefaEl.appendChild(option);
    });

    // Chama a função principal pela primeira vez para mostrar tudo na tela.
    renderizarTudo();
    // =================================================================================
// LÓGICA DO MODO ADMINISTRADOR
// =================================================================================
const ADMIN_PASSWORD = "1234"; // Defina sua senha secreta aqui!

// Pega todos os novos elementos do HTML.
const adminTrigger = document.getElementById('admin-trigger');
const modalAdminLogin = document.getElementById('modal-admin-login');
const formAdminLogin = document.getElementById('form-admin-login');
const adminPasswordInput = document.getElementById('admin-password');
const adminLoginError = document.getElementById('admin-login-error');
const painelAdmin = document.getElementById('painel-admin');
const btnFecharAdmin = document.getElementById('btn-fechar-admin');
const formAjustePontos = document.getElementById('form-ajuste-pontos');
const listaTarefasAdminEl = document.getElementById('lista-tarefas-admin');
const btnAbrirModalNovaTarefa = document.getElementById('btn-abrir-modal-nova-tarefa');
const modalTarefaEditor = document.getElementById('modal-tarefa-editor');
const formTarefaEditor = document.getElementById('form-tarefa-editor');
const btnCancelarEditor = document.getElementById('btn-cancelar-editor');

// Abre o modal de login do admin.
adminTrigger.addEventListener('click', () => {
    modalAdminLogin.classList.add('visivel');
    adminPasswordInput.focus();
});

// Processa o login do admin.
formAdminLogin.addEventListener('submit', (e) => {
    e.preventDefault();
    if (adminPasswordInput.value === ADMIN_PASSWORD) {
        modalAdminLogin.classList.remove('visivel');
        formAdminLogin.reset();
        adminLoginError.textContent = '';
        abrirPainelAdmin();
    } else {
        adminLoginError.textContent = 'Senha incorreta!';
    }
});

// Abre o painel principal do admin e renderiza as tarefas.
function abrirPainelAdmin() {
    renderizarTarefasAdmin();
    painelAdmin.classList.add('visivel');
}

// Fecha o painel do admin.
btnFecharAdmin.addEventListener('click', () => {
    painelAdmin.classList.remove('visivel');
});

// Processa o formulário de ajuste manual de pontos.
formAjustePontos.addEventListener('submit', (e) => {
    e.preventDefault();
    const pontos = parseInt(document.getElementById('ajuste-pontos-valor').value);
    const motivo = document.getElementById('ajuste-pontos-motivo').value;

    if (!pontos || !motivo) return;

    const novoLancamento = {
        id: Date.now(), // ID único baseado no tempo
        nome: motivo,
        categoria: pontos > 0 ? 'Ajuste Positivo' : 'Ajuste Negativo',
        pontos: pontos,
        data: new Date().toISOString()
    };

    lancamentos.unshift(novoLancamento);
    formAjustePontos.reset();
    renderizarTudo(); // Atualiza a tela principal
    alert('Ajuste de pontos realizado com sucesso!');
});

// Renderiza a lista de tarefas editáveis no painel do admin.
function renderizarTarefasAdmin() {
    listaTarefasAdminEl.innerHTML = '';
    TAREFAS_PREDEFINIDAS.forEach(tarefa => {
        const item = document.createElement('div');
        item.className = 'tarefa-item-admin';
        item.innerHTML = `
            <div class="tarefa-info">
                <strong>${tarefa.nome}</strong>
                <small style="display:block;">${tarefa.categoria} | ${tarefa.pontos} pts</small>
            </div>
            <div class="tarefa-botoes">
                <button class="btn-editar-tarefa" data-id="${tarefa.id}" title="Editar"><i class="fas fa-pencil-alt"></i></button>
                <button class="btn-excluir-tarefa" data-id="${tarefa.id}" title="Excluir"><i class="fas fa-trash-alt"></i></button>
            </div>
        `;
        listaTarefasAdminEl.appendChild(item);
    });
}

// Lógica para os botões de editar e excluir na lista de tarefas.
listaTarefasAdminEl.addEventListener('click', (e) => {
    const target = e.target.closest('button');
    if (!target) return;

    const id = parseInt(target.dataset.id);

    if (target.classList.contains('btn-editar-tarefa')) {
        abrirEditorDeTarefa(id);
    }

    if (target.classList.contains('btn-excluir-tarefa')) {
        if (confirm('Tem certeza que deseja excluir esta missão?')) {
            TAREFAS_PREDEFINIDAS = TAREFAS_PREDEFINIDAS.filter(t => t.id !== id);
            renderizarTarefasAdmin();
            salvarDados(); // Salva a lista atualizada
        }
    }
});

// Abre o modal para adicionar uma NOVA tarefa.
btnAbrirModalNovaTarefa.addEventListener('click', () => {
    abrirEditorDeTarefa(); // Chama a função sem ID
});

// Abre o pop-up para editar ou adicionar uma tarefa.
function abrirEditorDeTarefa(id = null) {
    formTarefaEditor.reset();
    const tituloEl = document.getElementById('editor-tarefa-titulo');
    const idInput = document.getElementById('editor-tarefa-id');

    if (id) { // Se tem ID, estamos editando.
        const tarefa = TAREFAS_PREDEFINIDAS.find(t => t.id === id);
        tituloEl.textContent = 'Editar Missão';
        idInput.value = tarefa.id;
        document.getElementById('editor-tarefa-nome').value = tarefa.nome;
        document.getElementById('editor-tarefa-categoria').value = tarefa.categoria;
        document.getElementById('editor-tarefa-pontos').value = tarefa.pontos;
    } else { // Se não tem ID, estamos criando.
        tituloEl.textContent = 'Adicionar Nova Missão';
        idInput.value = ''; // Limpa o campo do ID
    }
    modalTarefaEditor.classList.add('visivel');
}

// Fecha o editor de tarefa.
btnCancelarEditor.addEventListener('click', () => {
    modalTarefaEditor.classList.remove('visivel');
});

// Processa o salvamento da tarefa (nova ou editada).
formTarefaEditor.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('editor-tarefa-id').value;
    const novaTarefa = {
        id: id ? parseInt(id) : Date.now(), // Usa o ID existente ou cria um novo
        nome: document.getElementById('editor-tarefa-nome').value,
        categoria: document.getElementById('editor-tarefa-categoria').value,
        pontos: parseInt(document.getElementById('editor-tarefa-pontos').value)
    };

    if (id) { // Editando
        const index = TAREFAS_PREDEFINIDAS.findIndex(t => t.id === parseInt(id));
        TAREFAS_PREDEFINIDAS[index] = novaTarefa;
    } else { // Criando
        TAREFAS_PREDEFINIDAS.push(novaTarefa);
    }

    modalTarefaEditor.classList.remove('visivel');
    renderizarTarefasAdmin(); // Atualiza a lista no painel admin
    salvarDados(); // Salva as mudanças
    // Recarrega a lista de seleção no modal principal para refletir as mudanças
    recarregarSelectDeTarefas();
});

// Função para recarregar as opções no formulário principal.
function recarregarSelectDeTarefas() {
    selectTarefaEl.innerHTML = ''; // Limpa as opções antigas
    TAREFAS_PREDEFINIDAS.forEach(tarefa => {
        const option = document.createElement('option');
        option.value = tarefa.id;
        option.textContent = `${tarefa.nome} (${tarefa.pontos} pts)`;
        selectTarefaEl.appendChild(option);
    });
}
// app.js

// =================================================================================
// LÓGICA DO GERADOR DE RELATÓRIO PDF
// =================================================================================

// Pega o formulário do relatório PDF.
const formRelatorioPdf = document.getElementById('form-relatorio-pdf');

// Adiciona o "ouvinte" para o envio do formulário.
formRelatorioPdf.addEventListener('submit', (e) => {
    e.preventDefault(); // Impede o recarregamento da página.

    // Pega as datas dos inputs e as formata corretamente para comparação.
    const dataInicio = new Date(document.getElementById('pdf-data-inicio').value + 'T00:00:00');
    const dataFim = new Date(document.getElementById('pdf-data-fim').value + 'T23:59:59');

    // Filtra os lançamentos para pegar apenas os que estão dentro do período selecionado.
    const lancamentosFiltrados = lancamentos.filter(lanc => {
        const dataLancamento = new Date(lanc.data);
        return dataLancamento >= dataInicio && dataLancamento <= dataFim;
    });

    if (lancamentosFiltrados.length === 0) {
        alert('Nenhuma tarefa encontrada no período selecionado.');
        return;
    }

    // Se encontrou tarefas, chama a função para gerar o PDF.
    gerarPDF(lancamentosFiltrados, dataInicio, dataFim);
});

// A função principal que usa a biblioteca jsPDF.
function gerarPDF(dados, dataInicio, dataFim) {
    // Pega a classe jsPDF que foi carregada da biblioteca.
    const { jsPDF } = window.jspdf;
    
    // Cria um novo documento PDF. 'p' = retrato (portrait), 'mm' = milímetros, 'a4' = tamanho da página.
    const doc = new jsPDF('p', 'mm', 'a4');

    // Define o título do documento.
    doc.setFontSize(18);
    doc.text('Relatório de Desempenho', 105, 20, { align: 'center' });

    // Adiciona o período do relatório.
    doc.setFontSize(12);
    const periodoTexto = `Período: ${dataInicio.toLocaleDateString('pt-BR')} a ${dataFim.toLocaleDateString('pt-BR')}`;
    doc.text(periodoTexto, 105, 30, { align: 'center' });

    // Adiciona um cabeçalho para a tabela de tarefas.
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold'); // Deixa o texto em negrito.
    doc.text('Data', 15, 50);
    doc.text('Missão Realizada', 50, 50);
    doc.text('Pontos', 180, 50);
    doc.setFont('helvetica', 'normal'); // Volta ao normal.

    // Desenha uma linha abaixo do cabeçalho.
    doc.line(15, 52, 195, 52);

    // Loop para adicionar cada tarefa ao PDF.
    let y = 60; // Posição vertical inicial para a primeira tarefa.
    dados.forEach(lanc => {
        // Se a posição 'y' passar do limite da página, adiciona uma nova página.
        if (y > 280) {
            doc.addPage();
            y = 20; // Reseta a posição para o topo da nova página.
        }
        
        const dataFormatada = new Date(lanc.data).toLocaleDateString('pt-BR');
        const nomeTarefa = lanc.nome;
        const pontos = `${lanc.pontos > 0 ? '+' : ''}${lanc.pontos}`;

        doc.setFontSize(10);
        doc.text(dataFormatada, 15, y);
        doc.text(nomeTarefa, 50, y);
        doc.text(pontos, 180, y);
        
        y += 7; // Aumenta a posição vertical para a próxima linha.
    });

    // Adiciona um rodapé com a data de geração.
    doc.setFontSize(8);
    doc.text(`Relatório gerado em: ${new Date().toLocaleString('pt-BR')}`, 15, 290);

    // Salva o arquivo, iniciando o download no navegador.
    doc.save(`relatorio-desempenho-${Date.now()}.pdf`);
}

});
