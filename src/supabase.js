// src/supabase.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://oqwvljqwtearyepyaslo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xd3ZsanF3dGVhcnllcHlhc2xvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzEwODA1NjIsImV4cCI6MjA0NjY1NjU2Mn0.31HmSCfXawvkzhevPCaKWoVCZyD_elcQOCtgFWJMRKI';

export const supabase = createClient(supabaseUrl, supabaseKey);
