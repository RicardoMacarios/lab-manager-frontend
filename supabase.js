// Importamos o Supabase diretamente via CDN
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// Substitua com os dados copiados no Passo 1
const supabaseUrl = 'https://rgiafsciucuujaractcv.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJnaWFmc2NpdWN1dWphcmFjdGN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3ODc3MDMsImV4cCI6MjA4OTM2MzcwM30.16LeP7D-viRYQlw_jBynPWIX_sDCdzpZwJm2roEhJX8'

// Criamos e exportamos a conexão para usar nas outras telas
export const supabase = createClient(supabaseUrl, supabaseKey)