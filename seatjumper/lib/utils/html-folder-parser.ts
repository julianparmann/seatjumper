import { ParsedTicket } from './ticket-parser';

interface HTMLFolderContent {
  htmlFile: File | null;
  imageFiles: Map<string, File>;
  tickets: ParsedTicket[];
  imageMapping: Map<number, string>; // ticket index to image URL
}

/**
 * Process uploaded folder containing HTML and images
 */
export async function processHTMLFolder(files: FileList): Promise<HTMLFolderContent> {
  const result: HTMLFolderContent = {
    htmlFile: null,
    imageFiles: new Map(),
    tickets: [],
    imageMapping: new Map()
  };

  // Separate HTML and image files
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const path = (file as any).webkitRelativePath || file.name;

    if (file.type === 'text/html' || path.endsWith('.html')) {
      result.htmlFile = file;
    } else if (file.type.startsWith('image/') || path.includes('/images/')) {
      // Store image files by their relative path/name
      const imageName = path.split('/').pop() || file.name;
      result.imageFiles.set(imageName, file);
    }
  }

  if (!result.htmlFile) {
    throw new Error('No HTML file found in the uploaded folder');
  }

  // Read and parse HTML file
  const htmlContent = await result.htmlFile.text();
  const { tickets, imageMapping } = await parseHTMLForTickets(htmlContent, result.imageFiles);

  result.tickets = tickets;
  result.imageMapping = imageMapping;

  return result;
}

/**
 * Parse HTML content for ticket information and images
 */
async function parseHTMLForTickets(
  html: string,
  imageFiles: Map<string, File>
): Promise<{ tickets: ParsedTicket[], imageMapping: Map<number, string> }> {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const tickets: ParsedTicket[] = [];
  const imageMapping = new Map<number, string>();

  // Find all images in the document
  const images = doc.querySelectorAll('img');
  console.log(`Found ${images.length} images in HTML`);

  // For each image, collect the text that follows it until the next image
  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    const imgSrc = img.getAttribute('src') || '';

    // Get text between this image and the next one (or end of doc)
    const textContent = getTextBetweenImages(img, images[i + 1]);

    if (textContent && textContent.includes('Section')) {
      // Parse the ticket info from this text block
      const ticketInfo = extractTicketInfo(textContent);

      if (ticketInfo) {
        const ticketIndex = tickets.length;
        tickets.push(ticketInfo);

        // Extract image filename from path (e.g., "images/image1.png" -> "image1.png")
        const imageName = imgSrc.split('/').pop();

        if (imageName && imageFiles.has(imageName)) {
          // Convert image file to data URL for immediate display
          const imageFile = imageFiles.get(imageName)!;
          const dataUrl = await fileToDataUrl(imageFile);
          imageMapping.set(ticketIndex, dataUrl);
        }
      }
    }
  }

  return { tickets, imageMapping };
}

/**
 * Get text content between two images (or from image to end of document)
 */
function getTextBetweenImages(currentImg: Element, nextImg: Element | undefined): string {
  const textLines: string[] = [];
  let currentNode: Node | null = currentImg;

  // Start from the image and walk forward
  while (currentNode) {
    // Get the next node in document order
    let nextNode: Node | null = null;

    // Try to get the next sibling or go up and get parent's next sibling
    if (currentNode.nextSibling) {
      nextNode = currentNode.nextSibling;
    } else {
      // Go up until we find a parent with a next sibling
      let parent: Node | null = currentNode.parentNode;
      while (parent && !parent.nextSibling && parent !== currentImg.ownerDocument.body) {
        parent = parent.parentNode;
      }
      if (parent && parent.nextSibling) {
        nextNode = parent.nextSibling;
      }
    }

    if (!nextNode) break;

    // If we've reached the next image, stop
    if (nextImg && (nextNode === nextImg || nextNode.contains(nextImg))) {
      break;
    }

    // Collect text content
    if (nextNode.nodeType === Node.TEXT_NODE) {
      const text = nextNode.textContent?.trim();
      if (text) textLines.push(text);
    } else if (nextNode.nodeType === Node.ELEMENT_NODE) {
      // Check if this element contains the next image
      if (nextImg && (nextNode as Element).contains(nextImg)) {
        break;
      }

      // Get text but skip if it contains an image
      const hasImage = (nextNode as Element).querySelector?.('img');
      if (!hasImage) {
        const text = nextNode.textContent?.trim();
        if (text && !textLines.includes(text)) {
          textLines.push(text);
        }
      }
    }

    currentNode = nextNode;
  }

  return textLines.join('\n');
}


/**
 * Extract ticket information from a text block
 */
function extractTicketInfo(text: string): ParsedTicket | null {

  // Extract section - handle cases where section might have letters (421R, 429S, etc)
  const sectionMatch = text.match(/Section\s+([A-Z0-9]+)/i);
  if (!sectionMatch) return null;

  const section = sectionMatch[1];

  // Extract row - look for separate "Row X" pattern, not combined with Section
  const rowMatch = text.match(/Row\s+([A-Z0-9]+)(?!\w)/i);
  const row = rowMatch ? rowMatch[1] : 'Unknown';

  // Extract quantity - ONLY from "X tickets together" format, not from other contexts
  const qtyMatch = text.match(/(\d+)\s+tickets?\s+together/i);
  const quantity = qtyMatch ? parseInt(qtyMatch[1]) : 1; // Default to 1 if not specified

  // Extract price - handle "Now" pricing pattern
  let price = 0;
  let originalPrice = 0;
  let isDiscounted = false;

  // Handle multi-line pricing format from Google Docs (e.g., "$463\nNow\n$259\n  incl. fees")
  // Look for pattern where "Now" appears between two prices
  const multiLinePricePattern = /\$?([\d,]+)(?:\.\d{2})?\s*\n?\s*Now\s*\n?\s*\$?([\d,]+)(?:\.\d{2})?/i;
  const multiLineMatch = text.match(multiLinePricePattern);

  if (multiLineMatch) {
    // First price is original, second is discounted
    originalPrice = parseFloat(multiLineMatch[1].replace(/[$,]/g, ''));
    price = parseFloat(multiLineMatch[2].replace(/[$,]/g, ''));
    isDiscounted = true;
  } else {
    // Fallback: Look for "Now $XXX" pattern (discounted price)
    const nowPriceMatch = text.match(/Now\s*\$?([\d,]+)(?:\.\d{2})?/i);
    if (nowPriceMatch) {
      price = parseFloat(nowPriceMatch[1].replace(/[$,]/g, ''));
      isDiscounted = true;

      // Look for original price before "Now"
      const originalMatch = text.match(/\$?([\d,]+)(?:\.\d{2})?\s*(?:Now)/i);
      if (originalMatch) {
        originalPrice = parseFloat(originalMatch[1].replace(/[$,]/g, ''));
      }
    } else {
      // Look for regular price pattern (after "incl. fees" or standalone)
      const priceMatches = text.match(/\$([\d,]+)(?:\.\d{2})?/g);
      if (priceMatches && priceMatches.length > 0) {
        // Find price that comes before "incl. fees" or take the first one
        for (const match of priceMatches) {
          const value = parseFloat(match.replace(/[$,]/g, ''));
          // Skip very large prices (likely original prices) if there's a "Now" in text
          if (text.includes('Now') && value > 1000) {
            originalPrice = value;
          } else {
            price = value;
            break;
          }
        }
      }
    }
  }

  // If no price found, return null
  if (price === 0) return null;

  // Extract seats if specified
  const seatsMatch = text.match(/Seats?\s+([\d\s\-,]+)/i);
  const seats = seatsMatch ? seatsMatch[1].trim() : undefined;

  // Build attributes from common keywords and descriptions
  const attributes: string[] = [];

  // Row position descriptions
  if (/first row/i.test(text)) attributes.push('First Row');
  if (/second row/i.test(text)) attributes.push('Second Row');
  if (/third row/i.test(text)) attributes.push('Third Row');
  if (/front row/i.test(text)) attributes.push('Front Row');
  if (/\d+(?:st|nd|rd|th)\s+row\s+of\s+section/i.test(text)) {
    const rowPosMatch = text.match(/(\d+(?:st|nd|rd|th)\s+row\s+of\s+section)/i);
    if (rowPosMatch) attributes.push(rowPosMatch[1]);
  }

  // View quality
  if (/clear view/i.test(text)) attributes.push('Clear View');
  if (/obstructed/i.test(text)) attributes.push('Obstructed View');
  if (/partial view/i.test(text)) attributes.push('Partial View');

  // Seating features
  if (/together/i.test(text)) attributes.push('Together');
  if (/aisle/i.test(text)) attributes.push('Aisle');
  if (/center/i.test(text)) attributes.push('Center');
  if (/side by side/i.test(text)) attributes.push('Side by Side');

  // Ticket features
  if (/instant download/i.test(text)) attributes.push('Instant Download');
  if (/e-?ticket/i.test(text)) attributes.push('E-Ticket');
  if (/mobile/i.test(text)) attributes.push('Mobile Ticket');

  // Marketing labels
  if (/bestselling/i.test(text)) attributes.push('Bestselling');
  if (/popular/i.test(text)) attributes.push('Popular');
  if (/only \d+ left/i.test(text)) attributes.push('Limited Availability');
  if (/cheapest/i.test(text)) attributes.push('Cheapest');
  if (/best value/i.test(text)) attributes.push('Best Value');

  return {
    section,
    row,
    seats,
    quantity,
    price,
    originalPrice,
    isDiscounted,
    attributes,
    rawText: text.substring(0, 500)
  };
}

/**
 * Convert File to data URL
 */
async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Upload image files - Using data URLs to avoid Cloudinary issues
 */
export async function uploadImagesToCloudinary(imageFiles: Map<string, File>): Promise<Map<string, string>> {
  const uploadedUrls = new Map<string, string>();
  const batchSize = 10;
  const entries = Array.from(imageFiles.entries());

  console.log(`Processing ${entries.length} ticket images in batches of ${batchSize}`);

  // Process images in batches using data URLs (avoids Cloudinary 400 errors)
  for (let i = 0; i < entries.length; i += batchSize) {
    const batch = entries.slice(i, i + batchSize);
    const batchPromises = batch.map(async ([name, file]) => {
      try {
        const dataUrl = await fileToDataUrl(file);
        return { name, url: dataUrl };
      } catch (error) {
        console.error(`Failed to process image ${name}:`, error);
        return { name, url: '' };
      }
    });

    const results = await Promise.all(batchPromises);
    results.forEach(({ name, url }) => {
      if (url) {
        uploadedUrls.set(name, url);
      }
    });

    console.log(`Processed ticket image batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(entries.length/batchSize)}`);
  }

  console.log(`Successfully processed ${uploadedUrls.size} ticket images`);
  return uploadedUrls;
}