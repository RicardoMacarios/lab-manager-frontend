import { supabase } from '../supabase.js'

// ---- Parâmetros da URL ----
const params = new URLSearchParams(window.location.search)
const TIPO = params.get('tipo') || ''
const SETOR = params.get('setor') || ''

// ---- Mapa de válvulas em memória (id → objeto) ----
let valvulasMapa = {}

// ---- Lista completa para filtragem client-side ----
let todasValvulas = []

// ---- Referências ao canvas ----
const canvas = document.getElementById('canvas-assinatura')
const ctx = canvas.getContext('2d')
let desenhando = false


// ============================================================
// INICIALIZAÇÃO
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    // Preencher cabeçalho com dados da URL
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

    // Atualizar mapa e lista em memória
    valvulasMapa = {}
    data.forEach(v => { valvulasMapa[v.id] = v })
    todasValvulas = data

    // Atualizar painel de resumo
    const entregues = data.filter(v => !!v.retirada_por).length
    document.getElementById('stat-total').textContent     = data.length
    document.getElementById('stat-entregues').textContent = entregues
    document.getElementById('stat-faltam').textContent    = data.length - entregues

    if (data.length === 0) {
        lista.innerHTML = '<p class="text-slate-700 text-[10px] tracking-widest uppercase col-span-full py-4">Nenhuma válvula cadastrada</p>'
        return
    }

    // Renderizar respeitando filtro de busca ativo
    renderizarLista()
}

// Filtra e renderiza a lista conforme o termo de busca atual
function renderizarLista() {
    const lista = document.getElementById('lista-valvulas')
    const termo = (document.getElementById('campo-busca')?.value || '').toLowerCase().trim()

    const resultado = termo
        ? todasValvulas.filter(v =>
            [v.nome, v.marca, v.polegada, v.observacoes]
                .filter(Boolean)
                .some(campo => campo.toLowerCase().includes(termo))
          )
        : todasValvulas

    if (resultado.length === 0) {
        lista.innerHTML = '<p class="text-slate-700 text-[10px] tracking-widest uppercase col-span-full py-4">Nenhuma válvula encontrada</p>'
        return
    }

    lista.innerHTML = resultado.map(renderCard).join('')
}

// Retorna as classes do badge de acordo com o status
function classesBadge(status) {
    if (status === 'Normal')     return 'bg-[#a5d6a7] text-[#1b5e20] border-[#4caf50]'
    if (status === 'Manutenção') return 'bg-yellow-100 text-yellow-800 border-yellow-500'
    return                               'bg-red-100   text-red-700   border-red-400'
}

// Monta o HTML de um card de válvula
function renderCard(v) {
    const infoSecundaria = [v.marca, v.polegada].filter(Boolean).join(' · ')

    // Ação de retirada: se já retirada mostra quem retirou + ícone; senão, botão de registrar
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
                </div>
                <span class="inline-block shrink-0 px-2 py-0.5 text-[9px] tracking-widest uppercase border rounded-full ${classesBadge(v.status)}">
                    ${v.status}
                </span>
            </div>
            <div class="flex items-center justify-between gap-2 flex-wrap pt-2 border-t border-[#a5d6a7]">
                ${acaoRetirada}
                <button class="btn-editar text-[10px] tracking-widest uppercase border border-[#66bb6a] text-[#2e7d32] px-3 py-1 hover:bg-[#a5d6a7] transition-all cursor-pointer" data-id="${v.id}">
                    Editar
                </button>
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

        if (btnEditar)     abrirModalEdicao(btnEditar.dataset.id)
        if (btnRetirar)    abrirModalRetirada(btnRetirar.dataset.id)
        if (btnAssinatura) abrirModalAssinatura(btnAssinatura.dataset.id)
    })

    // Fechar modais ao clicar no overlay (fora da caixa)
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', e => {
            if (e.target === overlay) overlay.classList.add('hidden')
        })
    })

    // ---- Busca em tempo real ----
    document.getElementById('campo-busca').addEventListener('input', renderizarLista)

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

    const { error } = await supabase.from('valvulas').insert({
        nome,
        marca:       document.getElementById('cad-marca').value.trim()       || null,
        polegada:    document.getElementById('cad-polegada').value.trim()    || null,
        status:      document.getElementById('cad-status').value,
        observacoes: document.getElementById('cad-observacoes').value.trim() || null,
        tipo:  TIPO,
        setor: SETOR,
    })

    if (error) {
        erroEl.textContent = error.message
        return
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

    document.getElementById('edit-id').value          = id
    document.getElementById('edit-status').value      = v.status
    document.getElementById('edit-observacoes').value = v.observacoes || ''
    document.getElementById('erro-edicao').textContent = ''

    document.getElementById('modal-edicao').classList.remove('hidden')
}

async function salvarEdicao(e) {
    e.preventDefault()
    const erroEl = document.getElementById('erro-edicao')
    erroEl.textContent = ''

    const id = document.getElementById('edit-id').value

    const { error } = await supabase.from('valvulas').update({
        status:      document.getElementById('edit-status').value,
        observacoes: document.getElementById('edit-observacoes').value.trim() || null,
    }).eq('id', id)

    if (error) {
        erroEl.textContent = error.message
        return
    }

    document.getElementById('modal-edicao').classList.add('hidden')
    await carregarValvulas()
}


// ============================================================
// MODAL: RETIRADA COM ASSINATURA
// ============================================================
function abrirModalRetirada(id) {
    document.getElementById('retirada-id').value       = id
    document.getElementById('retirada-nome').value     = ''
    document.getElementById('erro-retirada').textContent = ''

    document.getElementById('modal-retirada').classList.remove('hidden')

    // Ajustar canvas após o modal ficar visível (layout precisa estar renderizado)
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

    // Verificar se algo foi desenhado no canvas
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const temDesenho = Array.from(imageData.data).some((val, i) => i % 4 === 3 && val > 0)
    if (!temDesenho) {
        erroEl.textContent = 'Por favor, assine no campo de assinatura.'
        return
    }

    const assinaturaBase64 = canvas.toDataURL('image/png')
    const id = document.getElementById('retirada-id').value

    const { error } = await supabase.from('valvulas').update({
        retirada_por:               nome,
        retirada_assinatura_base64: assinaturaBase64,
        retirada_data:              new Date().toISOString(),
        status:                     'Manutenção',
    }).eq('id', id)

    if (error) {
        erroEl.textContent = error.message
        return
    }

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
// CANVAS DE ASSINATURA
// ============================================================
function configurarCanvas() {
    // Eventos de mouse (desktop)
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

    // Eventos de toque (mobile)
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

// Converte coordenadas do evento para coordenadas internas do canvas
function posicaoNoCanvas(e) {
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width  / rect.width
    const scaleY = canvas.height / rect.height
    return [
        (e.clientX - rect.left) * scaleX,
        (e.clientY - rect.top)  * scaleY,
    ]
}

// Ajusta o atributo width/height do canvas para corresponder ao tamanho CSS
function ajustarDimensoesCanvas() {
    const largura = canvas.parentElement.clientWidth || 300
    canvas.width  = largura
    canvas.height = 150
    aplicarEstiloLinha()
}

function aplicarEstiloLinha() {
    ctx.strokeStyle = '#166534'  // green-800
    ctx.lineWidth   = 2
    ctx.lineCap     = 'round'
    ctx.lineJoin    = 'round'
}

function limparCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    aplicarEstiloLinha()
}
