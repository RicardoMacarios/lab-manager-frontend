// --- LÓGICA DE LOGIN ---
const loginForm = document.getElementById('loginForm');

if (loginForm) {
    loginForm.addEventListener('submit', function(event) {
        event.preventDefault();

        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        const emailError = document.getElementById('emailError');
        const passError = document.getElementById('passError');

        let isValid = true;

        if (!emailInput.value.endsWith('@gmail.com')) {
            emailError.style.display = 'block';
            isValid = false;
        } else {
            emailError.style.display = 'none';
        }

        if (passwordInput.value.length < 6) {
            passError.style.display = 'block';
            isValid = false;
        } else {
            passError.style.display = 'none';
        }

        if (isValid) {
            alert("Login realizado com sucesso!");
            // Se a dashboard estiver na raiz (fora da pasta login)
            window.location.href = "../dashboard.html"; 
        }
    });
}

// --- LÓGICA DE CADASTRO ---
const formCad = document.getElementById('formCadastro');

if (formCad) {
    formCad.addEventListener('submit', function(event) {
        event.preventDefault();

        const senha = document.getElementById('senha').value;
        const confirma = document.getElementById('confirmarSenha').value;

        if (senha !== confirma) {
            alert("As senhas não coincidem!");
            return;
        }

        alert("Cadastro realizado com sucesso!");
        window.location.href = "login.html"; 
    });
}