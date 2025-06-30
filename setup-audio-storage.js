// setup-audio-storage.js
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = 'https://oqwvljqwtearyepyaslo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xd3ZsanF3dGVhcnllcHlhc2xvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzEwODA1NjIsImV4cCI6MjA0NjY1NjU2Mn0.31HmSCfXawvkzhevPCaKWoVCZyD_elcQOCtgFWJMRKI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupAudioStorage() {
  try {
    console.log('Setting up audio storage...');

    // Try to access the audio-files bucket directly
    const { data: files, error: bucketError } = await supabase.storage
      .from('audio-files')
      .list();
    
    if (bucketError) {
      console.error('Error accessing audio-files bucket:', bucketError);
      console.log('Please make sure the audio-files bucket exists and is public in your Supabase dashboard.');
      return;
    }

    console.log('Audio-files bucket is accessible. Found files:', files.length);
    console.log('Proceeding with upload...');

    // Upload audio files
    await uploadAudioFiles();

  } catch (error) {
    console.error('Error setting up audio storage:', error);
  }
}

async function uploadAudioFiles() {
  const audioDir = './public/src/assets/audio_taigi';
  
  if (!fs.existsSync(audioDir)) {
    console.error('Audio directory not found:', audioDir);
    return;
  }

  console.log('Starting audio file upload...');
  
  const folders = fs.readdirSync(audioDir).filter(item => 
    fs.statSync(path.join(audioDir, item)).isDirectory()
  );

  let totalFiles = 0;
  let uploadedFiles = 0;

  // Count total files first
  for (const folder of folders) {
    const folderPath = path.join(audioDir, folder);
    const files = fs.readdirSync(folderPath).filter(file => file.endsWith('.mp3'));
    totalFiles += files.length;
  }

  console.log(`Found ${totalFiles} audio files to upload...`);

  // Upload files
  for (const folder of folders) {
    const folderPath = path.join(audioDir, folder);
    const files = fs.readdirSync(folderPath).filter(file => file.endsWith('.mp3'));

    for (const file of files) {
      try {
        const filePath = path.join(folderPath, file);
        const fileBuffer = fs.readFileSync(filePath);
        const storagePath = `${folder}/${file}`;

        console.log(`Uploading ${storagePath}...`);

        const { data, error } = await supabase.storage
          .from('audio-files')
          .upload(storagePath, fileBuffer, {
            contentType: 'audio/mpeg',
            upsert: true // Overwrite if exists
          });

        if (error) {
          console.error(`Error uploading ${storagePath}:`, error);
        } else {
          uploadedFiles++;
          console.log(`✓ Uploaded ${storagePath} (${uploadedFiles}/${totalFiles})`);
        }

        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`Error processing ${file}:`, error);
      }
    }
  }

  console.log(`\nUpload complete! ${uploadedFiles}/${totalFiles} files uploaded successfully.`);
  
  // Test getting a public URL
  const { data: urlData } = supabase.storage
    .from('audio-files')
    .getPublicUrl('0/1000(1).mp3');
  
  console.log('\nTest public URL:', urlData.publicUrl);
}

// Run the setup
setupAudioStorage().catch(console.error); 