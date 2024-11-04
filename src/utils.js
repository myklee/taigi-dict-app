// src/utils.js
import Papa from 'papaparse';
import db from './db';

export async function insertWord(word, definition) {
  await db.words.add({ word, definition });
}

// You can add words manually or import from a file
// insertWord('apple', 'A fruit');
// insertWord('banana', 'A yellow fruit');

// src/utils.js
export async function searchWord(term) {
    // Query words where the 'word' field starts with the search term
    const results = await db.words
      .where('english')
      .startsWithIgnoreCase(term)
      .toArray();
    return results;
  }

  // Function to handle CSV file input and parse it
export function importCSVFile(file) {
    return new Promise((resolve, reject) => {
      // Parse CSV file using PapaParse
      Papa.parse(file, {
        header: true,  // Assume the CSV has headers like 'word' and 'definition'
        skipEmptyLines: true,
        complete: function (results) {
          // results.data is an array of objects, where each object is a row from the CSV
          resolve(results.data);
        },
        error: function (error) {
          reject(error);
        }
      });
    });
  }
  
  // Function to save the parsed data into IndexedDB
  export async function saveWordsToDB(wordsArray) {
    await db.words.bulkAdd(wordsArray);
  }
  export async function saveDefinitionsToDB(defArray) {
    await db.definitons.bulkAdd(defArray);
  }

 