# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Start development server**: `yarn dev` or `npm run dev`
- **Build for production**: `yarn build` or `npm run build`
- **Preview production build**: `yarn preview` or `npm run preview`

## Project Architecture

This is a Vue 3 + Vite application for a Taiwanese dictionary with the following key components:

### Core Technologies
- **Vue 3** with Composition API
- **Pinia** for state management
- **Vite** for build tooling
- **Dexie** for IndexedDB local storage
- **Supabase** for cloud database and authentication
- **PapaParse** for CSV processing

### Key Directories
- `src/pages/` - Main application pages (DictionarySearch, RandomWord, etc.)
- `src/components/` - Reusable Vue components, organized by feature
- `src/stores/` - Pinia stores for state management
- `src/assets/` - Static assets including CSV data files and audio files
- `src/assets/audio_taigi/` - Audio pronunciations organized by ID ranges

### Data Architecture
The application uses a dual-storage approach:
1. **IndexedDB** (via Dexie) for offline functionality and performance
2. **Supabase** for cloud sync and user authentication

**Local Database Schema** (src/db.js):
- `words` - Dictionary entries with Chinese, English, Taiwanese romanization
- `definitions` - Detailed definitions linked to words
- `cedict` - Chinese-English dictionary data
- `searchHistory` - User search history
- Various results caches for performance

### State Management
- **dictionaryStore.js** - Manages search results, history, and dictionary data
- **authStore.js** - Handles Supabase authentication state

### Key Features
- Multi-language search (English, Chinese, Taiwanese romanization)
- Audio pronunciation via Supabase Storage
- Offline-first architecture with cloud sync
- Search history with user authentication
- Random word discovery
- CSV data import/export functionality

### Authentication Flow
Users can authenticate via Supabase to sync search history across devices. The app works offline without authentication but provides enhanced features when logged in.

### Audio System
Audio files are stored in Supabase Storage and organized by ID ranges in folders (0/, 1/, etc.). The AudioPlayerTaigi component handles playback with error handling and fallback behavior.

### Build Configuration
- Uses Vite with Vue plugin
- Base path set to `/taigi-dict-app/` for GitHub Pages deployment
- Alias `@/` points to `src/` directory

## Development Notes

When working with this codebase:
- The main entry point is `src/pages/DictionarySearch.vue`
- Search functionality is centralized in `src/utils.js`
- Audio URLs are dynamically constructed based on word IDs
- CSV data files in `src/assets/` are loaded into IndexedDB on first run
- The app is designed to work offline-first with optional cloud sync