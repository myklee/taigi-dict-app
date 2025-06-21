// src/stores/dictionaryStore.js
import { defineStore } from "pinia";
import db from "@/db";
import { supabase } from "@/supabase";
import { useAuthStore } from "./authStore";

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
      try {
        this.searchHistory = await db.searchHistory.toArray();
        this.randomWordHistory = await db.randomWordHistory.toArray();
        const searchResults = await db.searchResults.toArray();
        this.searchResults = searchResults.pop()?.results || [];
        const mknollResults = await db.mknollResults.toArray();
        this.mknollResults = mknollResults.pop()?.results || [];
        const cedictResults = await db.cedictResults.toArray();
        this.cedictResults = cedictResults.pop()?.results || [];
        const crossRefResults = await db.crossRefResults.toArray();
        this.crossRefResults = crossRefResults.pop()?.results || [];
      } catch (error) {
        console.error("Error loading from IndexedDB:", error);
      }
    },
    async clearSearchHistory() {
      try {
        this.searchHistory = [];
        await db.searchHistory.clear();
        
        // Also clear from Supabase if user is authenticated
        const authStore = useAuthStore();
        if (authStore.isAuthenticated) {
          const { error } = await supabase
            .from('search_history')
            .delete()
            .eq('user_id', authStore.user.id);
          
          if (error) {
            console.error("Error clearing search history from Supabase:", error);
          }
        }
      } catch (error) {
        console.error("Error clearing search history:", error);
      }
    },
    async clearRandomWordHistory() {
      try {
        this.randomWordHistory = [];
        await db.randomWordHistory.clear();
      } catch (error) {
        console.error("Error clearing random word history:", error);
      }
    },
    async addToHistory(term) {
      try {
        if (!this.searchHistory.find((item) => item.term === term)) {
          const newEntry = { term };
          this.searchHistory.unshift(newEntry); // Add to the beginning
          if (this.searchHistory.length > 10) this.searchHistory.pop(); // Keep history limited to 10 terms
          await db.searchHistory.add(newEntry); // Sync with IndexedDB
          
          // Also save to Supabase if user is authenticated
          const authStore = useAuthStore();
          if (authStore.isAuthenticated) {
            const { error } = await supabase
              .from('search_history')
              .insert({
                user_id: authStore.user.id,
                term: term
              });
            
            if (error) {
              console.error("Error saving search history to Supabase:", error);
            }
          }
        }
      } catch (error) {
        console.error("Error adding to search history:", error);
      }
    },
    async addToRandomHistory(randomWord) {
      try {
        this.randomWordHistory.unshift(randomWord);
        console.log(this.randomWordHistory.length);
        if (this.randomWordHistory.length > 5) this.randomWordHistory.pop();
        await db.randomWordHistory.add(randomWord); // Sync with IndexedDB
      } catch (error) {
        console.error("Error adding to random word history:", error);
      }
    },
    async setSearchResults(results) {
      try {
        this.searchResults = results;
        await db.searchResults.put({ results });
      } catch (error) {
        console.error("Error setting search results:", error);
      }
    },
    async setCedictResults(results) {
      try {
        this.cedictResults = results;
        await db.cedictResults.put({ results });
      } catch (error) {
        console.error("Error setting cedict results:", error);
      }
    },
    async setMknollResults(results) {
      try {
        this.mknollResults = results;
        await db.mknollResults.put({ results });
      } catch (error) {
        console.error("Error setting mknoll results:", error);
      }
    },
    async setCrossRefCedict(results) {
      try {
        this.crossRefResults = results;
        await db.crossRefResults.put({ results });
      } catch (error) {
        console.error("Error setting cross ref results:", error);
      }
    },
    // Load search history from Supabase for authenticated users
    async loadSearchHistoryFromSupabase() {
      try {
        const authStore = useAuthStore();
        if (authStore.isAuthenticated) {
          const { data, error } = await supabase
            .from('search_history')
            .select('*')
            .eq('user_id', authStore.user.id)
            .order('created_at', { ascending: false })
            .limit(10);
          
          if (error) {
            console.error("Error loading search history from Supabase:", error);
            return;
          }
          
          if (data) {
            this.searchHistory = data.map(item => ({ term: item.term }));
          }
        }
      } catch (error) {
        console.error("Error loading search history from Supabase:", error);
      }
    }
  },
});
