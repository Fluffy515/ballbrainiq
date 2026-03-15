const { createClient } = supabase;

window.BB_Supabase = createClient(
  window.BB_CONFIG.supabaseUrl,
  window.BB_CONFIG.supabaseAnonKey
);
