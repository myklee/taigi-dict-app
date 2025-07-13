// Debug utility for favorites functionality
import db from '@/db';
import { useFavoritesStore } from '@/stores/favoritesStore';

export const debugFavorites = {
  async checkDatabaseTables() {
    try {
      console.log("=== Database Tables Debug ===");
      const tables = db.tables;
      console.log("Available tables:", tables.map(t => t.name));
      
      // Check if favorites table exists
      const favoritesTable = tables.find(t => t.name === 'favorites');
      if (favoritesTable) {
        console.log("✅ Favorites table exists");
        console.log("Schema:", favoritesTable.schema);
      } else {
        console.log("❌ Favorites table does not exist");
      }
      
      // Check database version
      console.log("Database version:", db.verno);
      
      return { tables: tables.map(t => t.name), version: db.verno };
    } catch (error) {
      console.error("Error checking database tables:", error);
      return { error: error.message };
    }
  },

  async testFavoritesTable() {
    try {
      console.log("=== Testing Favorites Table ===");
      
      // Try to read from favorites table
      const existingFavorites = await db.favorites.toArray();
      console.log("Existing favorites:", existingFavorites);
      
      // Try to add a test favorite
      const testFavorite = {
        word_id: 999999,
        word_data: { id: 999999, chinese: "測試", english: "test", romaji: "chhì-giām" },
        created_at: new Date().toISOString()
      };
      
      const result = await db.favorites.add(testFavorite);
      console.log("✅ Test favorite added with ID:", result);
      
      // Try to read it back
      const readBack = await db.favorites.where('word_id').equals(999999).toArray();
      console.log("Test favorite read back:", readBack);
      
      // Clean up test data
      await db.favorites.where('word_id').equals(999999).delete();
      console.log("✅ Test favorite cleaned up");
      
      return { success: true, testId: result };
    } catch (error) {
      console.error("❌ Error testing favorites table:", error);
      return { error: error.message };
    }
  },

  async testFavoritesStore() {
    try {
      console.log("=== Testing Favorites Store ===");
      const favoritesStore = useFavoritesStore();
      
      console.log("Initial favorites count:", favoritesStore.favorites.length);
      
      // Test adding a favorite through the store
      const testWord = {
        id: 888888,
        chinese: "商店測試",
        english: "store test",
        romaji: "siong-tiàm chhì-giām"
      };
      
      await favoritesStore.addFavorite(testWord);
      console.log("Added test word, new count:", favoritesStore.favorites.length);
      
      // Test if it's marked as favorited
      const isFavorited = favoritesStore.isFavorited(testWord.id);
      console.log("Is test word favorited:", isFavorited);
      
      // Clean up
      await favoritesStore.removeFavorite(testWord.id);
      console.log("Removed test word, final count:", favoritesStore.favorites.length);
      
      return { success: true };
    } catch (error) {
      console.error("❌ Error testing favorites store:", error);
      return { error: error.message };
    }
  },

  async runFullDiagnostic() {
    console.log("🔍 Running full favorites diagnostic...");
    
    const dbCheck = await this.checkDatabaseTables();
    const tableTest = await this.testFavoritesTable();
    const storeTest = await this.testFavoritesStore();
    
    console.log("=== Diagnostic Results ===");
    console.log("Database check:", dbCheck);
    console.log("Table test:", tableTest);
    console.log("Store test:", storeTest);
    
    return {
      database: dbCheck,
      table: tableTest,
      store: storeTest
    };
  }
};

// Make it globally available for debugging
if (typeof window !== 'undefined') {
  window.debugFavorites = debugFavorites;
}