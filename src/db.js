// src/db.js
import Dexie from "dexie";

// Create a new Dexie instance for the dictionary database
const db = new Dexie("DictionaryDB");

// Define the schema for the database (we'll store 'words' and 'definitions')
db.version(1).stores({
  words:
    "id,type,chinese,romaji,classification,audioid,english, created_at, sort, taiwanese, english_mknoll, simplified, pinyin, english_ccedict, classification_english, zhuyin, audio_url ",
  definitions: "defid,wordid,partofspeech,def_chinese,def_english",
  cedict: "id, created_at, traditional, simplified, pinyin, english_edict",
  searchHistory: "++id, term",
  searchResults: "++id, results",
  cedictResults: "++id, results",
  mknollResults: "++id, results",
  crossRefResults: "++id, results",
  randomWordHistory: "++id_rw, word",
});

// Version 2: Add favorites table
db.version(2).stores({
  words:
    "id,type,chinese,romaji,classification,audioid,english, created_at, sort, taiwanese, english_mknoll, simplified, pinyin, english_ccedict, classification_english, zhuyin, audio_url ",
  definitions: "defid,wordid,partofspeech,def_chinese,def_english",
  cedict: "id, created_at, traditional, simplified, pinyin, english_edict",
  searchHistory: "++id, term",
  searchResults: "++id, results",
  cedictResults: "++id, results",
  mknollResults: "++id, results",
  crossRefResults: "++id, results",
  randomWordHistory: "++id_rw, word",
  favorites: "++id, word_id, word_data, created_at",
}).upgrade(tx => {
  // This upgrade function will run for users upgrading from version 1 to 2
  console.log("Upgrading database from version 1 to 2, adding favorites table");
  return tx.favorites.clear(); // Initialize empty favorites table
});

export default db;
