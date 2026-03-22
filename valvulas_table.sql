-- Execute este SQL no Supabase: Dashboard → SQL Editor → New query

CREATE TABLE IF NOT EXISTS valvulas (
    id                          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    nome                        text        NOT NULL,
    marca                       text,
    polegada                    text,
    tipo                        text,                            -- 'Borboleta' | 'Esfera'
    setor                       text,                            -- 'Massa A' | 'Massa B' | 'Fermentação' | 'TRCA' | 'Moenda'
    status                      text        DEFAULT 'Em manutenção', -- 'Em manutenção' | 'Pronta' | 'Substituída' | 'Descartada'
    observacoes                 text,
    retirada_por                text,                            -- nome de quem retirou
    retirada_assinatura_base64  text,                            -- PNG em base64 da assinatura
    retirada_data               timestamptz,                     -- data/hora da retirada
    criado_em                   timestamptz DEFAULT now()
);

-- Habilitar Row Level Security (recomendado)
ALTER TABLE valvulas ENABLE ROW LEVEL SECURITY;

-- Política: acesso público de leitura e escrita (ajuste conforme sua auth)
CREATE POLICY "acesso_publico" ON valvulas
    FOR ALL
    USING (true)
    WITH CHECK (true);


-- ============================================================
-- TABELA DE HISTÓRICO DAS VÁLVULAS
-- Execute esta parte em uma nova query se a tabela valvulas já existir
-- ============================================================

CREATE TABLE IF NOT EXISTS historico_valvulas (
    id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    valvula_id      uuid        REFERENCES valvulas(id) ON DELETE CASCADE,
    tipo_evento     text        NOT NULL, -- 'recebimento' | 'mudanca_status' | 'retirada' | 'edicao'
    descricao       text,                 -- resumo legível do evento
    responsavel     text,                 -- quem executou a ação
    status_anterior text,                 -- status antes da mudança (mudanca_status)
    status_novo     text,                 -- status após a mudança (mudanca_status)
    observacoes     text,                 -- estado de chegada (recebimento)
    criado_em       timestamptz DEFAULT now()
);

-- Habilitar Row Level Security
ALTER TABLE historico_valvulas ENABLE ROW LEVEL SECURITY;

-- Política: acesso público de leitura e escrita
CREATE POLICY "acesso_publico_historico" ON historico_valvulas
    FOR ALL
    USING (true)
    WITH CHECK (true);
