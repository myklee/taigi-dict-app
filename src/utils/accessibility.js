/**
 * Accessibility utilities for screen reader announcements and ARIA management
 */

// Create a live region for screen reader announcements
let liveRegion = null;

/**
 * Initialize the live region for screen reader announcements
 */
export function initializeLiveRegion() {
  if (typeof document === 'undefined') return;
  
  if (!liveRegion) {
    liveRegion = document.createElement('div');
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.setAttribute('class', 'visually-hidden');
    liveRegion.setAttribute('id', 'live-region');
    document.body.appendChild(liveRegion);
  }
}

/**
 * Announce a message to screen readers
 * @param {string} message - The message to announce
 * @param {string} priority - 'polite' or 'assertive'
 */
export function announceToScreenReader(message, priority = 'polite') {
  if (typeof document === 'undefined' || !message) return;
  
  initializeLiveRegion();
  
  // Update the aria-live attribute if needed
  if (liveRegion.getAttribute('aria-live') !== priority) {
    liveRegion.setAttribute('aria-live', priority);
  }
  
  // Clear and set the message
  liveRegion.textContent = '';
  setTimeout(() => {
    liveRegion.textContent = message;
  }, 100);
}

/**
 * Generate a unique ID for ARIA relationships
 * @param {string} prefix - Prefix for the ID
 * @returns {string} Unique ID
 */
export function generateAriaId(prefix = 'aria') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Manage focus for modal dialogs and overlays
 */
export class FocusManager {
  constructor() {
    this.focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[role="button"]:not([disabled])',
      '[role="link"]',
      '[role="menuitem"]',
      '[role="tab"]'
    ].join(', ');
    
    this.previousFocus = null;
    this.trapStack = [];
  }
  
  /**
   * Get all focusable elements within a container
   * @param {Element} container - Container element
   * @returns {Element[]} Array of focusable elements
   */
  getFocusableElements(container) {
    if (!container) return [];
    
    const elements = Array.from(container.querySelectorAll(this.focusableSelectors));
    return elements.filter(element => {
      return element.offsetWidth > 0 && 
             element.offsetHeight > 0 && 
             !element.hasAttribute('disabled') &&
             element.tabIndex !== -1;
    });
  }
  
  /**
   * Trap focus within a container (for modals, dialogs)
   * @param {Element} container - Container to trap focus within
   */
  trapFocus(container) {
    if (!container) return;
    
    this.previousFocus = document.activeElement;
    this.trapStack.push(container);
    
    const focusableElements = this.getFocusableElements(container);
    if (focusableElements.length === 0) return;
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    // Focus the first element
    firstElement.focus();
    
    const handleKeyDown = (event) => {
      if (event.key !== 'Tab') return;
      
      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };
    
    container.addEventListener('keydown', handleKeyDown);
    container._focusTrapHandler = handleKeyDown;
  }
  
  /**
   * Release focus trap and restore previous focus
   * @param {Element} container - Container to release focus trap from
   */
  releaseFocusTrap(container) {
    if (!container) return;
    
    if (container._focusTrapHandler) {
      container.removeEventListener('keydown', container._focusTrapHandler);
      delete container._focusTrapHandler;
    }
    
    // Remove from trap stack
    const index = this.trapStack.indexOf(container);
    if (index > -1) {
      this.trapStack.splice(index, 1);
    }
    
    // Restore focus to previous element
    if (this.previousFocus && this.trapStack.length === 0) {
      this.previousFocus.focus();
      this.previousFocus = null;
    }
  }
  
  /**
   * Move focus to the next focusable element
   * @param {Element} container - Container to search within
   * @param {boolean} reverse - Whether to move backwards
   */
  moveFocus(container, reverse = false) {
    const focusableElements = this.getFocusableElements(container);
    if (focusableElements.length === 0) return;
    
    const currentIndex = focusableElements.indexOf(document.activeElement);
    let nextIndex;
    
    if (reverse) {
      nextIndex = currentIndex <= 0 ? focusableElements.length - 1 : currentIndex - 1;
    } else {
      nextIndex = currentIndex >= focusableElements.length - 1 ? 0 : currentIndex + 1;
    }
    
    focusableElements[nextIndex].focus();
  }
}

// Global focus manager instance
export const focusManager = new FocusManager();

/**
 * Keyboard navigation helpers
 */
export const KeyboardNavigation = {
  /**
   * Handle arrow key navigation for lists and grids
   * @param {KeyboardEvent} event - Keyboard event
   * @param {Element[]} elements - Array of navigable elements
   * @param {Object} options - Navigation options
   */
  handleArrowKeys(event, elements, options = {}) {
    const {
      orientation = 'vertical', // 'vertical', 'horizontal', 'grid'
      wrap = true,
      columns = 1
    } = options;
    
    if (!elements || elements.length === 0) return;
    
    const currentIndex = elements.indexOf(document.activeElement);
    if (currentIndex === -1) return;
    
    let nextIndex = currentIndex;
    
    switch (event.key) {
      case 'ArrowDown':
        if (orientation === 'vertical' || orientation === 'grid') {
          nextIndex = orientation === 'grid' 
            ? Math.min(currentIndex + columns, elements.length - 1)
            : currentIndex + 1;
        }
        break;
        
      case 'ArrowUp':
        if (orientation === 'vertical' || orientation === 'grid') {
          nextIndex = orientation === 'grid'
            ? Math.max(currentIndex - columns, 0)
            : currentIndex - 1;
        }
        break;
        
      case 'ArrowRight':
        if (orientation === 'horizontal' || orientation === 'grid') {
          nextIndex = currentIndex + 1;
        }
        break;
        
      case 'ArrowLeft':
        if (orientation === 'horizontal' || orientation === 'grid') {
          nextIndex = currentIndex - 1;
        }
        break;
        
      case 'Home':
        nextIndex = 0;
        break;
        
      case 'End':
        nextIndex = elements.length - 1;
        break;
        
      default:
        return;
    }
    
    // Handle wrapping
    if (wrap) {
      if (nextIndex < 0) nextIndex = elements.length - 1;
      if (nextIndex >= elements.length) nextIndex = 0;
    } else {
      nextIndex = Math.max(0, Math.min(nextIndex, elements.length - 1));
    }
    
    if (nextIndex !== currentIndex) {
      event.preventDefault();
      elements[nextIndex].focus();
    }
  },
  
  /**
   * Handle typeahead search in lists
   * @param {KeyboardEvent} event - Keyboard event
   * @param {Element[]} elements - Array of searchable elements
   * @param {Function} getSearchText - Function to get search text from element
   */
  handleTypeahead(event, elements, getSearchText) {
    if (!elements || elements.length === 0) return;
    
    const char = event.key.toLowerCase();
    if (char.length !== 1 || event.ctrlKey || event.altKey || event.metaKey) return;
    
    const currentIndex = elements.indexOf(document.activeElement);
    let searchIndex = currentIndex + 1;
    
    // Search from current position forward
    for (let i = 0; i < elements.length; i++) {
      const index = (searchIndex + i) % elements.length;
      const element = elements[index];
      const searchText = getSearchText(element).toLowerCase();
      
      if (searchText.startsWith(char)) {
        event.preventDefault();
        element.focus();
        return;
      }
    }
  }
};

/**
 * ARIA state management utilities
 */
export const AriaStateManager = {
  /**
   * Set ARIA expanded state and announce change
   * @param {Element} element - Element to update
   * @param {boolean} expanded - Whether element is expanded
   * @param {string} announcement - Optional custom announcement
   */
  setExpanded(element, expanded, announcement) {
    if (!element) return;
    
    element.setAttribute('aria-expanded', expanded.toString());
    
    if (announcement) {
      announceToScreenReader(announcement);
    } else {
      const defaultAnnouncement = expanded ? 'Expanded' : 'Collapsed';
      announceToScreenReader(defaultAnnouncement);
    }
  },
  
  /**
   * Set ARIA selected state and announce change
   * @param {Element} element - Element to update
   * @param {boolean} selected - Whether element is selected
   * @param {string} announcement - Optional custom announcement
   */
  setSelected(element, selected, announcement) {
    if (!element) return;
    
    element.setAttribute('aria-selected', selected.toString());
    
    if (announcement) {
      announceToScreenReader(announcement);
    }
  },
  
  /**
   * Set ARIA pressed state for toggle buttons
   * @param {Element} element - Element to update
   * @param {boolean} pressed - Whether button is pressed
   * @param {string} announcement - Optional custom announcement
   */
  setPressed(element, pressed, announcement) {
    if (!element) return;
    
    element.setAttribute('aria-pressed', pressed.toString());
    
    if (announcement) {
      announceToScreenReader(announcement);
    }
  },
  
  /**
   * Update ARIA live region content
   * @param {string} regionId - ID of the live region
   * @param {string} content - Content to announce
   * @param {string} priority - 'polite' or 'assertive'
   */
  updateLiveRegion(regionId, content, priority = 'polite') {
    const region = document.getElementById(regionId);
    if (!region) return;
    
    region.setAttribute('aria-live', priority);
    region.textContent = content;
  }
};

/**
 * Screen reader detection and optimization
 */
export const ScreenReaderUtils = {
  /**
   * Detect if a screen reader is likely being used
   * @returns {boolean} Whether screen reader is detected
   */
  isScreenReaderDetected() {
    // Check for common screen reader indicators
    return !!(
      window.navigator.userAgent.match(/NVDA|JAWS|VoiceOver|TalkBack|Orca/i) ||
      window.speechSynthesis ||
      document.querySelector('[aria-live]') ||
      window.navigator.userAgent.match(/Windows NT.*rv:/) // High contrast mode indicator
    );
  },
  
  /**
   * Optimize content for screen readers
   * @param {string} text - Text to optimize
   * @returns {string} Optimized text
   */
  optimizeForScreenReader(text) {
    if (!text) return '';
    
    return text
      // Add pauses for better pronunciation
      .replace(/([.!?])\s*([A-Z])/g, '$1 $2')
      // Expand common abbreviations
      .replace(/\bvs\b/gi, 'versus')
      .replace(/\be\.g\./gi, 'for example')
      .replace(/\bi\.e\./gi, 'that is')
      .replace(/\betc\./gi, 'etcetera')
      // Add pronunciation hints for numbers
      .replace(/(\d+)%/g, '$1 percent')
      .replace(/\$(\d+)/g, '$1 dollars')
      // Clean up extra whitespace
      .replace(/\s+/g, ' ')
      .trim();
  },
  
  /**
   * Create descriptive text for complex UI elements
   * @param {Object} element - Element description object
   * @returns {string} Descriptive text
   */
  createDescription(element) {
    const parts = [];
    
    if (element.type) parts.push(element.type);
    if (element.state) parts.push(element.state);
    if (element.position) parts.push(`${element.position.current} of ${element.position.total}`);
    if (element.level) parts.push(`level ${element.level}`);
    if (element.expanded !== undefined) parts.push(element.expanded ? 'expanded' : 'collapsed');
    if (element.selected !== undefined) parts.push(element.selected ? 'selected' : 'not selected');
    
    return parts.join(', ');
  }
};

/**
 * Initialize accessibility features
 */
export function initializeAccessibility() {
  initializeLiveRegion();
  
  // Add global keyboard event listeners for accessibility shortcuts
  document.addEventListener('keydown', (event) => {
    // Skip to main content (Alt + M)
    if (event.altKey && event.key === 'm') {
      event.preventDefault();
      const main = document.querySelector('main, [role="main"]');
      if (main) {
        main.focus();
        announceToScreenReader('Skipped to main content');
      }
    }
    
    // Skip to navigation (Alt + N)
    if (event.altKey && event.key === 'n') {
      event.preventDefault();
      const nav = document.querySelector('nav, [role="navigation"]');
      if (nav) {
        const firstLink = nav.querySelector('a, button, [tabindex="0"]');
        if (firstLink) {
          firstLink.focus();
          announceToScreenReader('Skipped to navigation');
        }
      }
    }
  });
  
  // Announce page changes for single-page applications
  let currentPath = window.location.pathname;
  const observer = new MutationObserver(() => {
    if (window.location.pathname !== currentPath) {
      currentPath = window.location.pathname;
      const title = document.title;
      announceToScreenReader(`Navigated to ${title}`);
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// Auto-initialize when DOM is ready
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAccessibility);
  } else {
    initializeAccessibility();
  }
}