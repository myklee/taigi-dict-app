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
  //different types of search
  let engResults = [];
  let chResults = [];
  let romajiResults = [];

  if (!exact) {
    const allWords = await db.words.toArray();
    console.log(allWords.filter((word) => word.english.length > 15));
    // Filter entries where the chinese field contains the specified term
    chResults = allWords.filter((word) => word.chinese.includes(term));
    engResults = allWords.filter((word) => {
      return typeof word.english === "string" && word.english.includes(term);
    });
    romajiResults = allWords.filter((word) => {
      return typeof word.romaji === "string" && word.romaji.includes(term);
    });
    // console.log(engResults);
  } else {
    engResults = await db.words
      .where("english")
      .equalsIgnoreCase(term)
      .toArray();
    chResults = await db.words
      .where("chinese")
      .equalsIgnoreCase(term)
      .toArray();
    romajiResults = await db.words
      .where("romaji")
      .equalsIgnoreCase(term)
      .toArray();
  }

  const wordResults = [...romajiResults, ...engResults, ...chResults].reduce(
    (acc, current) => {
      const x = acc.find((item) => item.id === current.id);
      if (!x) {
        acc.push(current);
      }
      return acc;
    },
    []
  );

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

// function to upload entries automatically upload entries
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

export async function speakChinese(text) {
  // Wait for voices to load if they haven't yet
  let voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) {
    await new Promise((resolve) =>
      window.speechSynthesis.addEventListener("voiceschanged", resolve, {
        once: true,
      })
    );
    voices = window.speechSynthesis.getVoices();
  }

  // Set up and speak the utterance
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "zh-TW";
  utterance.voice = voices.find((voice) => voice.name === "Meijia");
  window.speechSynthesis.speak(utterance);
}
export async function speakEnglish(text) {
  // Wait for voices to load if they haven't yet
  let voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) {
    await new Promise((resolve) =>
      window.speechSynthesis.addEventListener("voiceschanged", resolve, {
        once: true,
      })
    );
    voices = window.speechSynthesis.getVoices();
  }
  //find voices
  const enUSVoices = voices.filter((voice) => voice.lang === "en-US");
  console.log(enUSVoices);
  // Set up and speak the utterance
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.voice = voices.find((voice) => voice.name === "Samantha");
  // utterance.voice = voices.find((voice) => voice.name === "Meijia");
  window.speechSynthesis.speak(utterance);
}

export async function convertToneNumbersToMarks(pojString) {
  const toneMap = {
      1: '', // No mark for tone 1
      2: '́', // Acute accent
      3: '̀', // Grave accent
      5: '̂', // Circumflex
      7: '̍', // Macron below
      8: '̄', // Macron
  };

  const vowels = ['a', 'e', 'i', 'o', 'u', 'm', 'n'];

  return pojString.split(' ').map(syllable => {
      const tone = syllable.match(/\d$/); // Find tone number at the end
      if (tone) {
          const toneNumber = tone[0];
          const baseSyllable = syllable.slice(0, -1); // Remove tone number
          for (let i = baseSyllable.length - 1; i >= 0; i--) {
              if (vowels.includes(baseSyllable[i].toLowerCase())) {
                  return (
                      baseSyllable.slice(0, i) +
                      baseSyllable[i] +
                      toneMap[toneNumber] +
                      baseSyllable.slice(i + 1)
                  );
              }
          }
      }
      return syllable; // Return unchanged if no tone number
  }).join(' ');
}

export function detectSearchLanguage(searchTerm) {
  if (!searchTerm || searchTerm.trim() === '') {
    return { language: 'unknown', confidence: 0 };
  }

  const term = searchTerm.trim();
  
  // Chinese character detection (CJK Unified Ideographs)
  const chineseRegex = /[\u4e00-\u9fff]/;
  const chineseMatches = term.match(chineseRegex);
  const chineseRatio = chineseMatches ? chineseMatches.length / term.length : 0;
  
  // Taiwanese romanization patterns (POJ/Tâi-lô)
  // Common patterns: tone numbers (1-8), diacritics, specific consonant combinations
  const taiwanesePatterns = [
    /[1-8]$/, // Tone numbers at end
    /[âêîôûāēīōūàèìòùáéíóúǎěǐǒǔ]/, // Tone marks/diacritics
    /\b[bcdfghjklmnpqrstvwxyz]*[aeiou]+[hkpnt]?\b/i, // Romanization syllable patterns
    /chh|kh|ph|th|ng|oa|oe|ui/i // Common Taiwanese romanization combinations
  ];
  
  const taiwaneseScore = taiwanesePatterns.reduce((score, pattern) => {
    return score + (pattern.test(term) ? 0.25 : 0);
  }, 0);
  
  // English detection (basic Latin alphabet)
  const englishRegex = /^[a-zA-Z\s\-''.,!?]*$/;
  const isEnglish = englishRegex.test(term);
  
  // Calculate confidence scores
  if (chineseRatio > 0.3) {
    return { language: 'chinese', confidence: Math.min(chineseRatio * 1.2, 1) };
  } else if (taiwaneseScore > 0.5) {
    return { language: 'taiwanese', confidence: Math.min(taiwaneseScore, 1) };
  } else if (isEnglish && term.length > 1) {
    // Higher confidence for longer English terms
    const englishConfidence = Math.min(0.7 + (term.length / 20), 0.95);
    return { language: 'english', confidence: englishConfidence };
  }
  
  // Fallback detection with lower confidence
  if (chineseRatio > 0) {
    return { language: 'chinese', confidence: 0.5 };
  } else if (taiwaneseScore > 0) {
    return { language: 'taiwanese', confidence: 0.3 };
  } else if (isEnglish) {
    return { language: 'english', confidence: 0.4 };
  }
  
  return { language: 'unknown', confidence: 0 };
}

// // Example usage:
// const input = "ba8k-chiu nih-chhiauh nih-chhiauh";
// console.log(convertToneNumbersToMarks(input));

