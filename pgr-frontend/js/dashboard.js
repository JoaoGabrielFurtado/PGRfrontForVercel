// Endereço base da nossa API. Lembre-se de ajustar a porta se necessário.
//const urlApi = 'https://localhost:7290'; 

// O script começa a rodar assim que o HTML da página estiver completamente carregado.
document.addEventListener('DOMContentLoaded', () => {
    // Verificamos se o utilizador tem um "crachá" (token) de login guardado.
    const token = localStorage.getItem('jwtToken');
    if (!token) {
        // Se não tiver, ele não pode estar aqui. Redirecionamos para o login.
        window.location.href = 'login.html';
        return;
    }
    // Se o token existir, iniciamos a configuração da página.
    inicializarPainel(token);
});

// Função que configura todos os botões e carrega os dados iniciais da página.
function inicializarPainel(token) {
    // "Capturamos" todos os elementos do HTML com os quais vamos interagir.
    const gradeTreinos = document.getElementById('treinos-grid');
    const botaoSair = document.getElementById('logout-button');
    const botaoMostrarModalNovoTreino = document.getElementById('show-new-treino-modal');
    const modalNovoTreino = document.getElementById('new-treino-modal');
    const botaoFecharModalNovoTreino = document.getElementById('close-new-treino-modal');
    const formularioNovoTreino = document.getElementById('new-treino-form');
    const saudacaoUsuario = document.getElementById('user-greeting');
    const botaoInfo = document.getElementById('info-btn');
    const modalSobre = document.getElementById('about-modal');
    const botaoFecharModalSobre = document.getElementById('close-about-modal');

    // Ativamos os botões para abrir e fechar o modal "Sobre".
    if (botaoInfo) {
        botaoInfo.addEventListener('click', () => modalSobre.classList.add('active'));
    }
    if (botaoFecharModalSobre) {
        botaoFecharModalSobre.addEventListener('click', () => modalSobre.classList.remove('active'));
    }

    // Verificação de segurança para garantir que todos os elementos foram encontrados.
    if (!botaoMostrarModalNovoTreino || !modalNovoTreino || !botaoFecharModalNovoTreino || !formularioNovoTreino || !botaoSair || !saudacaoUsuario) {
        console.error('Erro: Um ou mais elementos essenciais do painel não foram encontrados no HTML.');
        return;
    }

    // Lemos as informações de dentro do token para personalizar a saudação.
    const tokenDecodificado = decodificarTokenJwt(token);
    const infoNome = tokenDecodificado['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname'];

    if (infoNome) {
        const primeiroNome = infoNome.split(' ')[0];
        saudacaoUsuario.textContent = `Olá, ${primeiroNome}!`;
    }

    // Adicionamos os "ouvintes" de eventos para os botões e formulários.
    botaoMostrarModalNovoTreino.addEventListener('click', () => modalNovoTreino.classList.add('active'));
    botaoFecharModalNovoTreino.addEventListener('click', () => modalNovoTreino.classList.remove('active'));
    formularioNovoTreino.addEventListener('submit', (evento) => processarEnvioNovoTreino(evento, token));
    botaoSair.addEventListener('click', processarLogout);

    // Por fim, buscamos os treinos do utilizador na API para exibir na tela.
    buscarTreinos(token, gradeTreinos);
}

// Busca a lista de treinos do utilizador na API.
async function buscarTreinos(token, gradeTreinos) {
    try {
        const resposta = await fetch(`${urlApi}/api/treinos`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (resposta.ok) {
            const treinos = await resposta.json();
            exibirTreinos(treinos, gradeTreinos);
        } else if (resposta.status === 401) {
            // Se o token for inválido ou tiver expirado, fazemos o logout.
            processarLogout();
        } else {
            gradeTreinos.innerHTML = '<p>Não foi possível carregar os seus treinos.</p>';
        }
    } catch (erro) {
        console.error('Erro de rede ao buscar treinos:', erro);
        gradeTreinos.innerHTML = '<p>Erro de conexão com o servidor.</p>';
    }
}

// Envia os dados do formulário de novo treino para a API.
async function processarEnvioNovoTreino(evento, token) {
    evento.preventDefault();
    const nomeDoTreino = document.getElementById('nomeTreino').value;
    const descricaoDoTreino = document.getElementById('descricaoTreino').value;
    
    const dadosNovoTreino = {
        nomeTreino: nomeDoTreino,
        descricao: descricaoDoTreino
    };

    try {
        const resposta = await fetch(`${urlApi}/api/treinos`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(dadosNovoTreino)
        });
        if (resposta.ok) {
            alert('Plano de treino criado com sucesso!');
            document.getElementById('new-treino-modal').classList.remove('active');
            document.getElementById('new-treino-form').reset();
            // Após criar, atualizamos a lista na tela.
            buscarTreinos(token, document.getElementById('treinos-grid'));
        } else {
            alert('Falha ao criar o plano de treino.');
        }
    } catch (erro) {
        console.error('Erro ao criar treino:', erro);
        alert('Erro de conexão ao tentar criar o plano.');
    }
}

// Desenha os cartões de treino na tela.
function exibirTreinos(treinos, gradeTreinos) {
    gradeTreinos.innerHTML = ''; 

    if (treinos.length === 0) {
        gradeTreinos.innerHTML = '<p>Você ainda não criou nenhum plano de treino. Clique em "+ Novo Plano" para começar!</p>';
        return;
    }

    treinos.forEach(treino => {
        const cartao = document.createElement('div');
        cartao.className = 'card';
        cartao.dataset.treinoId = treino.id; 
        
        cartao.innerHTML = `
            <h3>${treino.nomeDoTreino}</h3>
            <p>${treino.descricao || 'Sem descrição.'}</p> 
        `;

        // Torna o cartão clicável para levar à página de detalhes.
        cartao.addEventListener('click', () => {
            window.location.href = `treino.html?id=${treino.id}`;
        });

        gradeTreinos.appendChild(cartao);
    });
}

// Remove o token e redireciona para a página de login.
function processarLogout() {
    localStorage.removeItem('jwtToken');
    window.location.href = 'login.html';
}

// Função auxiliar que lê as informações de dentro do token JWT.
function decodificarTokenJwt(token) {
    try {
        const urlBase64 = token.split('.')[1];
        const base64 = urlBase64.replace(/-/g, '+').replace(/_/g, '/');
        const dadosJson = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(dadosJson);
    } catch (e) {
        return null;
    }
}