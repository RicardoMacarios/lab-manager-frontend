// Importa a conexão (ajuste o caminho '../' se o arquivo estiver na pasta principal)
import { supabase } from '../supabase.js';

const formCad = document.getElementById('formCadastro');

if (formCad) {
    formCad.addEventListener('submit', async function(event) {
        event.preventDefault();

        const nome = document.getElementById('nome').value;
        const email = document.getElementById('emailCad').value; // Faltava pegar o email no seu código original
        const senha = document.getElementById('senha').value;
        const confirma = document.getElementById('confirmarSenha').value;

        if (senha !== confirma) {
            alert("Erro: As senhas não são iguais!");
            return;
        }

        // --- INTEGRAÇÃO COM SUPABASE ---
        // Desativamos o botão temporariamente para evitar cliques duplos
        const btnSubmit = formCad.querySelector('button');
        btnSubmit.disabled = true;
        btnSubmit.textContent = 'Cadastrando...';

        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: senha,
            options: {
                data: {
                    full_name: nome // Envia o nome para os metadados do Supabase
                }
            }
        });

        btnSubmit.disabled = false;
        btnSubmit.textContent = 'Finalizar Cadastro';

        if (error) {
            alert("Erro ao cadastrar: " + error.message);
        } else {
            alert(`Usuário ${nome} cadastrado com sucesso! Verifique seu e-mail (se a confirmação estiver ativa).`);
            window.location.href = "../login/login.html"; 
        }
    });
}