import { supabase } from '../supabase.js'

window.voltar = function() {
    window.location.href = '../dashboard/inicio.html?secao=valvulas'
}

window.abrirSetor = function(setor) {
    window.location.href = `../setor/setor.html?tipo=Esfera&setor=${encodeURIComponent(setor)}`
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
        .eq('tipo', 'Esfera')

    if (error || !data) return

    const contagem = {}
    let globalTotal = 0
    let globalConcluidas = 0

    for (const v of data) {
        if (!contagem[v.setor]) contagem[v.setor] = { total: 0, concluidas: 0 }
        if (v.status !== 'Descartada') {
            contagem[v.setor].total++
            globalTotal++
        }
        if (v.status === 'Entregue') {
            contagem[v.setor].concluidas++
            globalConcluidas++
        }
    }

    const globalPct = globalTotal > 0 ? Math.round((globalConcluidas / globalTotal) * 100) : 0
    document.getElementById('resumo-barra').style.width = `${globalPct}%`
    document.getElementById('resumo-label').textContent = globalTotal > 0
        ? `Progresso geral — ${globalConcluidas} de ${globalTotal} concluída${globalConcluidas !== 1 ? 's' : ''} (${globalPct}%)`
        : 'Progresso geral — sem registros'

    for (const setor of SETORES) {
        const c        = contagem[setor.nome]
        const statusEl = document.getElementById(`status-${setor.id}`)
        const barraEl  = document.getElementById(`barra-${setor.id}`)
        const pctEl    = document.getElementById(`pct-${setor.id}`)
        const tagEl    = document.getElementById(`tag-${setor.id}`)

        if (!statusEl || !barraEl || !pctEl || !tagEl) continue

        if (!c || c.total === 0) {
            statusEl.innerHTML = '<span class="status-sem-registro">Sem registros ainda</span>'
            barraEl.style.width = '0%'
            pctEl.textContent = '0%'
            tagEl.textContent = '○ Não iniciado'
            tagEl.className = 'setor-tag tag-nao-iniciado'
            continue
        }

        const pct = Math.round((c.concluidas / c.total) * 100)

        statusEl.innerHTML = c.concluidas > 0
            ? `<span class="status-concluidas">✓ ${c.concluidas} de ${c.total} concluída${c.concluidas !== 1 ? 's' : ''}</span>`
            : `<span class="status-sem-registro">${c.total} registrada${c.total !== 1 ? 's' : ''}, nenhuma concluída</span>`

        barraEl.style.width = `${pct}%`
        pctEl.textContent = `${pct}%`

        if (pct === 100) {
            tagEl.textContent = '● Concluído'
            tagEl.className = 'setor-tag tag-concluido'
        } else if (pct > 0) {
            tagEl.textContent = '● Em andamento'
            tagEl.className = 'setor-tag tag-em-andamento'
        } else {
            tagEl.textContent = '○ Não iniciado'
            tagEl.className = 'setor-tag tag-nao-iniciado'
        }
    }
}

carregarProgressos()
