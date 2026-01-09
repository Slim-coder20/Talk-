import { createClient } from "@supabase/supabase-js"; 

// Create a new supabase client with the supabase url and anon key // 
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string; 

// Create a new supabase client // 
export const supabase = createClient(supabaseUrl, supabaseAnonKey);