import { supabase } from '../supabase.js'

window.openDashboard = function(type) {
    const name = type.toLowerCase()
                     .trim()
                     .normalize('NFD')
                     .replace(/[\u0300-\u036f]/g, "")
                     .replace(/ç/g, "c")
    window.location.href = `../${name}/${name}.html`
}

window.openSedes = function(marca) {
    window.location.href = `../sedes/sedes.html?marca=${encodeURIComponent(marca)}`
}

window.mostrarSecao = function(secao) {
    document.getElementById('secao-valvulas').classList.toggle('hidden', secao !== 'valvulas')
    document.getElementById('secao-sedes').classList.toggle('hidden', secao !== 'sedes')
    document.getElementById('nav-valvulas').classList.toggle('active', secao === 'valvulas')
    document.getElementById('nav-sedes').classList.toggle('active', secao === 'sedes')

    const wrapper = document.getElementById('wrapper-sininho')
    if (secao === 'sedes') {
        wrapper.classList.remove('hidden')
        carregarAlertas()
    } else {
        wrapper.classList.add('hidden')
        document.getElementById('painel-alertas').classList.add('translate-x-full')
        document.getElementById('overlay-painel').classList.add('hidden')
    }
}

// ============================================================
// SININHO — ALERTAS DE ESTOQUE BAIXO
// ============================================================
async function carregarAlertas() {
    const { data, error } = await supabase
        .from('sedes_estoque')
        .select('marca, polegada, quantidade')
        .lte('quantidade', 5)
        .order('marca')
        .order('polegada')

    const badge = document.getElementById('badge-sininho')
    const lista = document.getElementById('lista-alertas')

    if (error || !data || data.length === 0) {
        badge.classList.add('hidden')
        lista.innerHTML = '<p class="text-[10px] tracking-widest text-[#388e3c] uppercase px-5 py-4">Nenhum alerta de estoque baixo</p>'
        return
    }

    badge.classList.remove('hidden')
    badge.textContent = data.length

    lista.innerHTML = data.map(s => `
        <div class="flex items-center justify-between px-5 py-3 border-b border-[#a5d6a7] last:border-0">
            <div>
                <p class="text-[#1b5e20] text-xs tracking-wider uppercase">${s.polegada}</p>
                <p class="text-[9px] tracking-widest text-[#388e3c] uppercase">${s.marca}</p>
            </div>
            <span class="text-red-600 text-base font-light">${s.quantidade}</span>
        </div>
    `).join('')
}

document.addEventListener('DOMContentLoaded', () => {
    const secaoInicial = new URLSearchParams(window.location.search).get('secao')
    if (secaoInicial) window.mostrarSecao(secaoInicial)

    const sidebar  = document.getElementById('sidebar')
    const btnMenu  = document.getElementById('btn-menu')
    const overlay  = document.getElementById('overlay-sidebar')

    btnMenu.addEventListener('click', () => {
        sidebar.classList.toggle('sidebar-fechada')
        overlay.classList.toggle('hidden')
    })

    overlay.addEventListener('click', () => {
        sidebar.classList.add('sidebar-fechada')
        overlay.classList.add('hidden')
    })

    const btn            = document.getElementById('btn-sininho')
    const painel         = document.getElementById('painel-alertas')
    const overlayAlertas = document.getElementById('overlay-painel')
    const fechar         = document.getElementById('btn-fechar-painel')

    btn.addEventListener('click', () => {
        painel.classList.remove('translate-x-full')
        overlayAlertas.classList.remove('hidden')
    })

    fechar.addEventListener('click', () => {
        painel.classList.add('translate-x-full')
        overlayAlertas.classList.add('hidden')
    })

    overlayAlertas.addEventListener('click', () => {
        painel.classList.add('translate-x-full')
        overlayAlertas.classList.add('hidden')
    })
})
