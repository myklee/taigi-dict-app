// test-buckets.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://oqwvljqwtearyepyaslo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xd3ZsanF3dGVhcnllcHlhc2xvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzEwODA1NjIsImV4cCI6MjA0NjY1NjU2Mn0.31HmSCfXawvkzhevPCaKWoVCZyD_elcQOCtgFWJMRKI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testBuckets() {
  try {
    console.log('Testing Supabase storage buckets...');
    
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('Error listing buckets:', error);
      return;
    }
    
    console.log('Available buckets:', buckets);
    console.log('Bucket names:', buckets.map(b => b.name));
    
    // Try to list files in audio-files bucket
    const { data: files, error: filesError } = await supabase.storage
      .from('audio-files')
      .list();
    
    if (filesError) {
      console.error('Error listing files in audio-files bucket:', filesError);
    } else {
      console.log('Files in audio-files bucket:', files);
    }
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

testBuckets(); 