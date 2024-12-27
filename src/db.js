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
  randomWordHistory: "++id, word",
});

export default db;
