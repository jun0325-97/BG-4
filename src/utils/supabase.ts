import { createClient } from "@supabase/supabase-js";

// 환경 변수 설정 전에는 에러가 날 수 있으므로 기본값 처리 또는 throw 처리
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "YOUR_SUPABASE_URL";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "YOUR_SUPABASE_ANON_KEY";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
