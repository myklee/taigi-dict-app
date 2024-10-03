<!-- src/components/CSVUploader.vue -->
<template>
    <div>
      <input type="file" @change="handleFileUpload" accept=".csv" />
      <p v-if="statusMessage">{{ statusMessage }}</p>
    </div>
  </template>
  
  <script>
  import { importCSVFile, saveWordsToDB } from '@/utils';
  
  export default {
    data() {
      return {
        statusMessage: ''
      };
    },
    methods: {
      async handleFileUpload(event) {
        const file = event.target.files[0];
  
        if (!file) {
          this.statusMessage = 'Please select a CSV file to upload.';
          return;
        }
  
        try {
          // Parse the CSV file
          const parsedData = await importCSVFile(file);
  
          // Insert the parsed data into IndexedDB
          await saveWordsToDB(parsedData);
  
          this.statusMessage = 'CSV file imported successfully!';
        } catch (error) {
          this.statusMessage = 'Error importing CSV: ' + error.message;
        }
      }
    }
  };
  </script>
  