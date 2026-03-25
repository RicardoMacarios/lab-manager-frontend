import { supabase } from '../supabase.js'

const params = new URLSearchParams(window.location.search)
const MARCA = params.get('marca') || ''

let sedesMapa = {}
let todasSedes = []

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('titulo-marca').textContent  = MARCA
    document.getElementById('label-marca').textContent   = `Marca: ${MARCA}`
    document.getElementById('bread-marca').textContent   = MARCA
    document.title = `V-Manager | Sedes · ${MARCA}`

    carregarSedes()
    vincularEventos()
})

// ============================================================
// CARREGAR E RENDERIZAR
// ============================================================
async function carregarSedes() {
    const lista = document.getElementById('lista-sedes')
    lista.innerHTML = '<p class="text-[10px] tracking-widest text-[#388e3c] uppercase col-span-full py-4">Carregando...</p>'

    const { data, error } = await supabase
        .from('sedes_estoque')
        .select('*')
        .eq('marca', MARCA)
        .order('polegada', { ascending: true })

    if (error) {
        lista.innerHTML = `<p class="text-red-500/60 text-xs py-4">${error.message}</p>`
        return
    }

    sedesMapa = {}
    data.forEach(s => { sedesMapa[s.id] = s })
    todasSedes = data

    const totalEstoque = data.reduce((acc, s) => acc + (s.quantidade || 0), 0)
    const critico      = data.filter(s => s.quantidade <= 5).length
    document.getElementById('stat-total-sedes').textContent   = data.length
    document.getElementById('stat-total-estoque').textContent = totalEstoque
    document.getElementById('stat-critico').textContent       = critico

    renderizarLista()
}

function renderizarLista() {
    const lista = document.getElementById('lista-sedes')
    const termo = (document.getElementById('campo-busca')?.value || '').toLowerCase().trim()

    let resultado = todasSedes

    if (termo) {
        resultado = resultado.filter(s =>
            s.polegada?.toLowerCase().includes(termo)
        )
    }

    if (resultado.length === 0) {
        lista.innerHTML = '<p class="text-[10px] tracking-widest text-[#388e3c] uppercase col-span-full py-4">Nenhuma sede cadastrada</p>'
        return
    }

    lista.innerHTML = resultado.map(renderCard).join('')

    lista.querySelectorAll('.btn-entrada').forEach(btn => {
        btn.addEventListener('click', () => abrirModalMovimento(btn.dataset.id, 'entrada'))
    })

    lista.querySelectorAll('.btn-saida').forEach(btn => {
        btn.addEventListener('click', () => abrirModalMovimento(btn.dataset.id, 'saida'))
    })
}

const MAX_ESTOQUE = 30

function statusSede(qtd) {
    if (qtd <= 5)  return 'critico'
    if (qtd <= 15) return 'baixo'
    return 'normal'
}

function labelStatus(status) {
    if (status === 'critico') return '<span class="status-tag status-critico">● Crítico</span>'
    if (status === 'baixo')   return '<span class="status-tag status-baixo">● Baixo</span>'
    return                           '<span class="status-tag status-normal">● Normal</span>'
}

function renderCard(s) {
    const status  = statusSede(s.quantidade)
    const pct     = Math.min(Math.round((s.quantidade / MAX_ESTOQUE) * 100), 100)

    return `
        <div class="sede-card">
            <div class="sede-card-header">
                <div class="sede-card-header-left">
                    <span class="sede-meta-label">Sede · ${MARCA}</span>
                    <span class="sede-polegada">${s.polegada}</span>
                </div>
                ${labelStatus(status)}
            </div>
            <div class="sede-card-body">
                <div class="estoque-linha">
                    <span class="estoque-label">Em estoque</span>
                    <span class="estoque-valor ${status}">${s.quantidade}</span>
                </div>
                <div class="progress-track" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100">
                    <div class="progress-fill ${status}" style="width:${pct}%"></div>
                </div>
                <div class="card-acoes">
                    <button class="btn-entrada" data-id="${s.id}">＋ Entrada</button>
                    <button class="btn-saida"   data-id="${s.id}">− Saída</button>
                </div>
            </div>
        </div>
    `
}


// ============================================================
// VINCULAR EVENTOS
// ============================================================
function vincularEventos() {
    document.getElementById('campo-busca').addEventListener('input', renderizarLista)

    document.getElementById('btn-cadastrar').addEventListener('click', () => {
        document.getElementById('form-cadastro').reset()
        document.getElementById('erro-cadastro').textContent = ''
        document.getElementById('modal-cadastro').classList.remove('hidden')
        setTimeout(() => document.getElementById('cad-polegada').focus(), 50)
    })

    document.getElementById('btn-fechar-cadastro').addEventListener('click', () => {
        document.getElementById('modal-cadastro').classList.add('hidden')
    })

    document.getElementById('form-cadastro').addEventListener('submit', salvarCadastro)

    document.getElementById('btn-fechar-edicao').addEventListener('click', () => {
        document.getElementById('modal-edicao').classList.add('hidden')
    })

    document.getElementById('form-edicao').addEventListener('submit', salvarMovimento)

    document.querySelectorAll('.fixed').forEach(overlay => {
        overlay.addEventListener('click', e => {
            if (e.target === overlay) overlay.classList.add('hidden')
        })
    })
}


// ============================================================
// MODAL: CADASTRO
// ============================================================
async function salvarCadastro(e) {
    e.preventDefault()
    const erroEl = document.getElementById('erro-cadastro')
    erroEl.textContent = ''

    const polegada = document.getElementById('cad-polegada').value.trim()
    const qtd      = parseInt(document.getElementById('cad-quantidade').value) || 0

    if (!polegada) { erroEl.textContent = 'Informe a polegada.'; return }

    const { data: existe } = await supabase
        .from('sedes_estoque')
        .select('id')
        .eq('marca', MARCA)
        .ilike('polegada', polegada)
        .maybeSingle()

    if (existe) {
        erroEl.textContent = 'Já existe uma sede com essa polegada para esta marca.'
        return
    }

    const { error } = await supabase.from('sedes_estoque').insert({
        marca: MARCA,
        polegada,
        quantidade: qtd,
    })

    if (error) { erroEl.textContent = error.message; return }

    document.getElementById('modal-cadastro').classList.add('hidden')
    await carregarSedes()
}


// ============================================================
// MODAL: ENTRADA / SAÍDA DE ESTOQUE
// ============================================================
function abrirModalMovimento(id, modo) {
    const s = sedesMapa[id]
    if (!s) return

    document.getElementById('edit-id').value              = id
    document.getElementById('edit-modo').value            = modo
    document.getElementById('edit-nome-sede').textContent = s.polegada
    document.getElementById('edit-qtd-atual').textContent = s.quantidade
    document.getElementById('edit-quantidade').value      = ''
    document.getElementById('erro-edicao').textContent    = ''

    const titulo = document.getElementById('edit-titulo')
    const label  = document.getElementById('edit-label')
    const btn    = document.getElementById('edit-btn-submit')

    if (modo === 'entrada') {
        titulo.textContent = 'Entrada de Estoque'
        label.textContent  = 'Quantidade que chegou *'
        btn.textContent    = 'Confirmar Entrada'
        btn.className      = 'w-full text-[10px] tracking-widest uppercase border border-[#388e3c] text-[#1b5e20] py-2.5 hover:bg-[#a5d6a7] transition-all cursor-pointer'
    } else {
        titulo.textContent = 'Saída de Estoque'
        label.textContent  = 'Quantidade utilizada *'
        btn.textContent    = 'Confirmar Saída'
        btn.className      = 'w-full text-[10px] tracking-widest uppercase border border-red-400 text-red-600 py-2.5 hover:bg-red-50 transition-all cursor-pointer'
    }

    document.getElementById('modal-edicao').classList.remove('hidden')
    setTimeout(() => document.getElementById('edit-quantidade').focus(), 50)
}

async function salvarMovimento(e) {
    e.preventDefault()
    const erroEl = document.getElementById('erro-edicao')
    erroEl.textContent = ''

    const id       = document.getElementById('edit-id').value
    const modo     = document.getElementById('edit-modo').value
    const qtd      = parseInt(document.getElementById('edit-quantidade').value)

    if (!qtd || qtd < 1) {
        erroEl.textContent = 'Informe a quantidade (mínimo 1).'
        return
    }

    const qtdAtual = sedesMapa[id].quantidade

    if (modo === 'saida' && qtd > qtdAtual) {
        erroEl.textContent = `Estoque insuficiente. Disponível: ${qtdAtual}.`
        return
    }

    const novaQtd = modo === 'entrada' ? qtdAtual + qtd : qtdAtual - qtd

    const { error } = await supabase
        .from('sedes_estoque')
        .update({ quantidade: novaQtd })
        .eq('id', id)

    if (error) { erroEl.textContent = error.message; return }

    document.getElementById('modal-edicao').classList.add('hidden')
    await carregarSedes()
}
