# Taigi Dictionary App - Feature List

A comprehensive Vue 3 application for Taiwanese language learning and reference.

## **Core Dictionary Features**
- **Multi-Language Search**: English, Chinese characters, Taiwanese romanization (Tâi-lô)
- **Multiple Dictionary Sources**: MOE, Mary Knoll, CC-CEDICT integration
- **Search Modes**: Exact match, partial matching with wildcards
- **Cross-Reference Results**: Automatic linking between dictionary sources
- **Random Word Discovery**: Explore vocabulary with random word generator

## **Audio & Pronunciation**
- **Native Audio Playback**: Taiwanese pronunciation files via Supabase Storage
- **Text-to-Speech**: Browser TTS for Chinese and English
- **Audio Recording**: Custom pronunciation recording and upload
- **Audio Management**: Delete/replace audio files for dictionary entries

## **User Authentication & Data Sync**
- **Supabase Authentication**: Email/password and Google OAuth
- **Cloud Sync**: Search history synchronization across devices
- **Offline-First**: Full functionality without internet connection
- **User Profiles**: Account management and admin role support

## **Content Management**
- **Word Entry Editing**: Full CRUD operations for dictionary entries
- **Definition Management**: Add, edit, delete word definitions
- **Audio File Management**: Upload, delete, and manage pronunciation files
- **CSV Data Import**: Bulk dictionary data upload and processing

## **Mobile & Web Platform**
- **Cross-Platform**: Web app and native mobile (Capacitor)
- **Responsive Design**: Optimized for mobile and desktop
- **PWA Capabilities**: Offline functionality and app-like experience

## **Technical Infrastructure**
- **Dual Storage**: IndexedDB for offline + Supabase for cloud
- **Performance Optimization**: Local caching and result limiting
- **Modern Architecture**: Vue 3 Composition API + Pinia state management
- **Automated Deployment**: GitHub Pages with CI/CD pipeline

## **Language Support Features**
- **Romanization Systems**: Tâi-lô primary with tone conversion utilities
- **Multi-Script Display**: Chinese characters, Latin, phonetic notation
- **Comparison Tables**: IPA, POJ, TLPA romanization reference
- **Search Intelligence**: Fuzzy matching and multi-field search

## **Detailed Feature Breakdown**

### **Search System**
- Advanced search interface with multiple modes
- Search pattern options (exact vs. partial matching)
- Multi-database simultaneous search
- Search history management with cloud sync
- Intelligent placeholders and search hints
- Results counter and visual feedback

### **Audio System**
- Hierarchical audio file organization by word ID ranges
- Comprehensive error handling and fallback behavior
- File existence checks before playback
- Cloud storage integration with Supabase
- Custom AudioPlayerTaigi component

### **Data Architecture**
- **Local Database Schema** (IndexedDB via Dexie):
  - `words` - Dictionary entries
  - `definitions` - Detailed definitions
  - `cedict` - Chinese-English dictionary data
  - `searchHistory` - User search history
  - Results caches for performance
- **Cloud Database** (Supabase PostgreSQL) for sync and backup

### **User Interface**
- Dynamic search placeholders based on mode
- Educational tips for Taiwanese romanization
- Special highlighting for phonetic search results
- Typography support for Chinese characters
- Automatic Pinyin and Zhuyin generation

### **Content Editing**
- Real-time UI updates after database changes
- Form validation for word and definition editing
- Loading states and success/error messaging
- Bulk operations for data import

### **Mobile App Features**
- Capacitor integration for native capabilities
- Cross-platform build system
- Mobile-optimized responsive design
- Native app deployment for iOS and Android

### **Performance Features**
- IndexedDB caching for fast offline access
- Lazy loading of search results and audio
- Result pagination and limits
- Graceful error handling and recovery

### **Development Tools**
- Vite build system for fast development
- Vue 3 Composition API architecture
- Pinia state management
- GitHub Actions deployment pipeline