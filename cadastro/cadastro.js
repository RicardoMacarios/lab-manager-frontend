const formCad = document.getElementById('formCadastro');

if (formCad) {
    formCad.addEventListener('submit', function(event) {
        event.preventDefault();

        const nome = document.getElementById('nome').value;
        const senha = document.getElementById('senha').value;
        const confirma = document.getElementById('confirmarSenha').value;

        if (senha !== confirma) {
            alert("Erro: As senhas não são iguais!");
            return;
        }

        alert("Usuário " + nome + " cadastrado com sucesso!");
        
        // Sai da pasta cadastro e entra na pasta login
        window.location.href = "../login/login.html"; 
    });
}