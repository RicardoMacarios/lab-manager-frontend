function voltar() {
    console.log("Saindo de borboleta para dashboard/inicio.html");
    // ../ sai da pasta borboleta | dashboard/ entra na pasta certa | inicio.html abre o arquivo
    window.location.href = "../dashboard/inicio.html";
}

function abrirSetor(setor) {
    console.log("Setor selecionado: " + setor);
    alert("Setor: " + setor);
}