# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Start development server**: `npm run dev` (mobile/Capacitor) or `npm run dev` (web)
- **Build for production**: `npm run build` (web) or `npm run build:mobile` (mobile/Capacitor)
- **Build for web deployment**: `npm run build:web`
- **Preview production build**: `npm run preview` (web) or `npm run preview:mobile` (mobile)
- **Run tests**: `npm test` or `npm run test:run`
- **Run mobile tests**: `npm run test:mobile`
- **iOS development**: `npm run ios`
- **Android development**: `npm run android`
- **Analyze bundle size**: `npm run analyze`

## Project Architecture

This is a Vue 3 + Vite application for a Taiwanese dictionary with cross-platform capabilities (web and mobile via Capacitor).

### Core Technologies
- **Vue 3** with Composition API
- **Vue Router 4** for navigation and routing
- **Pinia** for state management
- **Vite** for build tooling with dual config (web/mobile)
- **Capacitor** for mobile app deployment (iOS/Android)
- **Dexie** for IndexedDB local storage
- **Supabase** for cloud database, authentication, and storage
- **PapaParse** for CSV processing
- **Vitest** for unit testing

### Key Directories
- `src/views/` - Main application pages/views (DictionarySearch, AdminLayout, WordDetail, etc.)
- `src/components/` - Reusable Vue components, organized by feature:
  - `auth/` - Authentication components
  - `cards/` - Result card components for different dictionary sources
  - `search/` - Search result components
  - `icons/` - Icon components
  - `utility/` - Utility components
- `src/router/` - Vue Router configuration with guards and route definitions
- `src/stores/` - Pinia stores for state management
- `src/assets/` - Static assets including CSV data files and audio files
- `src/assets/audio_taigi/` - Audio pronunciations organized by ID ranges
- `src/utils/` - Utility functions and helpers
- `src/composables/` - Vue composables for reusable logic
- `src/models/` - Data models and business logic
- `src/types/` - TypeScript type definitions

### Routing Architecture
The application uses Vue Router 4 with:
- **Dynamic history mode selection**: Web builds use HTML5 history, mobile builds use hash history for Capacitor compatibility
- **Route guards**: Authentication and authorization guards in `src/router/guards.js`
- **Lazy loading**: Route-based code splitting for performance
- **Error handling**: Comprehensive navigation error handling
- **Performance monitoring**: Built-in performance tracking

### Data Architecture
The application uses a dual-storage approach:
1. **IndexedDB** (via Dexie) for offline functionality and performance
2. **Supabase** for cloud sync, authentication, and file storage

**Local Database Schema** (src/db.js):
- `words` - Dictionary entries with Chinese, English, Taiwanese romanization
- `definitions` - Detailed definitions linked to words
- `cedict` - Chinese-English dictionary data
- `searchHistory` - User search history
- `favorites` - User favorites
- Various results caches for performance

### State Management
- **dictionaryStore.js** - Manages search results, history, and dictionary data
- **authStore.js** - Handles Supabase authentication state
- **communityStore.js** - Manages community-driven content and user contributions
- **favoritesStore.js** - Manages user favorites functionality

### Key Features
- **Multi-platform deployment**: Web (GitHub Pages) and mobile (iOS/Android via Capacitor)
- **Multi-language search**: English, Chinese, Taiwanese romanization with fuzzy search
- **Audio pronunciation system**: Supabase Storage integration with organized audio files
- **Community content system**: User-generated definitions, voting, and moderation
- **Admin dashboard**: User management, content moderation, and analytics
- **Authentication system**: Supabase Auth with role-based access control
- **Offline-first architecture**: Full functionality without internet connection
- **Real-time features**: Live updates for community content and moderation
- **Favorites system**: Cross-device bookmark synchronization
- **Search history**: Persistent search tracking with cloud sync

### Authentication & Authorization
- **Supabase Auth**: Email/password and social login support
- **Role-based access**: Admin, moderator, and user roles
- **Route protection**: Navigation guards for protected routes
- **Admin features**: User management, content moderation, system analytics

### Mobile Architecture (Capacitor)
- **Cross-platform compatibility**: Shared codebase for web and mobile
- **Native features**: Audio recording, file system access
- **Platform-specific optimizations**: Different build configs for web/mobile
- **Hash routing**: Mobile builds use hash history for compatibility

### Build Configuration
- **Dual Vite configs**: `vite.config.js` (mobile) and `vite.config.web.js` (web)
- **Code splitting**: Intelligent chunking by routes and features
- **Bundle optimization**: Separate chunks for vendor, router, admin, and core features
- **Asset handling**: MP3 files included as assets
- **Environment variables**: Platform detection and configuration
- **GitHub Pages deployment**: Web build with base path configuration

### Testing
- **Vitest**: Unit testing framework with Vue Test Utils
- **Happy DOM**: Fast DOM environment for tests
- **Component testing**: Comprehensive test coverage for components and utilities
- **Router testing**: Navigation and guard testing
- **Cross-platform testing**: Separate test configurations for web and mobile

## Development Notes

When working with this codebase:
- **Entry points**: `src/main.js` initializes the app, `src/views/DictionarySearch.vue` is the main search interface
- **Routing**: All navigation should use Vue Router - avoid manual URL manipulation
- **Platform detection**: Use environment variables (`VITE_PLATFORM`, `VITE_IS_CAPACITOR`) for platform-specific code
- **State management**: Use Pinia stores for all shared state, avoid component-level data for persistent data
- **Search functionality**: Core search logic in `src/utils.js` with store integration
- **Audio system**: Audio URLs are dynamically constructed based on word IDs and stored in organized folders
- **Database operations**: Use the IndexedDB layer for offline functionality, Supabase for cloud sync
- **Component organization**: Follow the established folder structure with feature-based grouping
- **Authentication**: Always check auth state before accessing protected features
- **Admin features**: Admin routes are protected and require proper user roles
- **Community content**: All user-generated content goes through validation and moderation workflows
- **Mobile considerations**: Test audio recording and file access features on actual mobile devices
- **Performance**: Use lazy loading and code splitting for optimal bundle size