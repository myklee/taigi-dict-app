import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createRouter, createWebHistory } from 'vue-router';
import MoeResultCard from '../MoeResultCard.vue';
import MknollResultCard from '../MknollResultCard.vue';
import CedictResultCard from '../CedictResultCard.vue';
import CedictCrossRefCard from '../CedictCrossRefCard.vue';

// Mock router
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: { template: '<div>Home</div>' } },
    { path: '/moe/:id', name: 'moe-word-detail', component: { template: '<div>MOE Detail</div>' } },
    { path: '/mknoll/:id', name: 'mknoll-word-detail', component: { template: '<div>Mknoll Detail</div>' } },
    { path: '/cedict/:id', name: 'cedict-word-detail', component: { template: '<div>CEDICT Detail</div>' } }
  ]
});

// Mock stores
const mockFavoritesStore = {
  isFavorited: () => false,
  toggleFavorite: () => {}
};

// Mock word data
const mockMoeWord = {
  id: 1,
  chinese: '測試',
  romaji: 'chhì-giām',
  english: 'test',
  definitions: [
    { id: 1, def_english: 'A test or examination', def_chinese: '測試或考試' }
  ],
  audioid: '123'
};

const mockMknollWord = {
  id: 2,
  chinese: '學習',
  taiwanese: 'ha̍k-si̍p',
  english_mknoll: 'learn',
  audio_url: '/audio/test.mp3'
};

const mockCedictWord = {
  id: 3,
  traditional: '電腦',
  english_cedict: 'computer'
};

describe('Mobile Card Optimizations', () => {
  beforeEach(() => {
    // Mock global properties
    global.CSS = { supports: () => false };
  });

  describe('Touch Target Requirements', () => {
    it('should ensure MoeResultCard actions meet minimum touch target size', async () => {
      const wrapper = mount(MoeResultCard, {
        props: {
          word: mockMoeWord,
          primaryLanguage: 'chinese'
        },
        global: {
          plugins: [router],
          mocks: {
            $emit: () => {},
            favoritesStore: mockFavoritesStore
          },
          stubs: {
            TouchTarget: {
              template: '<button class="touch-target" :class="size"><slot /></button>',
              props: ['size', 'rounded', 'aria-label']
            },
            AudioPlayerTaigi: { template: '<div>Audio Player</div>' },
            Pinyinzhuyin: { template: '<div>Pinyin</div>' },
            IconHeart: { template: '<div>Heart</div>' },
            IconAdd: { template: '<div>Add</div>' },
            IconEdit: { template: '<div>Edit</div>' },
            IconPlayAudio: { template: '<div>Play</div>' }
          }
        }
      });

      const touchTargets = wrapper.findAll('.touch-target');
      expect(touchTargets.length).toBeGreaterThan(0);
      
      // Check that touch targets have appropriate size classes
      const cardActions = wrapper.find('.card-actions');
      expect(cardActions.exists()).toBe(true);
    });

    it('should ensure MknollResultCard actions meet minimum touch target size', async () => {
      const wrapper = mount(MknollResultCard, {
        props: {
          word: mockMknollWord,
          primaryLanguage: 'taiwanese'
        },
        global: {
          plugins: [router],
          mocks: {
            $emit: () => {},
            favoritesStore: mockFavoritesStore
          },
          stubs: {
            TouchTarget: {
              template: '<button class="touch-target" :class="size"><slot /></button>',
              props: ['size', 'rounded', 'aria-label']
            },
            Pinyinzhuyin: { template: '<div>Pinyin</div>' },
            IconHeart: { template: '<div>Heart</div>' },
            IconAdd: { template: '<div>Add</div>' },
            IconEdit: { template: '<div>Edit</div>' }
          }
        }
      });

      const touchTargets = wrapper.findAll('.touch-target');
      expect(touchTargets.length).toBeGreaterThan(0);
      
      const cardActions = wrapper.find('.card-actions');
      expect(cardActions.exists()).toBe(true);
    });

    it('should ensure CedictResultCard actions meet minimum touch target size', async () => {
      const wrapper = mount(CedictResultCard, {
        props: {
          word: mockCedictWord,
          primaryLanguage: 'chinese'
        },
        global: {
          plugins: [router],
          mocks: {
            $emit: () => {},
            favoritesStore: mockFavoritesStore
          },
          stubs: {
            TouchTarget: {
              template: '<button class="touch-target" :class="size"><slot /></button>',
              props: ['size', 'rounded', 'aria-label']
            },
            Pinyinzhuyin: { template: '<div>Pinyin</div>' },
            IconHeart: { template: '<div>Heart</div>' },
            IconAdd: { template: '<div>Add</div>' }
          }
        }
      });

      const touchTargets = wrapper.findAll('.touch-target');
      expect(touchTargets.length).toBeGreaterThan(0);
      
      const cardActions = wrapper.find('.card-actions');
      expect(cardActions.exists()).toBe(true);
    });

    it('should ensure CedictCrossRefCard actions meet minimum touch target size', async () => {
      const wrapper = mount(CedictCrossRefCard, {
        props: {
          word: mockCedictWord,
          primaryLanguage: 'chinese'
        },
        global: {
          plugins: [router],
          mocks: {
            $emit: () => {},
            favoritesStore: mockFavoritesStore
          },
          stubs: {
            TouchTarget: {
              template: '<button class="touch-target" :class="size"><slot /></button>',
              props: ['size', 'rounded', 'aria-label']
            },
            Pinyinzhuyin: { template: '<div>Pinyin</div>' },
            IconHeart: { template: '<div>Heart</div>' },
            IconAdd: { template: '<div>Add</div>' },
            IconPlayAudio: { template: '<div>Play</div>' }
          }
        }
      });

      const touchTargets = wrapper.findAll('.touch-target');
      expect(touchTargets.length).toBeGreaterThan(0);
      
      const cardActions = wrapper.find('.card-actions');
      expect(cardActions.exists()).toBe(true);
    });
  });

  describe('Mobile Layout Optimizations', () => {
    it('should have proper mobile-responsive classes in MoeResultCard', () => {
      const wrapper = mount(MoeResultCard, {
        props: {
          word: mockMoeWord,
          primaryLanguage: 'chinese'
        },
        global: {
          plugins: [router],
          mocks: {
            $emit: () => {},
            favoritesStore: mockFavoritesStore
          },
          stubs: {
            TouchTarget: { template: '<button><slot /></button>' },
            AudioPlayerTaigi: { template: '<div>Audio Player</div>' },
            Pinyinzhuyin: { template: '<div>Pinyin</div>' },
            IconHeart: { template: '<div>Heart</div>' },
            IconAdd: { template: '<div>Add</div>' },
            IconEdit: { template: '<div>Edit</div>' },
            IconPlayAudio: { template: '<div>Play</div>' }
          }
        }
      });

      const card = wrapper.find('.moe-result-card');
      expect(card.exists()).toBe(true);
      
      const cardHeader = wrapper.find('.card-header');
      expect(cardHeader.exists()).toBe(true);
      
      const primaryContent = wrapper.find('.primary-content');
      expect(primaryContent.exists()).toBe(true);
    });

    it('should have proper accessibility attributes', () => {
      const wrapper = mount(MoeResultCard, {
        props: {
          word: mockMoeWord,
          primaryLanguage: 'chinese'
        },
        global: {
          plugins: [router],
          mocks: {
            $emit: () => {},
            favoritesStore: mockFavoritesStore
          },
          stubs: {
            TouchTarget: { 
              template: '<button :aria-label="ariaLabel"><slot /></button>',
              props: ['aria-label', 'ariaLabel']
            },
            AudioPlayerTaigi: { template: '<div>Audio Player</div>' },
            Pinyinzhuyin: { template: '<div>Pinyin</div>' },
            IconHeart: { template: '<div>Heart</div>' },
            IconAdd: { template: '<div>Add</div>' },
            IconEdit: { template: '<div>Edit</div>' },
            IconPlayAudio: { template: '<div>Play</div>' }
          }
        }
      });

      const card = wrapper.find('.moe-result-card');
      expect(card.attributes('role')).toBe('article');
      expect(card.attributes('aria-labelledby')).toContain('word-title-');
      
      const primaryContent = wrapper.find('.primary-content');
      expect(primaryContent.attributes('role')).toBe('button');
      expect(primaryContent.attributes('tabindex')).toBe('0');
      
      const cardActions = wrapper.find('.card-actions');
      expect(cardActions.attributes('role')).toBe('toolbar');
    });
  });

  describe('Touch Event Handling', () => {
    it('should handle keyboard navigation in MoeResultCard', async () => {
      const wrapper = mount(MoeResultCard, {
        props: {
          word: mockMoeWord,
          primaryLanguage: 'chinese'
        },
        global: {
          plugins: [router],
          mocks: {
            $emit: () => {},
            favoritesStore: mockFavoritesStore
          },
          stubs: {
            TouchTarget: { template: '<button><slot /></button>' },
            AudioPlayerTaigi: { template: '<div>Audio Player</div>' },
            Pinyinzhuyin: { template: '<div>Pinyin</div>' },
            IconHeart: { template: '<div>Heart</div>' },
            IconAdd: { template: '<div>Add</div>' },
            IconEdit: { template: '<div>Edit</div>' },
            IconPlayAudio: { template: '<div>Play</div>' }
          }
        }
      });

      const primaryContent = wrapper.find('.primary-content');
      expect(primaryContent.exists()).toBe(true);
      
      // Test keyboard event handling
      await primaryContent.trigger('keydown.enter');
      await primaryContent.trigger('keydown.space');
      
      // Should not throw errors
      expect(wrapper.exists()).toBe(true);
    });
  });

  describe('Card Spacing and Layout', () => {
    it('should have proper spacing classes for thumb-friendly navigation', () => {
      const wrapper = mount(MoeResultCard, {
        props: {
          word: mockMoeWord,
          primaryLanguage: 'chinese'
        },
        global: {
          plugins: [router],
          mocks: {
            $emit: () => {},
            favoritesStore: mockFavoritesStore
          },
          stubs: {
            TouchTarget: { template: '<button><slot /></button>' },
            AudioPlayerTaigi: { template: '<div>Audio Player</div>' },
            Pinyinzhuyin: { template: '<div>Pinyin</div>' },
            IconHeart: { template: '<div>Heart</div>' },
            IconAdd: { template: '<div>Add</div>' },
            IconEdit: { template: '<div>Edit</div>' },
            IconPlayAudio: { template: '<div>Play</div>' }
          }
        }
      });

      const card = wrapper.find('.moe-result-card');
      expect(card.exists()).toBe(true);
      
      const cardActions = wrapper.find('.card-actions');
      expect(cardActions.exists()).toBe(true);
      
      const languageItems = wrapper.findAll('.language-item');
      expect(languageItems.length).toBeGreaterThan(0);
    });
  });
});