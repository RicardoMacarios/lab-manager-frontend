function openDashboard(type) {
    const name = type.toLowerCase()
                     .trim()
                     .normalize('NFD')
                     .replace(/[\u0300-\u036f]/g, "")
                     .replace(/ç/g, "c")
    window.location.href = `../${name}/${name}.html`
}
