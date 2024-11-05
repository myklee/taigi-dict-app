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
  let engResults;
  let chResults;

  if (!exact) {
    const allWords = await db.words.toArray();

    // Filter entries where the chinese field contains the specified term
    chResults = allWords.filter((word) => word.chinese.includes(term));
    engResults = allWords.filter((word) => word.english.includes(term));
  } else {
    engResults = await db.words.where("english").equals(term).toArray();
    chResults = await db.words.where("chinese").equals(term).toArray();
  }

  console.log(chResults);
  console.log(engResults);

  const wordResults = [...engResults, ...chResults].reduce((acc, current) => {
    const x = acc.find((item) => item.id === current.id);
    if (!x) {
      acc.push(current);
    }
    return acc;
  }, []);
  console.log(wordResults);

  // Get all IDs from wordResults
  const wordIds = wordResults.map((word) => word.id);

  // Fetch corresponding definitions from `definitions` store based on IDs
  const definitionsResults = await db.definitions
    .where("wordid")
    .anyOf(wordIds)
    .toArray();
  // console.log(definitionsResults);
  // Step 4: Group definitions by each word's `id`
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

  // // Link each word result to its corresponding definition
  // const results = wordResults.map((word) => {
  //   const definition = definitionsResults.find((def) => def.wordid === word.id);
  //   return {
  //     word: word,
  //     definitions: definition,
  //   };
  // });
  // console.log(results);
  // return results;
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
