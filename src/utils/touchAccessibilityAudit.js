/**
 * Touch Accessibility Audit Utility
 * Helps identify and fix touch target accessibility issues
 */

const MINIMUM_TOUCH_TARGET_SIZE = 44; // pixels
const COMFORTABLE_TOUCH_TARGET_SIZE = 48; // pixels
const MINIMUM_SPACING = 8; // pixels between touch targets

/**
 * Audit all interactive elements on the page for touch accessibility
 * @param {Element} container - Container element to audit (defaults to document.body)
 * @returns {Object} Audit results with issues and recommendations
 */
export function auditTouchTargets(container = document.body) {
  const results = {
    totalElements: 0,
    issues: [],
    warnings: [],
    passed: [],
    summary: {}
  };

  // Get all interactive elements
  const interactiveSelectors = [
    'button',
    'a[href]',
    'input[type="button"]',
    'input[type="submit"]',
    'input[type="reset"]',
    'input[type="checkbox"]',
    'input[type="radio"]',
    'select',
    'textarea',
    '[role="button"]',
    '[role="link"]',
    '[role="menuitem"]',
    '[role="tab"]',
    '[tabindex]:not([tabindex="-1"])',
    '.touch-target',
    '.icon-button'
  ];

  const elements = container.querySelectorAll(interactiveSelectors.join(', '));
  results.totalElements = elements.length;

  elements.forEach((element, index) => {
    const elementInfo = {
      element,
      index,
      tagName: element.tagName.toLowerCase(),
      className: element.className,
      id: element.id,
      rect: element.getBoundingClientRect(),
      issues: [],
      warnings: []
    };

    // Check if element is visible
    if (!isElementVisible(element)) {
      return; // Skip hidden elements
    }

    // Check touch target size
    const sizeIssues = checkTouchTargetSize(elementInfo);
    elementInfo.issues.push(...sizeIssues.issues);
    elementInfo.warnings.push(...sizeIssues.warnings);

    // Check spacing between touch targets
    const spacingIssues = checkTouchTargetSpacing(element, elements);
    elementInfo.issues.push(...spacingIssues);

    // Check accessibility attributes
    const accessibilityIssues = checkAccessibilityAttributes(element);
    elementInfo.issues.push(...accessibilityIssues);

    // Categorize results
    if (elementInfo.issues.length > 0) {
      results.issues.push(elementInfo);
    } else if (elementInfo.warnings.length > 0) {
      results.warnings.push(elementInfo);
    } else {
      results.passed.push(elementInfo);
    }
  });

  // Generate summary
  results.summary = {
    totalElements: results.totalElements,
    issuesCount: results.issues.length,
    warningsCount: results.warnings.length,
    passedCount: results.passed.length,
    passRate: ((results.passed.length / results.totalElements) * 100).toFixed(1)
  };

  return results;
}

/**
 * Check if an element is visible
 * @param {Element} element 
 * @returns {boolean}
 */
function isElementVisible(element) {
  const style = window.getComputedStyle(element);
  const rect = element.getBoundingClientRect();
  
  return (
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    style.opacity !== '0' &&
    rect.width > 0 &&
    rect.height > 0
  );
}

/**
 * Check touch target size requirements
 * @param {Object} elementInfo 
 * @returns {Object} Issues and warnings
 */
function checkTouchTargetSize(elementInfo) {
  const { rect, element } = elementInfo;
  const issues = [];
  const warnings = [];

  const width = rect.width;
  const height = rect.height;
  const minDimension = Math.min(width, height);

  if (minDimension < MINIMUM_TOUCH_TARGET_SIZE) {
    issues.push({
      type: 'size',
      severity: 'error',
      message: `Touch target too small: ${width.toFixed(1)}x${height.toFixed(1)}px (minimum: ${MINIMUM_TOUCH_TARGET_SIZE}px)`,
      recommendation: `Increase size to at least ${MINIMUM_TOUCH_TARGET_SIZE}x${MINIMUM_TOUCH_TARGET_SIZE}px`,
      currentSize: { width, height },
      minimumSize: MINIMUM_TOUCH_TARGET_SIZE
    });
  } else if (minDimension < COMFORTABLE_TOUCH_TARGET_SIZE) {
    warnings.push({
      type: 'size',
      severity: 'warning',
      message: `Touch target could be larger: ${width.toFixed(1)}x${height.toFixed(1)}px (recommended: ${COMFORTABLE_TOUCH_TARGET_SIZE}px)`,
      recommendation: `Consider increasing size to ${COMFORTABLE_TOUCH_TARGET_SIZE}x${COMFORTABLE_TOUCH_TARGET_SIZE}px for better usability`,
      currentSize: { width, height },
      recommendedSize: COMFORTABLE_TOUCH_TARGET_SIZE
    });
  }

  return { issues, warnings };
}

/**
 * Check spacing between touch targets
 * @param {Element} element 
 * @param {NodeList} allElements 
 * @returns {Array} Issues found
 */
function checkTouchTargetSpacing(element, allElements) {
  const issues = [];
  const rect = element.getBoundingClientRect();

  // Find nearby interactive elements
  const nearbyElements = Array.from(allElements).filter(other => {
    if (other === element || !isElementVisible(other)) return false;
    
    const otherRect = other.getBoundingClientRect();
    const distance = getMinimumDistance(rect, otherRect);
    
    return distance < MINIMUM_SPACING && distance >= 0;
  });

  if (nearbyElements.length > 0) {
    nearbyElements.forEach(nearby => {
      const nearbyRect = nearby.getBoundingClientRect();
      const distance = getMinimumDistance(rect, nearbyRect);
      
      issues.push({
        type: 'spacing',
        severity: 'warning',
        message: `Insufficient spacing to nearby touch target: ${distance.toFixed(1)}px (minimum: ${MINIMUM_SPACING}px)`,
        recommendation: `Increase spacing between touch targets to at least ${MINIMUM_SPACING}px`,
        nearbyElement: nearby,
        currentSpacing: distance,
        minimumSpacing: MINIMUM_SPACING
      });
    });
  }

  return issues;
}

/**
 * Calculate minimum distance between two rectangles
 * @param {DOMRect} rect1 
 * @param {DOMRect} rect2 
 * @returns {number} Distance in pixels
 */
function getMinimumDistance(rect1, rect2) {
  const left = Math.max(rect1.left, rect2.left);
  const right = Math.min(rect1.right, rect2.right);
  const top = Math.max(rect1.top, rect2.top);
  const bottom = Math.min(rect1.bottom, rect2.bottom);

  if (left < right && top < bottom) {
    return 0; // Overlapping
  }

  const dx = Math.max(0, left - right);
  const dy = Math.max(0, top - bottom);
  
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Check accessibility attributes
 * @param {Element} element 
 * @returns {Array} Issues found
 */
function checkAccessibilityAttributes(element) {
  const issues = [];
  const tagName = element.tagName.toLowerCase();

  // Check for aria-label or accessible text
  const hasAccessibleName = (
    element.getAttribute('aria-label') ||
    element.getAttribute('aria-labelledby') ||
    element.textContent.trim() ||
    element.querySelector('img[alt]') ||
    element.title
  );

  if (!hasAccessibleName) {
    issues.push({
      type: 'accessibility',
      severity: 'error',
      message: 'Touch target lacks accessible name',
      recommendation: 'Add aria-label, visible text, or other accessible name',
      missingAttribute: 'accessible-name'
    });
  }

  // Check for proper role
  if (element.getAttribute('role') === 'button' && tagName !== 'button') {
    const hasTabIndex = element.hasAttribute('tabindex');
    if (!hasTabIndex) {
      issues.push({
        type: 'accessibility',
        severity: 'warning',
        message: 'Element with button role should be focusable',
        recommendation: 'Add tabindex="0" to make element keyboard accessible',
        missingAttribute: 'tabindex'
      });
    }
  }

  // Check for disabled state accessibility
  if (element.disabled || element.getAttribute('aria-disabled') === 'true') {
    const hasDisabledStyling = window.getComputedStyle(element).opacity < 1;
    if (!hasDisabledStyling) {
      issues.push({
        type: 'accessibility',
        severity: 'warning',
        message: 'Disabled state should be visually indicated',
        recommendation: 'Add visual styling to indicate disabled state',
        missingFeature: 'disabled-styling'
      });
    }
  }

  return issues;
}

/**
 * Generate a detailed report of touch accessibility issues
 * @param {Object} auditResults 
 * @returns {string} Formatted report
 */
export function generateTouchAccessibilityReport(auditResults) {
  const { summary, issues, warnings } = auditResults;
  
  let report = `Touch Accessibility Audit Report\n`;
  report += `=====================================\n\n`;
  
  report += `Summary:\n`;
  report += `- Total elements audited: ${summary.totalElements}\n`;
  report += `- Elements with issues: ${summary.issuesCount}\n`;
  report += `- Elements with warnings: ${summary.warningsCount}\n`;
  report += `- Elements passed: ${summary.passedCount}\n`;
  report += `- Pass rate: ${summary.passRate}%\n\n`;

  if (issues.length > 0) {
    report += `Critical Issues (${issues.length}):\n`;
    report += `====================\n`;
    issues.forEach((elementInfo, index) => {
      report += `${index + 1}. ${elementInfo.tagName}`;
      if (elementInfo.className) report += `.${elementInfo.className}`;
      if (elementInfo.id) report += `#${elementInfo.id}`;
      report += `\n`;
      
      elementInfo.issues.forEach(issue => {
        report += `   - ${issue.message}\n`;
        report += `     Recommendation: ${issue.recommendation}\n`;
      });
      report += `\n`;
    });
  }

  if (warnings.length > 0) {
    report += `Warnings (${warnings.length}):\n`;
    report += `=============\n`;
    warnings.forEach((elementInfo, index) => {
      report += `${index + 1}. ${elementInfo.tagName}`;
      if (elementInfo.className) report += `.${elementInfo.className}`;
      if (elementInfo.id) report += `#${elementInfo.id}`;
      report += `\n`;
      
      elementInfo.warnings.forEach(warning => {
        report += `   - ${warning.message}\n`;
        report += `     Recommendation: ${warning.recommendation}\n`;
      });
      report += `\n`;
    });
  }

  return report;
}

/**
 * Fix common touch accessibility issues automatically
 * @param {Element} container 
 * @returns {Object} Results of fixes applied
 */
export function autoFixTouchAccessibility(container = document.body) {
  const results = {
    fixed: [],
    skipped: [],
    errors: []
  };

  const auditResults = auditTouchTargets(container);
  
  auditResults.issues.forEach(elementInfo => {
    const { element, issues } = elementInfo;
    
    issues.forEach(issue => {
      try {
        switch (issue.type) {
          case 'size':
            if (autoFixSize(element, issue)) {
              results.fixed.push({ element, issue, fix: 'size' });
            } else {
              results.skipped.push({ element, issue, reason: 'Cannot auto-fix size' });
            }
            break;
            
          case 'accessibility':
            if (autoFixAccessibility(element, issue)) {
              results.fixed.push({ element, issue, fix: 'accessibility' });
            } else {
              results.skipped.push({ element, issue, reason: 'Cannot auto-fix accessibility' });
            }
            break;
            
          default:
            results.skipped.push({ element, issue, reason: 'No auto-fix available' });
        }
      } catch (error) {
        results.errors.push({ element, issue, error: error.message });
      }
    });
  });

  return results;
}

/**
 * Attempt to auto-fix size issues
 * @param {Element} element 
 * @param {Object} issue 
 * @returns {boolean} Success
 */
function autoFixSize(element, issue) {
  // Only fix if element doesn't already have explicit sizing
  const style = window.getComputedStyle(element);
  if (style.minWidth !== 'auto' || style.minHeight !== 'auto') {
    return false;
  }

  // Apply minimum touch target size
  element.style.minWidth = `${MINIMUM_TOUCH_TARGET_SIZE}px`;
  element.style.minHeight = `${MINIMUM_TOUCH_TARGET_SIZE}px`;
  element.style.display = element.style.display || 'inline-flex';
  element.style.alignItems = 'center';
  element.style.justifyContent = 'center';

  return true;
}

/**
 * Attempt to auto-fix accessibility issues
 * @param {Element} element 
 * @param {Object} issue 
 * @returns {boolean} Success
 */
function autoFixAccessibility(element, issue) {
  switch (issue.missingAttribute) {
    case 'accessible-name':
      // Try to generate a reasonable accessible name
      const text = element.textContent.trim();
      if (text) {
        element.setAttribute('aria-label', text);
        return true;
      }
      break;
      
    case 'tabindex':
      element.setAttribute('tabindex', '0');
      return true;
      
    default:
      return false;
  }
  
  return false;
}

/**
 * Development helper to run audit and log results
 */
export function runTouchAccessibilityAudit() {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  const results = auditTouchTargets();
  const report = generateTouchAccessibilityReport(results);
  
  console.group('🔍 Touch Accessibility Audit');
  console.log(report);
  
  if (results.issues.length > 0) {
    console.warn(`Found ${results.issues.length} critical touch accessibility issues`);
    console.table(results.issues.map(item => ({
      element: `${item.tagName}${item.className ? '.' + item.className : ''}${item.id ? '#' + item.id : ''}`,
      issues: item.issues.length,
      firstIssue: item.issues[0]?.message || ''
    })));
  }
  
  if (results.warnings.length > 0) {
    console.warn(`Found ${results.warnings.length} touch accessibility warnings`);
  }
  
  console.groupEnd();
  
  return results;
}