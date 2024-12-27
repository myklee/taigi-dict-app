// src/stores/dictionaryStore.js
import { defineStore } from "pinia";
import db from "@/db";

export const useDictionaryStore = defineStore("dictionary", {
  state: () => ({
    searchHistory: [],
    searchResults: [],
    cedictResults: [],
    mknollResults: [],
    crossRefResults: [],
    randomWordHistory: [],
  }),
  actions: {
    async loadFromIndexedDB() {
      this.searchHistory = await db.searchHistory.toArray();
      this.randomWordHistory = await db.randomWordHistory.toArray();
      const searchResults = await db.searchResults.toArray();
      this.searchResults = searchResults.pop().results;
      const cedictResults = await db.cedictResults.toArray();
      this.cedictResults = cedictResults.pop().results;
      const mknollResults = await db.mknollResults.toArray();
      this.mknollResults = mknollResults.pop().results;
      console.log(mknollResults);
      const crossRefResults = await db.crossRefResults.toArray();
      this.crossRefResults = crossRefResults.pop().results;
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
    async setCedictResults(results) {
      this.cedictResults = results;
      await db.cedictResults.put({ results });
    },
    async setMknollResults(results) {
      this.mknollResults = results;
      await db.mknollResults.put({ results });
    },
    async setCrossRefCedict(results) {
      this.crossRefResults = results;
      await db.crossRefResults.put({ results });
    },
  },
});
