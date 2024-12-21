// src/stores/dictionaryStore.js
import RandomWord from "@/pages/RandomWord.vue";
import { defineStore } from "pinia";

export const useDictionaryStore = defineStore("dictionary", {
  state: () => ({
    searchHistory: [],
    searchResults: [],
    randomWordHistory: [],
  }),
  actions: {
    addToHistory(term) {
      if (!this.searchHistory.includes(term)) {
        this.searchHistory.unshift(term); // Add to the beginning
        if (this.searchHistory.length > 10) this.searchHistory.pop(); // Keep history limited to 10 terms
      }
    },
    addToRandomHistory(randomWord) {
        if (!this.randomWordHistory.includes(randomWord)) {
          this.randomWordHistory.unshift(randomWord); // Add to the beginning
          if (this.randomWordHistory.length > 10) this.randomWordHistory.pop(); // Keep history limited to 10 terms
        }
      },
    setSearchResults(results) {
      this.searchResults = results;
    },
  },
});
