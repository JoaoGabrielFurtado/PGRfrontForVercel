// Define o endereço da API.
//const urlApi = 'https://localhost:7290';

//formulários página HTML 
const formularioLogin = document.getElementById('login-form');
const formularioRegistro = document.getElementById('register-form');



if (formularioLogin) {
    formularioLogin.addEventListener('submit', processarLogin);
}

if (formularioRegistro) {
    formularioRegistro.addEventListener('submit', processarRegistro);
}


// FUNÇÃO PARA O LOGIN

async function processarLogin(evento) {
    evento.preventDefault();

    const campoEmail = document.getElementById('email');
    const campoSenha = document.getElementById('senha');

    const dadosLogin = {
        email: campoEmail.value,
        senha: campoSenha.value 
    };

    try {
        const resposta = await fetch(`${urlApi}/api/auth/login`, {
            method: 'POST', // Envio dos dados
            headers: {
                'Content-Type': 'application/json' // Formato JSON
            },
            body: JSON.stringify(dadosLogin) // Converte objeto JavaScript para uma string em formato JSON
        });

        // Verifica resposta da API
        if (resposta.ok) {
            const dados = await resposta.json(); 
            localStorage.setItem('jwtToken', dados.token);
            alert('Login realizado com sucesso!');
            window.location.href = 'index.html'; 
        } else {
            alert('Falha no login. Verifique o seu email e senha.');
        }
    } catch (erro) {
        console.error('Ocorreu um erro ao tentar fazer login:', erro);
        alert('Não foi possível conectar ao servidor. Por favor, tente novamente mais tarde.');
    }
}


// FUNÇÃO PARA O REGISTO

async function processarRegistro(evento) {
    evento.preventDefault();

    const campoNome = document.getElementById('nome');
    const campoEmail = document.getElementById('email');
    const campoSenha = document.getElementById('senha');

    const dadosRegistro = {
        nome: campoNome.value,
        email: campoEmail.value,
        senha: campoSenha.value 
    };

    try {
        const resposta = await fetch(`${urlApi}/api/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dadosRegistro)
        });

        if (resposta.ok) {
            alert('Registo realizado com sucesso! Agora você pode fazer o login.');
            window.location.href = 'login.html'; 
        } else {
            const dadosErro = await resposta.json();
            const mensagemErro = dadosErro.errors ? JSON.stringify(dadosErro.errors) : "Verifique os dados informados.";
            alert(`Falha no registo: ${mensagemErro}`);
        }
    } catch (erro) {
        console.error('Ocorreu um erro ao tentar registar:', erro);
        alert('Não foi possível conectar ao servidor. Por favor, tente novamente mais tarde.');
    }
}