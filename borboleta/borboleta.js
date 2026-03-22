import { supabase } from '../supabase.js'

window.voltar = function() {
    window.location.href = "../dashboard/inicio.html";
}

window.abrirSetor = function(setor) {
    window.location.href = `../setor/setor.html?tipo=Borboleta&setor=${encodeURIComponent(setor)}`;
}

const SETORES = [
    { nome: 'Fermentação', id: 'fermentacao' },
    { nome: 'Massa A',     id: 'massaa' },
    { nome: 'Massa B',     id: 'massab' },
    { nome: 'TRCA',        id: 'trca' },
    { nome: 'Moenda',      id: 'moenda' },
]

async function carregarProgressos() {
    const { data, error } = await supabase
        .from('valvulas')
        .select('setor, status')
        .eq('tipo', 'Borboleta')

    if (error || !data) return

    const contagem = {}
    for (const v of data) {
        if (!contagem[v.setor]) contagem[v.setor] = { total: 0, concluidas: 0 }
        contagem[v.setor].total++
        if (v.status === 'Pronta' || v.status === 'Entregue') {
            contagem[v.setor].concluidas++
        }
    }

    for (const setor of SETORES) {
        const c = contagem[setor.nome]
        const textoEl = document.getElementById(`prog-${setor.id}`)
        const barraEl = document.getElementById(`barra-${setor.id}`)
        if (!textoEl || !barraEl) continue

        if (!c || c.total === 0) {
            textoEl.textContent = 'sem registros'
            barraEl.style.width = '0%'
            continue
        }

        const pct = Math.round((c.concluidas / c.total) * 100)
        textoEl.textContent = `${c.concluidas} de ${c.total} concluída${c.concluidas !== 1 ? 's' : ''}`
        barraEl.style.width = `${pct}%`

        if (pct === 100) barraEl.classList.add('barra-completa')
    }
}

carregarProgressos()
