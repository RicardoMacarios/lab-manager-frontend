// Importamos o Supabase diretamente via CDN
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'
import { SUPABASE_URL, SUPABASE_KEY } from './config.js'

// Criamos e exportamos a conexão para usar nas outras telas
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)