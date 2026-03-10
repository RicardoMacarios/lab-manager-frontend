function openDashboard(type) {
    // 1. Converte para minúsculo e remove acentos (ex: 'Retenção' vira 'retencao')
    // O .trim() remove espaços vazios acidentais
    const name = type.toLowerCase()
                     .trim()
                     .normalize('NFD')
                     .replace(/[\u0300-\u036f]/g, "")
                     .replace(/ç/g, "c"); // Garante a troca do ç por c
    
    console.log("Abrindo pasta da válvula:", name);
    
    // 2. Redirecionamento:
    // Sair de /dashboard e entrar em /nome_da_valvula
    window.location.href = `../${name}/${name}.html`;
}

function goBack() {
    // Essa função serve apenas se você estiver alternando telas no mesmo HTML
    const dashScreen = document.getElementById('dashboard-screen');
    const launchScreen = document.getElementById('launcher-screen');

    if (dashScreen && launchScreen) {
        dashScreen.classList.add('hidden');
        launchScreen.style.display = 'flex';
    }
}