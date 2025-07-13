import { defineStore } from "pinia";
import db from "@/db";
import { supabase } from "@/supabase";
import { useAuthStore } from "./authStore";

export const useFavoritesStore = defineStore("favorites", {
  state: () => ({
    favorites: [],
    indexedDBDisabled: false, // Flag to disable IndexedDB if persistent errors occur
  }),
  
  getters: {
    isFavorited: (state) => (wordId) => {
      return state.favorites.some(fav => fav.word_id === wordId);
    },
    
    getFavoriteWords: (state) => {
      return state.favorites.map(fav => fav.word_data);
    }
  },
  
  actions: {
    // Helper function to clean word data for storage
    cleanWordData(word) {
      return {
        id: word.id,
        chinese: word.chinese,
        romaji: word.romaji,
        english: word.english,
        classification: word.classification,
        audioid: word.audioid,
        audio_url: word.audio_url,
        taiwanese: word.taiwanese,
        english_mknoll: word.english_mknoll,
        simplified: word.simplified,
        pinyin: word.pinyin,
        english_ccedict: word.english_ccedict,
        zhuyin: word.zhuyin,
        type: word.type,
        created_at: word.created_at,
        sort: word.sort,
        // Include definitions if they exist, also cleaned
        definitions: word.definitions ? word.definitions.map(def => ({
          defid: def.defid,
          wordid: def.wordid,
          partofspeech: def.partofspeech,
          def_chinese: def.def_chinese,
          def_english: def.def_english
        })) : []
      };
    },

    // Helper function to deeply clean any object for storage
    deepCleanForStorage(obj) {
      try {
        return JSON.parse(JSON.stringify(obj));
      } catch (error) {
        console.error("Error cleaning object for storage:", error);
        return null;
      }
    },

    async loadFromIndexedDB() {
      if (this.indexedDBDisabled) {
        console.log("IndexedDB disabled for favorites, skipping load");
        return;
      }
      
      try {
        this.favorites = await db.favorites.toArray();
      } catch (error) {
        console.error("Error loading favorites from IndexedDB:", error);
        this.favorites = []; // Initialize empty array if loading fails
        this.indexedDBDisabled = true; // Disable IndexedDB for this session
      }
    },

    async loadFromSupabase() {
      try {
        const authStore = useAuthStore();
        if (authStore.isAuthenticated) {
          const { data, error } = await supabase
            .from('favorites')
            .select('*')
            .eq('user_id', authStore.user.id)
            .order('created_at', { ascending: false });
          
          if (error) {
            console.error("Error loading favorites from Supabase:", error);
            return;
          }
          
          if (data) {
            // Convert Supabase format to local format and thoroughly clean the data
            this.favorites = data.map(item => {
              const cleanItem = this.deepCleanForStorage({
                id: item.id,
                word_id: item.word_id,
                word_data: item.word_data,
                created_at: item.created_at
              });
              
              // If cleaning failed, return a minimal safe version
              if (!cleanItem) {
                return {
                  id: item.id || Date.now(),
                  word_id: item.word_id,
                  word_data: {
                    id: item.word_data?.id,
                    chinese: item.word_data?.chinese || '',
                    english: item.word_data?.english || '',
                    romaji: item.word_data?.romaji || ''
                  },
                  created_at: item.created_at || new Date().toISOString()
                };
              }
              
              return cleanItem;
            });
            
            // Sync cleaned data to IndexedDB with extensive debugging and safety
            if (!this.indexedDBDisabled) {
              try {
                await db.favorites.clear();
                console.log("Attempting to add favorites to IndexedDB:", this.favorites.length, "items");
              
              // Try to add each item individually to identify problematic data
              const successfulItems = [];
              for (const [index, favorite] of this.favorites.entries()) {
                try {
                  // Create a completely safe object with only primitive values
                  const safeFavorite = {
                    id: favorite.id || Date.now() + index,
                    word_id: favorite.word_id || 0,
                    word_data: {
                      id: favorite.word_data?.id || 0,
                      chinese: String(favorite.word_data?.chinese || ''),
                      english: String(favorite.word_data?.english || ''),
                      romaji: String(favorite.word_data?.romaji || ''),
                      classification: String(favorite.word_data?.classification || ''),
                      audioid: favorite.word_data?.audioid || null,
                      audio_url: String(favorite.word_data?.audio_url || ''),
                      taiwanese: String(favorite.word_data?.taiwanese || ''),
                      english_mknoll: String(favorite.word_data?.english_mknoll || ''),
                      simplified: String(favorite.word_data?.simplified || ''),
                      pinyin: String(favorite.word_data?.pinyin || ''),
                      english_ccedict: String(favorite.word_data?.english_ccedict || ''),
                      zhuyin: String(favorite.word_data?.zhuyin || ''),
                      type: String(favorite.word_data?.type || ''),
                      created_at: String(favorite.word_data?.created_at || ''),
                      sort: favorite.word_data?.sort || 0,
                      definitions: Array.isArray(favorite.word_data?.definitions) 
                        ? favorite.word_data.definitions.map(def => ({
                            defid: def?.defid || 0,
                            wordid: def?.wordid || 0,
                            partofspeech: String(def?.partofspeech || ''),
                            def_chinese: String(def?.def_chinese || ''),
                            def_english: String(def?.def_english || '')
                          }))
                        : []
                    },
                    created_at: String(favorite.created_at || new Date().toISOString())
                  };
                  
                  await db.favorites.add(safeFavorite);
                  successfulItems.push(safeFavorite);
                } catch (itemError) {
                  console.error(`Error adding favorite item ${index}:`, itemError, favorite);
                  // Continue with other items
                }
              }
              
              console.log(`Successfully added ${successfulItems.length} out of ${this.favorites.length} favorites to IndexedDB`);
              
              } catch (dbError) {
                console.error("Error syncing favorites to IndexedDB:", dbError);
                // If all else fails, completely disable IndexedDB sync for this session
                this.indexedDBDisabled = true;
                console.warn("Disabling IndexedDB sync for favorites due to persistent errors");
              }
            }
          }
        }
      } catch (error) {
        console.error("Error loading favorites from Supabase:", error);
      }
    },

    async addFavorite(word) {
      try {
        // Clean the word data to remove any non-serializable properties
        const cleanWordData = this.cleanWordData(word);

        const favoriteData = {
          word_id: word.id,
          word_data: cleanWordData,
          created_at: new Date().toISOString()
        };

        // Add to local state first
        this.favorites.unshift(favoriteData);
        
        // Add to IndexedDB with ultra-safe data structure
        if (!this.indexedDBDisabled) {
          try {
          // Create an ultra-safe object with only primitive values
          const safeFavorite = {
            id: Date.now() + Math.random(),
            word_id: word.id || 0,
            word_data: {
              id: word.id || 0,
              chinese: String(word.chinese || ''),
              english: String(word.english || ''),
              romaji: String(word.romaji || ''),
              classification: String(word.classification || ''),
              audioid: word.audioid || null,
              audio_url: String(word.audio_url || ''),
              taiwanese: String(word.taiwanese || ''),
              english_mknoll: String(word.english_mknoll || ''),
              simplified: String(word.simplified || ''),
              pinyin: String(word.pinyin || ''),
              english_ccedict: String(word.english_ccedict || ''),
              zhuyin: String(word.zhuyin || ''),
              type: String(word.type || ''),
              created_at: String(word.created_at || ''),
              sort: word.sort || 0,
              definitions: Array.isArray(word.definitions) 
                ? word.definitions.map(def => ({
                    defid: def?.defid || 0,
                    wordid: def?.wordid || 0,
                    partofspeech: String(def?.partofspeech || ''),
                    def_chinese: String(def?.def_chinese || ''),
                    def_english: String(def?.def_english || '')
                  }))
                : []
            },
            created_at: new Date().toISOString()
          };
          
          await db.favorites.add(safeFavorite);
          } catch (dbError) {
            console.error("Error saving favorite to IndexedDB:", dbError);
            this.indexedDBDisabled = true;
            console.warn("Disabling IndexedDB for favorites due to error");
          }
        }
        
        // Add to Supabase if authenticated
        const authStore = useAuthStore();
        if (authStore.isAuthenticated) {
          try {
            const { data, error } = await supabase
              .from('favorites')
              .insert({
                user_id: authStore.user.id,
                word_id: word.id,
                word_data: cleanWordData
              })
              .select();
            
            if (error) {
              console.error("Error saving favorite to Supabase:", error);
            }
          } catch (supabaseError) {
            console.error("Error with Supabase operation:", supabaseError);
            // Continue even if Supabase fails
          }
        }
      } catch (error) {
        console.error("Error adding favorite:", error);
        // Remove from local state if there was an error
        this.favorites = this.favorites.filter(fav => fav.word_id !== word.id);
      }
    },

    async removeFavorite(wordId) {
      try {
        // Remove from local state
        this.favorites = this.favorites.filter(fav => fav.word_id !== wordId);
        
        // Remove from IndexedDB
        await db.favorites.where('word_id').equals(wordId).delete();
        
        // Remove from Supabase if authenticated
        const authStore = useAuthStore();
        if (authStore.isAuthenticated) {
          const { error } = await supabase
            .from('favorites')
            .delete()
            .eq('user_id', authStore.user.id)
            .eq('word_id', wordId);
          
          if (error) {
            console.error("Error removing favorite from Supabase:", error);
          }
        }
      } catch (error) {
        console.error("Error removing favorite:", error);
      }
    },

    async toggleFavorite(word) {
      if (this.isFavorited(word.id)) {
        await this.removeFavorite(word.id);
      } else {
        await this.addFavorite(word);
      }
    },

    async clearFavorites() {
      try {
        this.favorites = [];
        await db.favorites.clear();
        
        // Clear from Supabase if authenticated
        const authStore = useAuthStore();
        if (authStore.isAuthenticated) {
          const { error } = await supabase
            .from('favorites')
            .delete()
            .eq('user_id', authStore.user.id);
          
          if (error) {
            console.error("Error clearing favorites from Supabase:", error);
          }
        }
      } catch (error) {
        console.error("Error clearing favorites:", error);
      }
    }
  }
});