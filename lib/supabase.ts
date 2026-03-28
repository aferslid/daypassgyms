import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://ffcpucpunnsjdhxxwwae.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmY3B1Y3B1bm5zamRoeHh3d2FlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1NTU2MTEsImV4cCI6MjA5MDEzMTYxMX0.JzJysmYKed0JrQGhaSXzsUPF9lzTOPi5xNchY16lRdw";

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);