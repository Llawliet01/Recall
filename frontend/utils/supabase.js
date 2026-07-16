import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://avkwaxjnydfxlnavhiis.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2a3dheGpueWRmeGxuYXZoaWlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4NDc5NTAsImV4cCI6MjA5OTQyMzk1MH0.R9G3WD64REk1soBuuolPZXn4IAPs3k20wL_FEjz4rFI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
