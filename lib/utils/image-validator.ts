/**
 * Image URL validation and sanitization utilities
 * Ensures no base64 data URLs reach the database
 */

/**
 * Sanitize an image URL by removing base64 data URLs
 * @param url - The URL to sanitize
 * @returns Valid HTTP/HTTPS URL, or null if invalid
 */
export function sanitizeImageUrl(url: string | null | undefined): string | null {
  // Handle null/undefined/empty
  if (!url || url === '' || url === 'undefined' || url === 'null') {
    return null;
  }

  // Convert to string and trim
  const urlStr = String(url).trim();

  // Reject base64 data URLs completely
  if (urlStr.startsWith('data:')) {
    console.warn('[IMAGE VALIDATOR] Blocked base64 data URL');
    return null;
  }

  // Only accept HTTP/HTTPS URLs
  if (!urlStr.startsWith('http://') && !urlStr.startsWith('https://')) {
    console.warn(`[IMAGE VALIDATOR] Blocked invalid URL: ${urlStr.substring(0, 50)}`);
    return null;
  }

  // Additional validation for very long strings (likely base64)
  if (urlStr.length > 2000) {
    console.warn('[IMAGE VALIDATOR] Blocked suspiciously long URL (likely base64)');
    return null;
  }

  // Valid URL
  return urlStr;
}

/**
 * Sanitize multiple image URLs in an object
 * @param obj - Object containing image URLs
 * @param fields - Array of field names to sanitize
 * @returns Object with sanitized URLs
 */
export function sanitizeImageFields<T extends Record<string, any>>(
  obj: T,
  fields: string[]
): T {
  const sanitized = { ...obj } as any;

  for (const field of fields) {
    if (field in sanitized) {
      sanitized[field] = sanitizeImageUrl(sanitized[field]);
    }
  }

  return sanitized as T;
}

/**
 * Validate and sanitize ticket group data
 * @param ticketGroup - Ticket group data to validate
 * @returns Sanitized ticket group data
 */
export function sanitizeTicketGroup(ticketGroup: any): any {
  return {
    ...ticketGroup,
    seatViewUrl: sanitizeImageUrl(ticketGroup.seatViewUrl),
    seatViewUrl2: sanitizeImageUrl(ticketGroup.seatViewUrl2),
  };
}

/**
 * Validate and sanitize an array of ticket groups
 * @param ticketGroups - Array of ticket groups to validate
 * @returns Array of sanitized ticket groups
 */
export function sanitizeTicketGroups(ticketGroups: any[]): any[] {
  return ticketGroups.map(sanitizeTicketGroup);
}