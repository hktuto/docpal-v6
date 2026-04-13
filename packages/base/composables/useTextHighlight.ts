/**
 * Composable for highlighting text matches
 */
export function useTextHighlight() {
  /**
   * Escapes HTML special characters to prevent XSS
   */
  function escapeHtml(text: string): string {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }

  /**
   * Escapes special regex characters
   */
  function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }

  /**
   * Highlights matching text with HTML mark tags
   * @param text - The text to highlight
   * @param keyword - The keyword(s) to search for (separated by spaces)
   * @param highlightClass - Optional CSS class for the mark tag (default: 'highlight')
   * @returns HTML string with highlighted text
   */
  function highlightText(text: string, keyword: string, highlightClass: string = 'highlight'): string {
    if (!keyword || !text) {
      return escapeHtml(text || '')
    }

    // Escape HTML first to prevent XSS
    let escapedText = escapeHtml(text)
    
    // Split keyword by spaces and filter out empty strings
    const keywords = keyword.trim().split(/\s+/).filter(k => k.length > 0)
    
    // If no valid keywords, return escaped text
    if (keywords.length === 0) {
      return escapedText
    }
    
    // Create regex pattern for all keywords (match any of them)
    const pattern = keywords.map(k => escapeRegex(k)).join('|')
    const regex = new RegExp(`(${pattern})`, 'gi')
    
    // Replace matches with mark tags
    return escapedText.replace(regex, `<mark class="${highlightClass}">$1</mark>`)
  }

  return {
    highlightText
  }
}

