/**
 * Accessibility preferences management
 */

// Preference keys for localStorage
const PREFS_KEY = 'accessibility-preferences';

// Default preferences
const DEFAULT_PREFERENCES = {
  highContrast: false,
  reducedMotion: false,
  reducedTransparency: false,
  largeText: false,
  patternIndicators: false,
  announceChanges: true,
  keyboardShortcuts: true,
  focusIndicators: true
};

/**
 * Get current accessibility preferences
 */
export function getAccessibilityPreferences() {
  try {
    const stored = localStorage.getItem(PREFS_KEY);
    if (stored) {
      return { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.warn('Failed to load accessibility preferences:', error);
  }
  
  return { ...DEFAULT_PREFERENCES };
}

/**
 * Save accessibility preferences
 */
export function saveAccessibilityPreferences(preferences) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(preferences));
    applyAccessibilityPreferences(preferences);
    return true;
  } catch (error) {
    console.error('Failed to save accessibility preferences:', error);
    return false;
  }
}

/**
 * Apply accessibility preferences to the document
 */
export function applyAccessibilityPreferences(preferences = null) {
  const prefs = preferences || getAccessibilityPreferences();
  const root = document.documentElement;
  
  // High contrast mode
  if (prefs.highContrast) {
    root.classList.add('high-contrast-mode');
  } else {
    root.classList.remove('high-contrast-mode');
  }
  
  // Reduced motion
  if (prefs.reducedMotion) {
    root.classList.add('reduced-motion');
  } else {
    root.classList.remove('reduced-motion');
  }
  
  // Reduced transparency
  if (prefs.reducedTransparency) {
    root.classList.add('reduced-transparency');
  } else {
    root.classList.remove('reduced-transparency');
  }
  
  // Large text
  if (prefs.largeText) {
    root.classList.add('large-text');
  } else {
    root.classList.remove('large-text');
  }
  
  // Pattern indicators for color-blind users
  if (prefs.patternIndicators) {
    root.classList.add('pattern-indicators');
  } else {
    root.classList.remove('pattern-indicators');
  }
  
  // Enhanced focus indicators
  if (prefs.focusIndicators) {
    root.classList.add('enhanced-focus');
  } else {
    root.classList.remove('enhanced-focus');
  }
}

/**
 * Detect system accessibility preferences
 */
export function detectSystemPreferences() {
  const preferences = { ...DEFAULT_PREFERENCES };
  
  // Check for prefers-reduced-motion
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    preferences.reducedMotion = true;
  }
  
  // Check for prefers-contrast
  if (window.matchMedia && window.matchMedia('(prefers-contrast: high)').matches) {
    preferences.highContrast = true;
  }
  
  // Check for prefers-reduced-transparency
  if (window.matchMedia && window.matchMedia('(prefers-reduced-transparency: reduce)').matches) {
    preferences.reducedTransparency = true;
  }
  
  return preferences;
}

/**
 * Watch for system preference changes
 */
export function watchSystemPreferences(callback) {
  const mediaQueries = [
    { query: '(prefers-reduced-motion: reduce)', key: 'reducedMotion' },
    { query: '(prefers-contrast: high)', key: 'highContrast' },
    { query: '(prefers-reduced-transparency: reduce)', key: 'reducedTransparency' }
  ];
  
  const listeners = [];
  
  mediaQueries.forEach(({ query, key }) => {
    if (window.matchMedia) {
      const mq = window.matchMedia(query);
      const listener = (e) => {
        const currentPrefs = getAccessibilityPreferences();
        currentPrefs[key] = e.matches;
        saveAccessibilityPreferences(currentPrefs);
        if (callback) callback(currentPrefs);
      };
      
      mq.addListener(listener);
      listeners.push({ mq, listener });
    }
  });
  
  // Return cleanup function
  return () => {
    listeners.forEach(({ mq, listener }) => {
      mq.removeListener(listener);
    });
  };
}

/**
 * Toggle a specific accessibility preference
 */
export function togglePreference(key) {
  const preferences = getAccessibilityPreferences();
  preferences[key] = !preferences[key];
  saveAccessibilityPreferences(preferences);
  return preferences[key];
}

/**
 * Reset preferences to defaults
 */
export function resetPreferences() {
  const preferences = { ...DEFAULT_PREFERENCES };
  saveAccessibilityPreferences(preferences);
  return preferences;
}

/**
 * Get color contrast ratio between two colors
 */
export function getContrastRatio(color1, color2) {
  // Convert colors to RGB if needed
  const rgb1 = hexToRgb(color1) || color1;
  const rgb2 = hexToRgb(color2) || color2;
  
  // Calculate relative luminance
  const l1 = getRelativeLuminance(rgb1);
  const l2 = getRelativeLuminance(rgb2);
  
  // Calculate contrast ratio
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

/**
 * Calculate relative luminance of a color
 */
function getRelativeLuminance(rgb) {
  const { r, g, b } = rgb;
  
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Check if a color combination meets WCAG contrast requirements
 */
export function meetsContrastRequirement(color1, color2, level = 'AA', size = 'normal') {
  const ratio = getContrastRatio(color1, color2);
  
  if (level === 'AAA') {
    return size === 'large' ? ratio >= 4.5 : ratio >= 7;
  } else {
    return size === 'large' ? ratio >= 3 : ratio >= 4.5;
  }
}

/**
 * Generate alternative color with better contrast
 */
export function generateContrastColor(backgroundColor, textColor, targetRatio = 4.5) {
  const bgRgb = hexToRgb(backgroundColor);
  const textRgb = hexToRgb(textColor);
  
  if (!bgRgb || !textRgb) return textColor;
  
  const currentRatio = getContrastRatio(bgRgb, textRgb);
  
  if (currentRatio >= targetRatio) {
    return textColor;
  }
  
  // Try making text darker or lighter
  const bgLuminance = getRelativeLuminance(bgRgb);
  
  if (bgLuminance > 0.5) {
    // Light background, make text darker
    return adjustColorBrightness(textColor, -0.2);
  } else {
    // Dark background, make text lighter
    return adjustColorBrightness(textColor, 0.2);
  }
}

/**
 * Adjust color brightness
 */
function adjustColorBrightness(color, amount) {
  const rgb = hexToRgb(color);
  if (!rgb) return color;
  
  const adjust = (c) => Math.max(0, Math.min(255, c + (amount * 255)));
  
  const newRgb = {
    r: Math.round(adjust(rgb.r)),
    g: Math.round(adjust(rgb.g)),
    b: Math.round(adjust(rgb.b))
  };
  
  return `#${newRgb.r.toString(16).padStart(2, '0')}${newRgb.g.toString(16).padStart(2, '0')}${newRgb.b.toString(16).padStart(2, '0')}`;
}

/**
 * Initialize accessibility preferences on app start
 */
export function initializeAccessibilityPreferences() {
  // Detect system preferences first
  const systemPrefs = detectSystemPreferences();
  
  // Get stored preferences or use system preferences as defaults
  let storedPrefs;
  try {
    const stored = localStorage.getItem(PREFS_KEY);
    storedPrefs = stored ? JSON.parse(stored) : systemPrefs;
  } catch (error) {
    storedPrefs = systemPrefs;
  }
  
  // Apply preferences
  applyAccessibilityPreferences(storedPrefs);
  
  // Watch for system changes
  watchSystemPreferences((newPrefs) => {
    console.log('System accessibility preferences changed:', newPrefs);
  });
  
  return storedPrefs;
}

/**
 * Create accessibility preferences panel
 */
export function createAccessibilityPanel() {
  const panel = document.createElement('div');
  panel.className = 'accessibility-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-labelledby', 'accessibility-panel-title');
  panel.setAttribute('aria-modal', 'true');
  
  const preferences = getAccessibilityPreferences();
  
  panel.innerHTML = `
    <div class="accessibility-panel-content">
      <header class="accessibility-panel-header">
        <h2 id="accessibility-panel-title">Accessibility Preferences</h2>
        <button class="accessibility-panel-close" aria-label="Close accessibility preferences">×</button>
      </header>
      
      <div class="accessibility-panel-body">
        <fieldset>
          <legend>Visual Preferences</legend>
          
          <label class="accessibility-option">
            <input type="checkbox" ${preferences.highContrast ? 'checked' : ''} data-pref="highContrast">
            <span>High contrast mode</span>
            <small>Increases contrast between text and background colors</small>
          </label>
          
          <label class="accessibility-option">
            <input type="checkbox" ${preferences.reducedTransparency ? 'checked' : ''} data-pref="reducedTransparency">
            <span>Reduce transparency</span>
            <small>Removes transparent backgrounds and glass effects</small>
          </label>
          
          <label class="accessibility-option">
            <input type="checkbox" ${preferences.largeText ? 'checked' : ''} data-pref="largeText">
            <span>Large text</span>
            <small>Increases font sizes throughout the application</small>
          </label>
          
          <label class="accessibility-option">
            <input type="checkbox" ${preferences.patternIndicators ? 'checked' : ''} data-pref="patternIndicators">
            <span>Pattern indicators</span>
            <small>Uses patterns in addition to colors for status indicators</small>
          </label>
        </fieldset>
        
        <fieldset>
          <legend>Motion Preferences</legend>
          
          <label class="accessibility-option">
            <input type="checkbox" ${preferences.reducedMotion ? 'checked' : ''} data-pref="reducedMotion">
            <span>Reduce motion</span>
            <small>Minimizes animations and transitions</small>
          </label>
        </fieldset>
        
        <fieldset>
          <legend>Interaction Preferences</legend>
          
          <label class="accessibility-option">
            <input type="checkbox" ${preferences.announceChanges ? 'checked' : ''} data-pref="announceChanges">
            <span>Announce changes</span>
            <small>Screen reader announcements for dynamic content</small>
          </label>
          
          <label class="accessibility-option">
            <input type="checkbox" ${preferences.keyboardShortcuts ? 'checked' : ''} data-pref="keyboardShortcuts">
            <span>Keyboard shortcuts</span>
            <small>Enable keyboard shortcuts for common actions</small>
          </label>
          
          <label class="accessibility-option">
            <input type="checkbox" ${preferences.focusIndicators ? 'checked' : ''} data-pref="focusIndicators">
            <span>Enhanced focus indicators</span>
            <small>More visible focus outlines for keyboard navigation</small>
          </label>
        </fieldset>
      </div>
      
      <footer class="accessibility-panel-footer">
        <button class="accessibility-panel-reset">Reset to Defaults</button>
        <button class="accessibility-panel-save">Save Preferences</button>
      </footer>
    </div>
  `;
  
  // Add event listeners
  const checkboxes = panel.querySelectorAll('input[type="checkbox"]');
  checkboxes.forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
      const pref = e.target.dataset.pref;
      const currentPrefs = getAccessibilityPreferences();
      currentPrefs[pref] = e.target.checked;
      applyAccessibilityPreferences(currentPrefs);
    });
  });
  
  // Close button
  panel.querySelector('.accessibility-panel-close').addEventListener('click', () => {
    document.body.removeChild(panel);
  });
  
  // Reset button
  panel.querySelector('.accessibility-panel-reset').addEventListener('click', () => {
    const defaultPrefs = resetPreferences();
    // Update checkboxes
    checkboxes.forEach(checkbox => {
      const pref = checkbox.dataset.pref;
      checkbox.checked = defaultPrefs[pref];
    });
  });
  
  // Save button
  panel.querySelector('.accessibility-panel-save').addEventListener('click', () => {
    const currentPrefs = getAccessibilityPreferences();
    saveAccessibilityPreferences(currentPrefs);
    document.body.removeChild(panel);
  });
  
  return panel;
}