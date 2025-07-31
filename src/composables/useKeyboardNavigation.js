/**
 * Composable for keyboard navigation support
 */
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import { KeyboardNavigation, announceToScreenReader } from '@/utils/accessibility.js';

export function useKeyboardNavigation(options = {}) {
  const {
    orientation = 'vertical',
    wrap = true,
    columns = 1,
    enableTypeahead = false,
    getSearchText = (element) => element.textContent || '',
    announceNavigation = true
  } = options;

  const currentIndex = ref(-1);
  const elements = ref([]);
  const container = ref(null);
  const typeaheadBuffer = ref('');
  const typeaheadTimeout = ref(null);

  /**
   * Update the list of navigable elements
   */
  const updateElements = () => {
    if (!container.value) return;
    
    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[role="button"]:not([disabled])',
      '[role="link"]',
      '[role="menuitem"]',
      '[role="tab"]',
      '[role="option"]'
    ].join(', ');
    
    const newElements = Array.from(container.value.querySelectorAll(focusableSelectors))
      .filter(element => {
        return element.offsetWidth > 0 && 
               element.offsetHeight > 0 && 
               !element.hasAttribute('disabled') &&
               element.tabIndex !== -1;
      });
    
    elements.value = newElements;
    
    // Update current index if active element changed
    const activeElement = document.activeElement;
    const newIndex = elements.value.indexOf(activeElement);
    if (newIndex !== -1) {
      currentIndex.value = newIndex;
    }
  };

  /**
   * Focus an element by index
   */
  const focusElement = (index, announce = announceNavigation) => {
    if (index < 0 || index >= elements.value.length) return;
    
    const element = elements.value[index];
    if (!element) return;
    
    element.focus();
    currentIndex.value = index;
    
    if (announce) {
      const position = `${index + 1} of ${elements.value.length}`;
      const text = getSearchText(element);
      announceToScreenReader(`${text}, ${position}`);
    }
  };

  /**
   * Move focus to next/previous element
   */
  const moveFocus = (direction, announce = announceNavigation) => {
    if (elements.value.length === 0) return;
    
    let nextIndex = currentIndex.value;
    
    if (direction === 'next') {
      nextIndex = currentIndex.value + 1;
      if (nextIndex >= elements.value.length) {
        nextIndex = wrap ? 0 : elements.value.length - 1;
      }
    } else if (direction === 'previous') {
      nextIndex = currentIndex.value - 1;
      if (nextIndex < 0) {
        nextIndex = wrap ? elements.value.length - 1 : 0;
      }
    } else if (direction === 'first') {
      nextIndex = 0;
    } else if (direction === 'last') {
      nextIndex = elements.value.length - 1;
    }
    
    focusElement(nextIndex, announce);
  };

  /**
   * Handle keyboard events
   */
  const handleKeyDown = (event) => {
    // Don't interfere with form inputs when they have focus
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName) && 
        !event.target.hasAttribute('readonly')) {
      return;
    }
    
    // Handle arrow keys
    KeyboardNavigation.handleArrowKeys(event, elements.value, {
      orientation,
      wrap,
      columns
    });
    
    // Handle typeahead if enabled
    if (enableTypeahead) {
      KeyboardNavigation.handleTypeahead(event, elements.value, getSearchText);
    }
    
    // Handle additional navigation keys
    switch (event.key) {
      case 'Home':
        event.preventDefault();
        moveFocus('first');
        break;
        
      case 'End':
        event.preventDefault();
        moveFocus('last');
        break;
        
      case 'PageUp':
        event.preventDefault();
        // Move up by 10 items or to first
        const pageUpIndex = Math.max(0, currentIndex.value - 10);
        focusElement(pageUpIndex);
        break;
        
      case 'PageDown':
        event.preventDefault();
        // Move down by 10 items or to last
        const pageDownIndex = Math.min(elements.value.length - 1, currentIndex.value + 10);
        focusElement(pageDownIndex);
        break;
    }
  };

  /**
   * Handle focus events to track current position
   */
  const handleFocus = (event) => {
    const index = elements.value.indexOf(event.target);
    if (index !== -1) {
      currentIndex.value = index;
    }
  };

  /**
   * Initialize keyboard navigation
   */
  const initialize = (containerElement) => {
    container.value = containerElement;
    
    nextTick(() => {
      updateElements();
      
      if (container.value) {
        container.value.addEventListener('keydown', handleKeyDown);
        container.value.addEventListener('focus', handleFocus, true);
        
        // Set up mutation observer to track DOM changes
        const observer = new MutationObserver(() => {
          updateElements();
        });
        
        observer.observe(container.value, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ['disabled', 'tabindex', 'hidden']
        });
        
        container.value._keyboardNavObserver = observer;
      }
    });
  };

  /**
   * Cleanup keyboard navigation
   */
  const cleanup = () => {
    if (container.value) {
      container.value.removeEventListener('keydown', handleKeyDown);
      container.value.removeEventListener('focus', handleFocus, true);
      
      if (container.value._keyboardNavObserver) {
        container.value._keyboardNavObserver.disconnect();
        delete container.value._keyboardNavObserver;
      }
    }
    
    if (typeaheadTimeout.value) {
      clearTimeout(typeaheadTimeout.value);
    }
  };

  /**
   * Focus first element
   */
  const focusFirst = () => {
    if (elements.value.length > 0) {
      focusElement(0);
    }
  };

  /**
   * Focus last element
   */
  const focusLast = () => {
    if (elements.value.length > 0) {
      focusElement(elements.value.length - 1);
    }
  };

  /**
   * Find and focus element by text content
   */
  const focusByText = (searchText) => {
    const index = elements.value.findIndex(element => {
      const text = getSearchText(element).toLowerCase();
      return text.includes(searchText.toLowerCase());
    });
    
    if (index !== -1) {
      focusElement(index);
      return true;
    }
    
    return false;
  };

  onUnmounted(() => {
    cleanup();
  });

  return {
    // State
    currentIndex,
    elements,
    container,
    
    // Methods
    initialize,
    cleanup,
    updateElements,
    focusElement,
    moveFocus,
    focusFirst,
    focusLast,
    focusByText,
    handleKeyDown,
    handleFocus
  };
}

/**
 * Composable for roving tabindex pattern
 */
export function useRovingTabindex(options = {}) {
  const {
    selector = '[role="option"], [role="menuitem"], [role="tab"]',
    activeClass = 'active',
    announceChanges = true
  } = options;

  const container = ref(null);
  const activeElement = ref(null);
  const elements = ref([]);

  /**
   * Update elements and tabindex values
   */
  const updateTabindex = () => {
    if (!container.value) return;
    
    elements.value = Array.from(container.value.querySelectorAll(selector));
    
    elements.value.forEach((element, index) => {
      if (element === activeElement.value) {
        element.tabIndex = 0;
        element.classList.add(activeClass);
      } else {
        element.tabIndex = -1;
        element.classList.remove(activeClass);
      }
    });
  };

  /**
   * Set active element
   */
  const setActive = (element, announce = announceChanges) => {
    if (!element || !elements.value.includes(element)) return;
    
    activeElement.value = element;
    updateTabindex();
    
    if (announce) {
      const index = elements.value.indexOf(element);
      const text = element.textContent || element.getAttribute('aria-label') || '';
      announceToScreenReader(`${text}, ${index + 1} of ${elements.value.length}`);
    }
  };

  /**
   * Move to next/previous element
   */
  const move = (direction) => {
    if (elements.value.length === 0) return;
    
    const currentIndex = elements.value.indexOf(activeElement.value);
    let nextIndex;
    
    if (direction === 'next') {
      nextIndex = currentIndex + 1;
      if (nextIndex >= elements.value.length) nextIndex = 0;
    } else {
      nextIndex = currentIndex - 1;
      if (nextIndex < 0) nextIndex = elements.value.length - 1;
    }
    
    const nextElement = elements.value[nextIndex];
    setActive(nextElement);
    nextElement.focus();
  };

  /**
   * Handle keyboard navigation
   */
  const handleKeyDown = (event) => {
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        event.preventDefault();
        move('next');
        break;
        
      case 'ArrowUp':
      case 'ArrowLeft':
        event.preventDefault();
        move('previous');
        break;
        
      case 'Home':
        event.preventDefault();
        if (elements.value.length > 0) {
          setActive(elements.value[0]);
          elements.value[0].focus();
        }
        break;
        
      case 'End':
        event.preventDefault();
        if (elements.value.length > 0) {
          const lastElement = elements.value[elements.value.length - 1];
          setActive(lastElement);
          lastElement.focus();
        }
        break;
    }
  };

  /**
   * Initialize roving tabindex
   */
  const initialize = (containerElement) => {
    container.value = containerElement;
    
    nextTick(() => {
      elements.value = Array.from(container.value.querySelectorAll(selector));
      
      // Set first element as active if none is active
      if (elements.value.length > 0 && !activeElement.value) {
        setActive(elements.value[0], false);
      }
      
      container.value.addEventListener('keydown', handleKeyDown);
      
      // Handle focus events
      elements.value.forEach(element => {
        element.addEventListener('focus', () => {
          setActive(element, false);
        });
      });
    });
  };

  /**
   * Cleanup
   */
  const cleanup = () => {
    if (container.value) {
      container.value.removeEventListener('keydown', handleKeyDown);
    }
  };

  onUnmounted(() => {
    cleanup();
  });

  return {
    container,
    activeElement,
    elements,
    initialize,
    cleanup,
    setActive,
    move,
    handleKeyDown
  };
}