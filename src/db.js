// src/db.js
import Dexie from "dexie";

// Create a new Dexie instance for the dictionary database
const db = new Dexie("DictionaryDB");

// Define the schema for the database (we'll store 'words' and 'definitions')
db.version(1).stores({
  words: "id,type,chinese,romaji,classification,audioid,english",
  definitions: "definitionId, wordId, english, chinese, romaji",
});

export default db;
