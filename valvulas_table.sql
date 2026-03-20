-- Execute este SQL no Supabase: Dashboard → SQL Editor → New query

CREATE TABLE IF NOT EXISTS valvulas (
    id                          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    nome                        text        NOT NULL,
    marca                       text,
    polegada                    text,
    tipo                        text,                        -- 'Borboleta' | 'Esfera'
    setor                       text,                        -- 'Massa A' | 'Massa B' | 'Fermentação' | 'TRCA' | 'Moenda'
    status                      text        DEFAULT 'Normal', -- 'Normal' | 'Manutenção' | 'Inativa'
    observacoes                 text,
    retirada_por                text,                        -- nome de quem retirou
    retirada_assinatura_base64  text,                        -- PNG em base64 da assinatura
    retirada_data               timestamptz,                 -- data/hora da retirada
    criado_em                   timestamptz DEFAULT now()
);

-- Habilitar Row Level Security (recomendado)
ALTER TABLE valvulas ENABLE ROW LEVEL SECURITY;

-- Política: acesso público de leitura e escrita (ajuste conforme sua auth)
CREATE POLICY "acesso_publico" ON valvulas
    FOR ALL
    USING (true)
    WITH CHECK (true);
