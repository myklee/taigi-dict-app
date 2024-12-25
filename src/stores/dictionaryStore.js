// src/stores/dictionaryStore.js
import { defineStore } from "pinia";
import db from "@/db";

export const useDictionaryStore = defineStore("dictionary", {
  state: () => ({
    searchHistory: [],
    searchResults: [],
    randomWordHistory: [],
  }),
  actions: {
    async loadFromIndexedDB() {
      this.searchHistory = await db.searchHistory.toArray();
      this.randomWordHistory = await db.randomWordHistory.toArray();
      // Optionally load search results if needed
    },
    async clearSearchHistory() {
      this.searchHistory = [];
      await db.searchHistory.clear();
    },
    async clearRandomWordHistory() {
      this.randomWordHistory = [];
      await db.randomWordHistory.clear();
    },
    async addToHistory(term) {
      if (!this.searchHistory.find((item) => item.term === term)) {
        const newEntry = { term };
        this.searchHistory.unshift(newEntry); // Add to the beginning
        if (this.searchHistory.length > 10) this.searchHistory.pop(); // Keep history limited to 10 terms
        await db.searchHistory.add(newEntry); // Sync with IndexedDB
      }
    },
    async addToRandomHistory(randomWord) {
      if (!this.randomWordHistory.includes(randomWord)) {
        this.randomWordHistory.unshift(randomWord); // Add to the beginning
        if (this.randomWordHistory.length > 10) this.randomWordHistory.pop(); // Keep history limited to 10 terms
        await db.randomWordHistory.add(randomWord); // Sync with IndexedDB
      }
    },
    async setSearchResults(results) {
      this.searchResults = results;
      await db.searchResults.put({ results });
    },
  },
});
