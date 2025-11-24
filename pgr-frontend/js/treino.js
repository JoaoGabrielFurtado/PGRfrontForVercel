//const apiUrl = 'https://localhost:7290'; // Ajuste a porta se necessário

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('jwtToken');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    const params = new URLSearchParams(window.location.search);
    const treinoId = params.get('id');

    if (!treinoId) {
        alert('ID do treino não fornecido!');
        window.location.href = 'index.html';
        return;
    }

    InicializarTreinoHtml(token, treinoId);
});


function InicializarTreinoHtml(token, treinoId) {
    const userGreetingSpan = document.getElementById('user-greeting');
    const logoutButton = document.getElementById('logout-button');
    const showAddExercicioModalButton = document.getElementById('show-add-exercicio-modal');
    const addExercicioModal = document.getElementById('add-exercicio-modal');
    const closeAddExercicioModalButton = document.getElementById('close-add-exercicio-modal');
    const addExercicioForm = document.getElementById('add-exercicio-form');
    const historicoModal = document.getElementById('historico-modal');
    const closeHistoricoModalButton = document.getElementById('close-historico-modal');
    const infoBtn = document.getElementById('info-btn');
    const aboutModal = document.getElementById('about-modal');
    const closeAboutModalBtn = document.getElementById('close-about-modal');

    if (infoBtn) {
    infoBtn.addEventListener('click', () => aboutModal.classList.add('active'));
    }
    if (closeAboutModalBtn) {
        closeAboutModalBtn.addEventListener('click', () => aboutModal.classList.remove('active'));
    }

    if (userGreetingSpan) {
        const decodedToken = parseJwt(token);
        if (decodedToken && decodedToken['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname']) {
            const primeiroNome = decodedToken['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname'].split(' ')[0];
            userGreetingSpan.textContent = `Olá, ${primeiroNome}!`;
        }
    }

    if (logoutButton) logoutButton.addEventListener('click', handleLogout);
    
    showAddExercicioModalButton.addEventListener('click', () => {
        addExercicioModal.classList.add('active');
        fetchAvailableExercises(token);
    });
    
    closeAddExercicioModalButton.addEventListener('click', () => addExercicioModal.classList.remove('active'));
    addExercicioForm.addEventListener('submit', (event) => handleAddExercicioSubmit(event, token, treinoId));

    if(closeHistoricoModalButton) {
        closeHistoricoModalButton.addEventListener('click', () => historicoModal.classList.remove('active'));
    }

    fetchTreinoDetails(token, treinoId);
}

async function fetchTreinoDetails(token, treinoId) {
    const treinoNomeEl = document.getElementById('treino-nome');
    const treinoDescEl = document.getElementById('treino-descricao');
    const exerciciosListEl = document.getElementById('exercicios-list');

    try {
        const response = await fetch(`${apiUrl}/api/treinos/${treinoId}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const treino = await response.json();
            treinoNomeEl.textContent = treino.nomeDoTreino;
            treinoDescEl.textContent = treino.descricao || 'Sem descrição.';
            displayExercicios(treino.id, treino.treinoExercicios || [], exerciciosListEl, token);
        } else if (response.status === 403 || response.status === 404) {
            alert('Você não tem permissão para ver este treino ou ele não existe.');
            window.location.href = 'index.html';
        } else { throw new Error('Falha ao buscar detalhes do treino.'); }
    } catch (error) {
        console.error('Erro:', error);
        treinoNomeEl.textContent = 'Erro ao carregar treino';
        exerciciosListEl.innerHTML = '<p>Não foi possível carregar os exercícios.</p>';
    }
}

async function fetchAvailableExercises(token) {
    const selectElement = document.getElementById('exercicio-select');
    try {
        const response = await fetch(`${apiUrl}/api/exercicios`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            const exercicios = await response.json();
            selectElement.innerHTML = '<option value="">-- Selecione um exercício --</option>';
            exercicios.forEach(ex => {
                const option = document.createElement('option');
                option.value = ex.id;
                option.textContent = ex.nome;
                selectElement.appendChild(option);
            });
        }
    } catch (error) { console.error('Erro ao buscar catálogo de exercícios:', error); }
}

async function handleAddExercicioSubmit(event, token, treinoId) {
    event.preventDefault();
    const exercicioId = document.getElementById('exercicio-select').value;
    const series = document.getElementById('series').value;
    const repeticoes = document.getElementById('repeticoes').value;

    const dto = {
        exercicioId: parseInt(exercicioId),
        series: parseInt(series),
        repeticoes: parseInt(repeticoes)
    };

    try {
        const response = await fetch(`${apiUrl}/api/treinos/${treinoId}/exercicios`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(dto)
        });
        if (response.ok) {
            document.getElementById('add-exercicio-modal').classList.remove('active');
            document.getElementById('add-exercicio-form').reset();
            fetchTreinoDetails(token, treinoId);
        } else { alert('Falha ao adicionar exercício.'); }
    } catch (error) { console.error('Erro ao adicionar exercício:', error); }
}

async function handleRemoveExercicio(token, treinoId, exercicioId) {
    if (!confirm('Tem a certeza de que quer remover este exercício do plano?')) return;
    try {
        const response = await fetch(`${apiUrl}/api/treinos/${treinoId}/exercicios/${exercicioId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            fetchTreinoDetails(token, treinoId);
        } else { alert('Falha ao remover exercício.'); }
    } catch (error) { console.error('Erro ao remover exercício:', error); }
}

async function handleRegistroSubmit(event, token) {
    event.preventDefault();
    const form = event.target;
    const treinoExercicioId = form.dataset.treinoExercicioId;
    
    const cargaInputs = form.querySelectorAll('.carga-serie-input');
    const observacoes = form.querySelector('.obs-input').value;

    const cargasArray = [];
    let dadosValidos = true;

    cargaInputs.forEach(input => {
        const valor = parseInt(input.value, 10);
        if (isNaN(valor)) {
            dadosValidos = false;
        } else {
            cargasArray.push(valor);
        }
    });

    if (!dadosValidos) {
        alert('Por favor, preencha todos os campos de carga com números válidos.');
        return;
    }

    const dto = {
        treinoExercicioId: parseInt(treinoExercicioId),
        carga: cargasArray,
        observacoes: observacoes
    };

    try {
        const response = await fetch(`${apiUrl}/api/registrosdetreino`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(dto)
        });

        if (response.ok) {
            alert('Performance registada com sucesso!');
            form.reset();
        } else {
            const errorData = await response.json();
            console.error('Erro da API:', errorData);
            alert('Falha ao registar performance. Verifique se todos os campos de carga estão preenchidos.');
        }
    } catch (error) {
        console.error('Erro ao registar performance:', error);
        alert('Ocorreu um erro de conexão.');
    }
}

async function handleShowHistorico(token, treinoExercicioId, exercicioNome) {
    const historicoModal = document.getElementById('historico-modal');
    const historicoTitulo = document.getElementById('historico-titulo');
    const historicoList = document.getElementById('historico-list');
    const chartCanvas = document.getElementById('historico-chart');

    historicoTitulo.textContent = `Histórico de ${exercicioNome}`;
    historicoList.innerHTML = '<p>A carregar histórico...</p>';
    historicoModal.classList.add('active');

    try {
        const response = await fetch(`${apiUrl}/api/registrosdetreino?treinoExercicioId=${treinoExercicioId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if(response.ok) {
            const registros = await response.json();
            displayHistorico(registros, historicoList, token, treinoExercicioId, exercicioNome);
            renderHistoricoChart(registros, chartCanvas);
        } else {
            historicoList.innerHTML = '<p>Não foi possível carregar o histórico.</p>';
        }
    } catch (error) {
        console.error('Erro ao buscar histórico:', error);
        historicoList.innerHTML = '<p>Erro de conexão.</p>';
    }
}

async function handleDeleteRegistro(token, registroId, treinoExercicioId, exercicioNome) {
    if (!confirm('Tem a certeza de que quer apagar este registo do seu histórico?')) {
        return;
    }

    try {
        const response = await fetch(`${apiUrl}/api/registrosdetreino/${registroId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            alert('Registo apagado com sucesso!');
            handleShowHistorico(token, treinoExercicioId, exercicioNome);
        } else {
            alert('Falha ao apagar o registo.');
        }
    } catch (error) {
        console.error('Erro ao apagar registo:', error);
        alert('Erro de conexão ao tentar apagar o registo.');
    }
}


function displayExercicios(treinoId, treinoExercicios, element, token) {
    element.innerHTML = '';
    if (treinoExercicios.length === 0) {
        element.innerHTML = '<p>Ainda não há exercícios neste plano. Adicione o primeiro!</p>';
        return;
    }

    treinoExercicios.forEach(item => {
        const exercicioItem = document.createElement('div');
        exercicioItem.className = 'exercicio-item';
        
        let cargasHtml = '';
        for (let i = 1; i <= item.series; i++) {
            cargasHtml += `
                <div class="form-group">
                    <label for="carga-${item.id}-serie-${i}">Série ${i} (kg)</label>
                    <input type="number" id="carga-${item.id}-serie-${i}" class="carga-serie-input" min="0" required>
                </div>
            `;
        }
        
        exercicioItem.innerHTML = `
            <div class="exercicio-details">
                <div class="exercicio-info">
                    <h4>${item.exercicio.nome}</h4>
                    <p>${item.series} séries x ${item.repeticoes} repetições</p>
                </div>
                <div class="exercicio-actions">
                    <button class="btn btn-secondary historico-btn" data-treino-exercicio-id="${item.id}" data-exercicio-nome="${item.exercicio.nome}">Histórico</button>
                    <button class="btn btn-danger remove-btn" data-exercicio-id="${item.exercicio.id}">Remover</button>
                </div>
            </div>
            <form class="registro-form" data-treino-exercicio-id="${item.id}">
                <div class="cargas-inputs-container">
                    ${cargasHtml}
                </div>
                <div class="form-group">
                    <label for="obs-${item.id}">Observações</label>
                    <input type="text" id="obs-${item.id}" class="obs-input" placeholder="Ex: Fácil, aumentar...">
                </div>
                <button type="submit" class="btn btn-primary">Registrar</button>
            </form>
        `;
        element.appendChild(exercicioItem);
    });

    document.querySelectorAll('.remove-btn').forEach(button => {
        button.addEventListener('click', () => {
            const exercicioId = button.dataset.exercicioId;
            handleRemoveExercicio(token, treinoId, exercicioId);
        });
    });

    document.querySelectorAll('.registro-form').forEach(form => {
        form.addEventListener('submit', (event) => handleRegistroSubmit(event, token));
    });

    document.querySelectorAll('.historico-btn').forEach(button => {
        button.addEventListener('click', () => {
            const treinoExercicioId = button.dataset.treinoExercicioId;
            const exercicioNome = button.dataset.exercicioNome;
            handleShowHistorico(token, treinoExercicioId, exercicioNome);
        });
    });
}

function displayHistorico(registros, element, token, treinoExercicioId, exercicioNome) {
    element.innerHTML = '';
    if(registros.length === 0) {
        element.innerHTML = '<p>Nenhum registo de performance encontrado para este exercício.</p>';
        return;
    }

    registros.forEach(reg => {
        const item = document.createElement('div');
        item.className = 'historico-item';
        const dataFormatada = new Date(reg.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

        item.innerHTML = `
            <div class="historico-item-info">
                <p class="data">Data: ${dataFormatada}</p>
                <p class="cargas"><strong>Cargas:</strong> ${reg.carga}</p>
                ${reg.observacoes ? `<p class="observacoes"><strong>Obs:</strong> ${reg.observacoes}</p>` : ''}
            </div>
            <div class="historico-item-actions">
                <button class="btn btn-danger delete-registro-btn" data-registro-id="${reg.id}">Apagar</button>
            </div>
        `;
        element.appendChild(item);
    });

    document.querySelectorAll('.delete-registro-btn').forEach(button => {
        button.addEventListener('click', () => {
            const registroId = button.dataset.registroId;
            handleDeleteRegistro(token, registroId, treinoExercicioId, exercicioNome);
        });
    });
}

let historicoChartInstance = null;

function renderHistoricoChart(registros, canvasElement) {
    if (historicoChartInstance) {
        historicoChartInstance.destroy();
    }

    if(registros.length < 2) {
        canvasElement.style.display = 'none';
        return;
    }
    canvasElement.style.display = 'block';

    const labels = registros.map(r => new Date(r.data).toLocaleDateString('pt-BR')).reverse();
    const data = registros.map(r => {
        const cargas = r.carga.split(',').map(Number);
        if (cargas.length === 0 || cargas.some(isNaN)) return 0;
        const soma = cargas.reduce((a, b) => a + b, 0);
        return (soma / cargas.length).toFixed(2);
    }).reverse();

    historicoChartInstance = new Chart(canvasElement, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Média de Carga (kg)',
                data: data,
                borderColor: 'rgba(14, 165, 233, 1)',
                backgroundColor: 'rgba(14, 165, 233, 0.2)',
                tension: 0.1,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: false }
            }
        }
    });
}

// --- FUNÇÕES DE UTILIDADE ---
function handleLogout() {
    localStorage.removeItem('jwtToken');
    window.location.href = 'login.html';
}

function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) { return null; }
}