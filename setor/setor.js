import { supabase } from '../supabase.js'

// ---- Parâmetros da URL ----
const params = new URLSearchParams(window.location.search)
const TIPO = params.get('tipo') || ''
const SETOR = params.get('setor') || ''

// ---- Mapa de válvulas em memória (id → objeto) ----
let valvulasMapa = {}

// ---- Lista completa para filtragem client-side ----
let todasValvulas = []

// ---- Filtro de status ativo ----
let filtroStatus = ''

// ---- Senha de exclusão ----
const SENHA_EXCLUSAO = 'valvula@2025'

// ---- Referências ao canvas ----
const canvas = document.getElementById('canvas-assinatura')
const ctx = canvas.getContext('2d')
let desenhando = false


// ============================================================
// INICIALIZAÇÃO
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('label-tipo').textContent = `Tipo: ${TIPO}`
    document.getElementById('titulo-setor').textContent = SETOR
    document.title = `V-Manager | ${TIPO} · ${SETOR}`

    configurarCanvas()
    carregarValvulas()
    vincularEventos()
})


// ============================================================
// CARREGAR E RENDERIZAR VÁLVULAS
// ============================================================
async function carregarValvulas() {
    const lista = document.getElementById('lista-valvulas')
    lista.innerHTML = '<p class="text-slate-700 text-[10px] tracking-widest uppercase col-span-full py-4">Carregando...</p>'

    const { data, error } = await supabase
        .from('valvulas')
        .select('*')
        .eq('tipo', TIPO)
        .eq('setor', SETOR)
        .order('criado_em', { ascending: false })

    if (error) {
        lista.innerHTML = `<p class="text-red-500/60 text-xs py-4">${error.message}</p>`
        return
    }

    valvulasMapa = {}
    data.forEach(v => { valvulasMapa[v.id] = v })
    todasValvulas = data

    const entregues = data.filter(v => !!v.retirada_por).length
    document.getElementById('stat-total').textContent     = data.length
    document.getElementById('stat-entregues').textContent = entregues
    document.getElementById('stat-faltam').textContent    = data.length - entregues

    if (data.length === 0) {
        lista.innerHTML = '<p class="text-slate-700 text-[10px] tracking-widest uppercase col-span-full py-4">Nenhuma válvula cadastrada</p>'
        return
    }

    renderizarLista()
}

function renderizarLista() {
    const lista = document.getElementById('lista-valvulas')
    const termo = (document.getElementById('campo-busca')?.value || '').toLowerCase().trim()

    let resultado = todasValvulas

    if (filtroStatus) {
        resultado = resultado.filter(v => v.status === filtroStatus)
    }

    if (termo) {
        resultado = resultado.filter(v =>
            [v.nome, v.marca, v.polegada, v.observacoes]
                .filter(Boolean)
                .some(campo => campo.toLowerCase().includes(termo))
        )
    }

    if (resultado.length === 0) {
        lista.innerHTML = '<p class="text-slate-700 text-[10px] tracking-widest uppercase col-span-full py-4">Nenhuma válvula encontrada</p>'
        return
    }

    lista.innerHTML = resultado.map(renderCard).join('')
}

// Retorna as classes do badge de acordo com o status
function classesBadge(status) {
    if (status === 'Pronta'  || status === 'Normal')           return 'bg-[#a5d6a7] text-[#1b5e20] border-[#4caf50]'
    if (status === 'Em manutenção' || status === 'Manutenção') return 'bg-yellow-100 text-yellow-800 border-yellow-500'
    if (status === 'Substituída')                              return 'bg-blue-100 text-blue-700 border-blue-400'
    if (status === 'Entregue')                                 return 'bg-purple-100 text-purple-700 border-purple-400'
    return                                                            'bg-red-100 text-red-700 border-red-400'
}

// Rótulo legível do status (com emoji)
function labelStatus(status) {
    const map = {
        'Em manutenção': '🔧 Em manutenção',
        'Pronta':        '✅ Pronta',
        'Substituída':   '🔄 Substituída',
        'Descartada':    '🗑️ Descartada',
        'Entregue':      '📦 Entregue',
        // retrocompatibilidade
        'Normal':        'Normal',
        'Manutenção':    '🔧 Manutenção',
        'Inativa':       'Inativa',
    }
    return map[status] || status
}

// Monta o HTML de um card de válvula
function renderCard(v) {
    const infoSecundaria = [v.marca, v.polegada].filter(Boolean).join(' · ')

    const acaoRetirada = v.retirada_por
        ? `<div class="flex items-center gap-2">
               <span class="text-[10px] tracking-wider text-[#388e3c] uppercase">
                   Retirada por: <span class="text-[#1b5e20] normal-case">${v.retirada_por}</span>
               </span>
               <button class="btn-ver-assinatura text-[#2e7d32] hover:text-[#1b5e20] transition-colors" data-id="${v.id}" title="Ver assinatura">
                   <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                             d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
                   </svg>
               </button>
           </div>`
        : `<button class="btn-retirar text-[10px] tracking-widest uppercase border border-yellow-600 text-yellow-700 px-3 py-1 hover:bg-yellow-100 transition-all cursor-pointer" data-id="${v.id}">
               Registrar Retirada
           </button>`

    return `
        <div class="card p-4">
            <div class="flex items-start justify-between gap-3 mb-3">
                <div class="flex-1 min-w-0">
                    <h3 class="text-[#1b5e20] uppercase tracking-widest text-sm font-medium leading-snug">${v.nome}</h3>
                    ${infoSecundaria ? `<p class="text-[#388e3c] text-xs mt-0.5">${infoSecundaria}</p>` : ''}
                    ${v.observacoes ? `<p class="text-[#4caf50] text-xs italic mt-1">${v.observacoes}</p>` : ''}
                    ${v.recebido_por ? `<p class="text-[10px] tracking-wider text-[#388e3c] uppercase mt-1">Recebido por: <span class="text-[#1b5e20] normal-case">${v.recebido_por}</span></p>` : ''}
                </div>
                <span class="inline-block shrink-0 px-2 py-0.5 text-[9px] tracking-widest uppercase border rounded-full ${classesBadge(v.status)}">
                    ${labelStatus(v.status)}
                </span>
            </div>
            <div class="flex items-center justify-between gap-2 flex-wrap pt-2 border-t border-[#a5d6a7]">
                <div class="flex items-center gap-2 flex-wrap">
                    ${acaoRetirada}
                </div>
                <div class="flex items-center gap-2">
                    <button class="btn-historico text-[#2e7d32] hover:text-[#1b5e20] transition-colors" data-id="${v.id}" title="Ver histórico">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                    </button>
                    <button class="btn-editar text-[10px] tracking-widest uppercase border border-[#66bb6a] text-[#2e7d32] px-3 py-1 hover:bg-[#a5d6a7] transition-all cursor-pointer" data-id="${v.id}">
                        Editar
                    </button>
                    <button class="btn-excluir text-red-400 hover:text-red-600 transition-colors" data-id="${v.id}" title="Excluir válvula">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    `
}


// ============================================================
// VINCULAR EVENTOS (delegação + botões fixos)
// ============================================================
function vincularEventos() {
    // Delegação de cliques na lista de válvulas
    document.getElementById('lista-valvulas').addEventListener('click', e => {
        const btnEditar     = e.target.closest('.btn-editar')
        const btnRetirar    = e.target.closest('.btn-retirar')
        const btnAssinatura = e.target.closest('.btn-ver-assinatura')
        const btnReceber    = e.target.closest('.btn-receber')
        const btnHistorico  = e.target.closest('.btn-historico')

        const btnExcluir    = e.target.closest('.btn-excluir')

        if (btnEditar)     abrirModalEdicao(btnEditar.dataset.id)
        if (btnRetirar)    abrirModalRetirada(btnRetirar.dataset.id)
        if (btnAssinatura) abrirModalAssinatura(btnAssinatura.dataset.id)
        if (btnReceber)    abrirModalRecebimento(btnReceber.dataset.id)
        if (btnHistorico)  abrirModalHistorico(btnHistorico.dataset.id)
        if (btnExcluir)    abrirModalExcluir(btnExcluir.dataset.id)
    })

    // Fechar modais ao clicar no overlay (fora da caixa)
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', e => {
            if (e.target === overlay) overlay.classList.add('hidden')
        })
    })

    // ---- Busca em tempo real ----
    document.getElementById('campo-busca').addEventListener('input', renderizarLista)

    // ---- Filtro de status ----
    document.getElementById('filtro-status').addEventListener('change', e => {
        filtroStatus = e.target.value
        renderizarLista()
    })

    // ---- Modal cadastro ----
    document.getElementById('btn-cadastrar').addEventListener('click', () => {
        document.getElementById('form-cadastro').reset()
        document.getElementById('erro-cadastro').textContent = ''
        document.getElementById('modal-cadastro').classList.remove('hidden')
        setTimeout(() => document.getElementById('cad-nome').focus(), 50)
    })

    document.getElementById('btn-fechar-cadastro').addEventListener('click', () => {
        document.getElementById('modal-cadastro').classList.add('hidden')
    })

    document.getElementById('form-cadastro').addEventListener('submit', salvarCadastro)

    // ---- Modal edição ----
    document.getElementById('btn-fechar-edicao').addEventListener('click', () => {
        document.getElementById('modal-edicao').classList.add('hidden')
    })

    document.getElementById('form-edicao').addEventListener('submit', salvarEdicao)

    // ---- Modal retirada ----
    document.getElementById('btn-fechar-retirada').addEventListener('click', () => {
        document.getElementById('modal-retirada').classList.add('hidden')
    })

    document.getElementById('btn-limpar-canvas').addEventListener('click', limparCanvas)

    document.getElementById('form-retirada').addEventListener('submit', confirmarRetirada)

    // ---- Modal assinatura ----
    document.getElementById('btn-fechar-assinatura').addEventListener('click', () => {
        document.getElementById('modal-assinatura').classList.add('hidden')
    })

    // ---- Modal recebimento ----
    document.getElementById('btn-fechar-recebimento').addEventListener('click', () => {
        document.getElementById('modal-recebimento').classList.add('hidden')
    })

    document.getElementById('form-recebimento').addEventListener('submit', confirmarRecebimento)

    // ---- Modal histórico ----
    document.getElementById('btn-fechar-historico').addEventListener('click', () => {
        document.getElementById('modal-historico').classList.add('hidden')
    })

    // ---- Modal exclusão ----
    document.getElementById('btn-fechar-excluir').addEventListener('click', () => {
        document.getElementById('modal-excluir').classList.add('hidden')
    })

    document.getElementById('form-excluir').addEventListener('submit', confirmarExclusao)
}


// ============================================================
// MODAL: CADASTRO
// ============================================================
async function salvarCadastro(e) {
    e.preventDefault()
    const erroEl = document.getElementById('erro-cadastro')
    erroEl.textContent = ''

    const nome = document.getElementById('cad-nome').value.trim()
    if (!nome) {
        erroEl.textContent = 'O nome é obrigatório.'
        return
    }

    const recebidoPor = document.getElementById('cad-recebido-por').value.trim() || null

    const { data: inserted, error } = await supabase.from('valvulas').insert({
        nome,
        marca:        document.getElementById('cad-marca').value.trim()       || null,
        polegada:     document.getElementById('cad-polegada').value.trim()    || null,
        status:       document.getElementById('cad-status').value,
        observacoes:  document.getElementById('cad-observacoes').value.trim() || null,
        recebido_por: recebidoPor,
        tipo:  TIPO,
        setor: SETOR,
    }).select('id').single()

    if (error) {
        erroEl.textContent = error.message
        return
    }

    // Se informou quem recebeu, registrar no histórico
    if (recebidoPor && inserted?.id) {
        await supabase.from('historico_valvulas').insert({
            valvula_id:  inserted.id,
            tipo_evento: 'recebimento',
            descricao:   'Recebida na oficina (cadastro)',
            responsavel: recebidoPor,
        })
    }

    document.getElementById('modal-cadastro').classList.add('hidden')
    await carregarValvulas()
}


// ============================================================
// MODAL: EDIÇÃO
// ============================================================
function abrirModalEdicao(id) {
    const v = valvulasMapa[id]
    if (!v) return

    document.getElementById('edit-id').value                = id
    document.getElementById('edit-nome-valvula').textContent = v.nome
    document.getElementById('edit-status').value            = v.status
    document.getElementById('edit-observacoes').value       = v.observacoes || ''
    document.getElementById('edit-alterado-por').value      = ''
    document.getElementById('erro-edicao').textContent      = ''

    document.getElementById('modal-edicao').classList.remove('hidden')
}

async function salvarEdicao(e) {
    e.preventDefault()
    const erroEl = document.getElementById('erro-edicao')
    erroEl.textContent = ''

    const id          = document.getElementById('edit-id').value
    const statusNovo  = document.getElementById('edit-status').value
    const observacoes = document.getElementById('edit-observacoes').value.trim() || null
    const alteradoPor = document.getElementById('edit-alterado-por').value.trim()

    if (!alteradoPor) {
        erroEl.textContent = 'Informe quem está alterando.'
        return
    }

    const statusAnterior = valvulasMapa[id]?.status

    const { error } = await supabase.from('valvulas').update({
        status:      statusNovo,
        observacoes: observacoes,
    }).eq('id', id)

    if (error) {
        erroEl.textContent = error.message
        return
    }

    // Registrar no histórico
    if (statusAnterior !== statusNovo) {
        await supabase.from('historico_valvulas').insert({
            valvula_id:      id,
            tipo_evento:     'mudanca_status',
            descricao:       `Status alterado: ${statusAnterior} → ${statusNovo}`,
            responsavel:     alteradoPor,
            status_anterior: statusAnterior,
            status_novo:     statusNovo,
        })
    } else {
        await supabase.from('historico_valvulas').insert({
            valvula_id:  id,
            tipo_evento: 'edicao',
            descricao:   'Observações atualizadas',
            responsavel: alteradoPor,
        })
    }

    document.getElementById('modal-edicao').classList.add('hidden')
    await carregarValvulas()
}


// ============================================================
// MODAL: RETIRADA COM ASSINATURA
// ============================================================
function abrirModalRetirada(id) {
    document.getElementById('retirada-id').value         = id
    document.getElementById('retirada-nome').value       = ''
    document.getElementById('erro-retirada').textContent = ''

    document.getElementById('modal-retirada').classList.remove('hidden')

    setTimeout(() => {
        ajustarDimensoesCanvas()
        limparCanvas()
        document.getElementById('retirada-nome').focus()
    }, 30)
}

async function confirmarRetirada(e) {
    e.preventDefault()
    const erroEl = document.getElementById('erro-retirada')
    erroEl.textContent = ''

    const nome = document.getElementById('retirada-nome').value.trim()
    if (!nome) {
        erroEl.textContent = 'Informe o nome de quem está retirando.'
        return
    }

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const temDesenho = Array.from(imageData.data).some((val, i) => i % 4 === 3 && val > 0)
    if (!temDesenho) {
        erroEl.textContent = 'Por favor, assine no campo de assinatura.'
        return
    }

    const assinaturaBase64 = canvas.toDataURL('image/png')
    const id   = document.getElementById('retirada-id').value
    const agora = new Date().toISOString()

    const { error } = await supabase.from('valvulas').update({
        retirada_por:               nome,
        retirada_assinatura_base64: assinaturaBase64,
        retirada_data:              agora,
        status:                     'Entregue',
    }).eq('id', id)

    if (error) {
        erroEl.textContent = error.message
        return
    }

    await supabase.from('historico_valvulas').insert({
        valvula_id:  id,
        tipo_evento: 'retirada',
        descricao:   'Válvula retirada (com assinatura)',
        responsavel: nome,
    })

    document.getElementById('modal-retirada').classList.add('hidden')
    await carregarValvulas()
}


// ============================================================
// MODAL: VISUALIZAR ASSINATURA
// ============================================================
function abrirModalAssinatura(id) {
    const v = valvulasMapa[id]
    if (!v) return

    document.getElementById('assin-nome').textContent = v.retirada_por || '—'
    document.getElementById('assin-data').textContent = v.retirada_data
        ? new Date(v.retirada_data).toLocaleString('pt-BR')
        : '—'
    document.getElementById('assin-img').src = v.retirada_assinatura_base64 || ''

    document.getElementById('modal-assinatura').classList.remove('hidden')
}


// ============================================================
// MODAL: RECEBIMENTO NA OFICINA
// ============================================================
function abrirModalRecebimento(id) {
    const v = valvulasMapa[id]
    if (!v) return

    document.getElementById('receb-id').value                = id
    document.getElementById('receb-nome-valvula').textContent = v.nome
    document.getElementById('receb-responsavel').value       = ''
    document.getElementById('receb-observacoes').value       = ''
    document.getElementById('erro-recebimento').textContent  = ''

    // Data/hora atual no fuso local como valor padrão
    const agora = new Date()
    const offset = agora.getTimezoneOffset() * 60000
    const local  = new Date(agora - offset).toISOString().slice(0, 16)
    document.getElementById('receb-data').value = local

    document.getElementById('modal-recebimento').classList.remove('hidden')
    setTimeout(() => document.getElementById('receb-responsavel').focus(), 50)
}

async function confirmarRecebimento(e) {
    e.preventDefault()
    const erroEl = document.getElementById('erro-recebimento')
    erroEl.textContent = ''

    const responsavel = document.getElementById('receb-responsavel').value.trim()
    if (!responsavel) {
        erroEl.textContent = 'Informe o nome do responsável pelo recebimento.'
        return
    }

    const id          = document.getElementById('receb-id').value
    const observacoes = document.getElementById('receb-observacoes').value.trim() || null
    const dataInput   = document.getElementById('receb-data').value
    const dataReceb   = dataInput ? new Date(dataInput).toISOString() : new Date().toISOString()

    // Atualizar status da válvula para "Em manutenção" e registrar quem recebeu
    const { error } = await supabase.from('valvulas').update({
        status:                     'Em manutenção',
        recebido_por:               responsavel,
        retirada_por:               null,
        retirada_assinatura_base64: null,
        retirada_data:              null,
    }).eq('id', id)

    if (error) {
        erroEl.textContent = error.message
        return
    }

    // Registrar no histórico com a data informada
    const { error: erroHist } = await supabase.from('historico_valvulas').insert({
        valvula_id:  id,
        tipo_evento: 'recebimento',
        descricao:   'Recebida na oficina',
        responsavel: responsavel,
        observacoes: observacoes,
        criado_em:   dataReceb,
    })

    if (erroHist) {
        erroEl.textContent = erroHist.message
        return
    }

    document.getElementById('modal-recebimento').classList.add('hidden')
    await carregarValvulas()
}


// ============================================================
// MODAL: HISTÓRICO DA VÁLVULA
// ============================================================
async function abrirModalHistorico(id) {
    const v = valvulasMapa[id]
    if (!v) return

    document.getElementById('hist-nome-valvula').textContent = v.nome
    document.getElementById('hist-lista').innerHTML =
        '<p class="text-[10px] tracking-widest text-[#388e3c] uppercase py-4">Carregando...</p>'

    document.getElementById('modal-historico').classList.remove('hidden')

    const { data, error } = await supabase
        .from('historico_valvulas')
        .select('*')
        .eq('valvula_id', id)
        .order('criado_em', { ascending: false })

    const lista = document.getElementById('hist-lista')

    if (error) {
        lista.innerHTML = `<p class="text-red-500/60 text-xs py-4">${error.message}</p>`
        return
    }

    if (!data || data.length === 0) {
        lista.innerHTML = '<p class="text-[10px] tracking-widest text-[#388e3c] uppercase py-4">Nenhum registro no histórico ainda.</p>'
        return
    }

    lista.innerHTML = data.map(renderEntradaHistorico).join('')
}

function renderEntradaHistorico(h) {
    const icones = {
        recebimento:    `<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 14l-7 7m0 0l-7-7m7 7V3"/></svg>`,
        mudanca_status: `<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>`,
        retirada:       `<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 10l7-7m0 0l7 7m-7-7v18"/></svg>`,
        edicao:         `<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>`,
    }

    const icone = icones[h.tipo_evento] || icones.edicao
    const data  = new Date(h.criado_em).toLocaleString('pt-BR')

    return `
        <div class="flex gap-3 py-3 border-b border-[#a5d6a7] last:border-0">
            <div class="shrink-0 w-6 h-6 bg-[#c8e6c9] border border-[#66bb6a] rounded-full flex items-center justify-center text-[#2e7d32]">
                ${icone}
            </div>
            <div class="flex-1 min-w-0">
                <div class="flex items-start justify-between gap-2 flex-wrap">
                    <p class="text-[#1b5e20] text-xs">${h.descricao || h.tipo_evento}</p>
                    <p class="text-[9px] text-[#4caf50] tracking-wider shrink-0">${data}</p>
                </div>
                ${h.responsavel ? `<p class="text-[10px] text-[#388e3c] mt-0.5 tracking-wider">Por: ${h.responsavel}</p>` : ''}
                ${h.status_anterior && h.status_novo ? `<p class="text-[10px] text-[#388e3c] mt-0.5">${h.status_anterior} → ${h.status_novo}</p>` : ''}
                ${h.observacoes ? `<p class="text-[10px] text-[#4caf50] italic mt-0.5">${h.observacoes}</p>` : ''}
            </div>
        </div>
    `
}


// ============================================================
// MODAL: EXCLUIR VÁLVULA
// ============================================================
function abrirModalExcluir(id) {
    const v = valvulasMapa[id]
    if (!v) return

    document.getElementById('excluir-id').value                = id
    document.getElementById('excluir-nome-valvula').textContent = v.nome
    document.getElementById('excluir-senha').value             = ''
    document.getElementById('erro-excluir').textContent        = ''

    document.getElementById('modal-excluir').classList.remove('hidden')
    setTimeout(() => document.getElementById('excluir-senha').focus(), 50)
}

async function confirmarExclusao(e) {
    e.preventDefault()
    const erroEl = document.getElementById('erro-excluir')
    erroEl.textContent = ''

    const senha = document.getElementById('excluir-senha').value
    if (senha !== SENHA_EXCLUSAO) {
        erroEl.textContent = 'Senha incorreta.'
        document.getElementById('excluir-senha').value = ''
        setTimeout(() => document.getElementById('excluir-senha').focus(), 50)
        return
    }

    const id = document.getElementById('excluir-id').value

    const { error } = await supabase.from('valvulas').delete().eq('id', id)

    if (error) {
        erroEl.textContent = error.message
        return
    }

    document.getElementById('modal-excluir').classList.add('hidden')
    await carregarValvulas()
}


// ============================================================
// CANVAS DE ASSINATURA
// ============================================================
function configurarCanvas() {
    canvas.addEventListener('mousedown', e => {
        desenhando = true
        const [x, y] = posicaoNoCanvas(e)
        ctx.beginPath()
        ctx.moveTo(x, y)
    })

    canvas.addEventListener('mousemove', e => {
        if (!desenhando) return
        const [x, y] = posicaoNoCanvas(e)
        ctx.lineTo(x, y)
        ctx.stroke()
    })

    canvas.addEventListener('mouseup',    () => { desenhando = false })
    canvas.addEventListener('mouseleave', () => { desenhando = false })

    canvas.addEventListener('touchstart', e => {
        e.preventDefault()
        desenhando = true
        const [x, y] = posicaoNoCanvas(e.touches[0])
        ctx.beginPath()
        ctx.moveTo(x, y)
    }, { passive: false })

    canvas.addEventListener('touchmove', e => {
        e.preventDefault()
        if (!desenhando) return
        const [x, y] = posicaoNoCanvas(e.touches[0])
        ctx.lineTo(x, y)
        ctx.stroke()
    }, { passive: false })

    canvas.addEventListener('touchend', () => { desenhando = false })
}

function posicaoNoCanvas(e) {
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width  / rect.width
    const scaleY = canvas.height / rect.height
    return [
        (e.clientX - rect.left) * scaleX,
        (e.clientY - rect.top)  * scaleY,
    ]
}

function ajustarDimensoesCanvas() {
    const largura = canvas.parentElement.clientWidth || 300
    canvas.width  = largura
    canvas.height = 150
    aplicarEstiloLinha()
}

function aplicarEstiloLinha() {
    ctx.strokeStyle = '#166534'
    ctx.lineWidth   = 2
    ctx.lineCap     = 'round'
    ctx.lineJoin    = 'round'
}

function limparCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    aplicarEstiloLinha()
}
