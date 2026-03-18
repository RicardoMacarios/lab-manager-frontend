// Importa a conexão
import { supabase } from '../supabase.js';

const loginForm = document.getElementById('loginForm');

if (loginForm) {
    loginForm.addEventListener('submit', async function(event) {
        event.preventDefault();

        const emailInput = document.getElementById('email').value;
        const passwordInput = document.getElementById('password').value;
        const emailError = document.getElementById('emailError');
        const passError = document.getElementById('passError');

        // Suas validações visuais (mantidas)
        let isValid = true;
        if (!emailInput.endsWith('@gmail.com')) {
            emailError.style.display = 'block';
            isValid = false;
        } else {
            emailError.style.display = 'none';
        }
        if (passwordInput.length < 6) {
            passError.style.display = 'block';
            isValid = false;
        } else {
            passError.style.display = 'none';
        }

        if (isValid) {
            // --- INTEGRAÇÃO COM SUPABASE ---
            const btnLogin = document.getElementById('btnLogin');
            btnLogin.disabled = true;
            btnLogin.textContent = 'Entrando...';

            const { data, error } = await supabase.auth.signInWithPassword({
                email: emailInput,
                password: passwordInput,
            });

            btnLogin.disabled = false;
            btnLogin.textContent = 'Entrar';

            if (error) {
                alert("Erro ao fazer login: " + error.message);
            } else {
                alert("Login realizado com sucesso!");
                window.location.href = "../dashboard/inicio.html"; 
            }
        }
    });
}