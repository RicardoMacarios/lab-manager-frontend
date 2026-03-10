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
            // SAI da pasta login e ENTRA na dashboard
            window.location.href = "../dashboard/inicio.html"; 
        }
    });
}