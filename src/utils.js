// src/utils.js
import Papa from "papaparse";
import db from "./db";

export async function insertWord(word, definition) {
  await db.words.add({ word, definition });
}

// You can add words manually or import from a file
// insertWord('apple', 'A fruit');
// insertWord('banana', 'A yellow fruit');

// src/utils.js
export async function searchWord(term, exact) {
  // Query words where the 'word' field starts with the search term
  let engResults = [];
  let chResults = [];

  if (!exact) {
    const allWords = await db.words.toArray();
    console.log(allWords.filter((word) => word.english.length > 15));
    // Filter entries where the chinese field contains the specified term
    chResults = allWords.filter((word) => word.chinese.includes(term));
    engResults = allWords.filter((word) => {
      return typeof word.english === 'string' && word.english.indexOf(term) !== -1;
    });
    // console.log(engResults);
  } else {
    engResults = await db.words.where("english").equals(term).toArray();
    chResults = await db.words.where("chinese").equals(term).toArray();
  }

  const wordResults = [...engResults, ...chResults].reduce((acc, current) => {
    const x = acc.find((item) => item.id === current.id);
    if (!x) {
      acc.push(current);
    }
    return acc;
  }, []);

  // Get all IDs from wordResults
  const wordIds = wordResults.map((word) => word.id);

  // Fetch corresponding definitions from `definitions` store based on IDs
  const definitionsResults = await db.definitions
    .where("wordid")
    .anyOf(wordIds)
    .toArray();

  // Group definitions by each word's `id`
  const groupedResults = wordResults.map((word) => {
    const english_definitions = definitionsResults
      .filter((def) => def.wordid === word.id)
      .map((def) => def.def_english); // Extract just the definition text
    const chinese_definitions = definitionsResults
      .filter((def) => def.wordid === word.id)
      .map((def) => def.def_chinese); // Extract just the definition text

    return {
      word: word,
      english_definitions: english_definitions.length
        ? english_definitions
        : [],
      chinese_definitions: chinese_definitions.length
        ? chinese_definitions
        : [],
    };
  });
  console.log(groupedResults);
  return groupedResults;
}

// Function to handle CSV file input and parse it
export function importCSVFile(file) {
  return new Promise((resolve, reject) => {
    // Parse CSV file using PapaParse
    Papa.parse(file, {
      header: true, // Assume the CSV has headers like 'word' and 'definition'
      skipEmptyLines: true,
      complete: function (results) {
        // results.data is an array of objects, where each object is a row from the CSV
        resolve(results.data);
      },
      error: function (error) {
        reject(error);
      },
    });
  });
}

// Function to save the parsed data into IndexedDB
export async function saveWordsToDB(wordsArray) {
  console.log(wordsArray);
  await db.words.bulkAdd(wordsArray);
}
export async function saveDefinitionsToDB(defArray) {
  console.log(`Data to add to :`, defArray);
  await db.definitions.bulkAdd(defArray);
}

// Function to check if IndexedDB has data

export async function hasDataInDatabase() {
  const [entriesCount, definitionsCount] = await Promise.all([
    db.entries.count(),
    db.definitions.count(),
  ]);

  return entriesCount > 0 || definitionsCount > 0; // True if either table has data
}

// function to upload entries
export async function uploadEntries() {
  try {
    // Step 1: Fetch the CSV file from the assets folder
    const words = await fetch("./src/assets/taigiwords.csv"); // Adjust path based on actual file location in your public folder
    const csvWordsText = await words.text();
    const definitions = await fetch("./src/assets/taigidefs.csv"); // Adjust path based on actual file location in your public folder
    const csvDefsText = await definitions.text();

    // Step 2: Parse the CSV text using PapaParse
    Papa.parse(csvWordsText, {
      header: true, // Assuming CSV has headers (column names)
      dynamicTyping: true, // Automatically converts numbers and booleans
      complete: async (result) => {
        console.log("CSV Data:", result.data);

        // Step 3: Save the parsed data to IndexedDB using Dexie
        const words = result.data;
        await db.words.clear(); // Optionally clear the existing data before adding new
        await db.words.bulkAdd(words); // Bulk add entries to the database

        // uploadStatus.value = "CSV data uploaded successfully!";
      },
      error: (error) => {
        // uploadStatus.value = "Error parsing CSV file.";
        console.error("CSV Parsing Error:", error);
      },
    });
    Papa.parse(csvDefsText, {
      header: true, // Assuming CSV has headers (column names)
      dynamicTyping: true, // Automatically converts numbers and booleans
      complete: async (result) => {
        console.log("CSV Data:", result.data);

        // Step 3: Save the parsed data to IndexedDB using Dexie
        const definitions = result.data;
        await db.definitions.clear(); // Optionally clear the existing data before adding new
        await db.definitions.bulkAdd(definitions); // Bulk add entries to the database

        // uploadStatus.value = "CSV data uploaded successfully!";
      },
      error: (error) => {
        // uploadStatus.value = "Error parsing CSV file.";
        console.error("CSV Parsing Error:", error);
      },
    });
  } catch (error) {
    // uploadStatus.value = "Error loading CSV file.";
    console.error("Error loading CSV file:", error);
  }
}
