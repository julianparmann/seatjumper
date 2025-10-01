import { ParsedTicket } from './ticket-parser';

interface HTMLFolderContent {
  htmlFile: File | null;
  imageFiles: Map<string, File>;
  tickets: ParsedTicket[];
  imagePairs: Map<number, { image1: string; image2: string }>; // ticket index to image pair
}

/**
 * Process uploaded folder containing HTML and images
 */
export async function processHTMLFolder(files: FileList): Promise<HTMLFolderContent> {
  const result: HTMLFolderContent = {
    htmlFile: null,
    imageFiles: new Map(),
    tickets: [],
    imagePairs: new Map()
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
  const { tickets, imagePairs } = await parseHTMLForTicketsV2(htmlContent, result.imageFiles);

  result.tickets = tickets;
  result.imagePairs = imagePairs;

  return result;
}

/**
 * Parse HTML content for ticket information with TWO images per ticket
 */
async function parseHTMLForTicketsV2(
  html: string,
  imageFiles: Map<string, File>
): Promise<{ tickets: ParsedTicket[], imagePairs: Map<number, { image1: string; image2: string }> }> {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const tickets: ParsedTicket[] = [];
  const imagePairs = new Map<number, { image1: string; image2: string }>();

  // Find all images in the document
  const images = doc.querySelectorAll('img');
  console.log(`Found ${images.length} images in HTML`);

  // Process images in pairs (2 images per ticket)
  for (let i = 0; i < images.length; i += 2) {
    const img1 = images[i];
    const img2 = images[i + 1];

    if (!img1 || !img2) {
      console.log(`Incomplete image pair at index ${i}, stopping`);
      break; // Need both images for a valid ticket
    }

    // Get text after the second image until the next pair
    const textContent = getTextBetweenImagePairs(doc, img2, images[i + 2]);

    if (textContent && textContent.includes('Section')) {
      // Parse the ticket info from this text block
      const ticketInfo = extractTicketInfo(textContent);

      if (ticketInfo) {
        const ticketIndex = tickets.length;
        tickets.push(ticketInfo);

        // Process both images for this ticket
        const img1Src = img1.getAttribute('src') || '';
        const img2Src = img2.getAttribute('src') || '';

        // Extract image filenames
        const imageName1 = img1Src.split('/').pop() || '';
        const imageName2 = img2Src.split('/').pop() || '';

        console.log(`Processing ticket ${ticketIndex}: img1=${imageName1}, img2=${imageName2}`);

        let dataUrl1 = '';
        let dataUrl2 = '';

        // Upload first image to Cloudinary via API
        if (imageName1 && imageFiles.has(imageName1)) {
          const imageFile = imageFiles.get(imageName1)!;
          try {
            const base64Data = await fileToDataUrl(imageFile);
            const response = await fetch('/api/upload-image', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ image: base64Data, folder: 'ticket-views' })
            });
            const result = await response.json();
            if (result.url) {
              dataUrl1 = result.url;
              console.log(`Uploaded ${imageName1} to Cloudinary: ${result.url}`);
            } else {
              console.warn(`Failed to get Cloudinary URL for ${imageName1}, using placeholder`);
              dataUrl1 = ''; // Don't use base64 fallback
            }
          } catch (error) {
            console.error(`Failed to upload ${imageName1}:`, error);
            dataUrl1 = ''; // Don't use base64 fallback
          }
        } else if (imageName1) {
          console.warn(`Image file not found: ${imageName1}`);
        }

        // Upload second image to Cloudinary via API
        if (imageName2 && imageFiles.has(imageName2)) {
          const imageFile = imageFiles.get(imageName2)!;
          try {
            const base64Data = await fileToDataUrl(imageFile);
            const response = await fetch('/api/upload-image', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ image: base64Data, folder: 'ticket-views' })
            });
            const result = await response.json();
            if (result.url) {
              dataUrl2 = result.url;
              console.log(`Uploaded ${imageName2} to Cloudinary: ${result.url}`);
            } else {
              console.warn(`Failed to get Cloudinary URL for ${imageName2}, using placeholder`);
              dataUrl2 = ''; // Don't use base64 fallback
            }
          } catch (error) {
            console.error(`Failed to upload ${imageName2}:`, error);
            dataUrl2 = ''; // Don't use base64 fallback
          }
        } else if (imageName2) {
          console.warn(`Image file not found: ${imageName2}`);
        }

        // Always store the pair, even if one is missing
        imagePairs.set(ticketIndex, {
          image1: dataUrl1,
          image2: dataUrl2
        });

        console.log(`Ticket ${ticketIndex}: Section ${ticketInfo.section}, Row ${ticketInfo.row}, Images: ${!!dataUrl1}, ${!!dataUrl2}`);
      }
    } else {
      console.log(`No valid ticket text found after image pair at index ${i}`);
    }
  }

  console.log(`Parsed ${tickets.length} tickets with ${imagePairs.size} image pairs`);
  return { tickets, imagePairs };
}

/**
 * Get text content between image pairs
 */
function getTextBetweenImagePairs(doc: Document, afterElement: Element, beforeElement: Element | undefined): string {
  const textParts: string[] = [];

  // Create a range to select nodes between the two elements
  const range = doc.createRange();
  range.setStartAfter(afterElement);

  if (beforeElement) {
    range.setEndBefore(beforeElement);
  } else {
    // If no next element, go to end of document body
    range.setEndAfter(doc.body.lastChild || doc.body);
  }

  // Extract text from the range
  const fragment = range.cloneContents();
  const walker = doc.createTreeWalker(
    fragment,
    NodeFilter.SHOW_TEXT,
    null
  );

  let node;
  while (node = walker.nextNode()) {
    const text = node.textContent?.trim();
    if (text) {
      textParts.push(text);
    }
  }

  const fullText = textParts.join(' ');

  // Only return text up to the next ticket indicator or end
  if (fullText.includes('Section')) {
    // Find where the next section starts (if any)
    const sections = fullText.split(/Section\s+(?=[A-Z0-9])/i);
    if (sections.length > 1) {
      // Return just the first section's text
      return 'Section ' + sections[1];
    }
  }

  return fullText;
}

/**
 * Extract ticket information from a text block
 */
function extractTicketInfo(text: string): ParsedTicket | null {
  // Extract section
  const sectionMatch = text.match(/Section\s+([A-Z0-9]+)/i);
  if (!sectionMatch) return null;
  const section = sectionMatch[1];

  // Extract row
  const rowMatch = text.match(/Row\s+([A-Z0-9]+)(?!\w)/i);
  const row = rowMatch ? rowMatch[1] : '1';

  // Extract quantity (default to 2 based on your sample)
  const qtyMatch = text.match(/(\d+)\s+tickets?(?:\s|$)/i);
  const quantity = qtyMatch ? parseInt(qtyMatch[1]) : 2;

  // Extract price - handle various formats
  let price = 0;
  let originalPrice = 0;

  // Look for price patterns
  const pricePatterns = [
    /\$?([\d,]+)(?:\.\d{2})?\s+each/i,  // "$250 each"
    /\$([\d,]+)(?:\.\d{2})?(?!.*\$)/,    // Last price in text
  ];

  for (const pattern of pricePatterns) {
    const match = text.match(pattern);
    if (match) {
      price = parseFloat(match[1].replace(/,/g, ''));
      break;
    }
  }

  // Look for strikethrough/original price
  const allPrices = text.match(/\$([\d,]+)(?:\.\d{2})?/g) || [];
  if (allPrices.length > 1) {
    // If there are multiple prices, first might be original
    const firstPrice = parseFloat((allPrices[0] || '0').replace(/[$,]/g, ''));
    const lastPrice = parseFloat((allPrices[allPrices.length - 1] || '0').replace(/[$,]/g, ''));

    if (firstPrice > lastPrice) {
      originalPrice = firstPrice;
      price = lastPrice;
    }
  }

  if (price === 0) return null;

  // Extract seats if specified
  const seatsMatch = text.match(/Seats?\s+([\d\s\-,]+)/i);
  const seats = seatsMatch ? seatsMatch[1].trim() : undefined;

  // Extract zone information
  const zoneMatch = text.match(/Zone\s+([^$\n]+)/i);
  const zone = zoneMatch ? zoneMatch[1].trim() : '';

  // Build attributes
  const attributes: string[] = [];
  if (zone) attributes.push(zone);
  if (/Amazing/i.test(text)) attributes.push('Amazing View');
  if (/Great/i.test(text)) attributes.push('Great View');
  if (/together/i.test(text)) attributes.push('Together');

  // Extract rating if present (e.g., "9.4")
  const ratingMatch = text.match(/(\d+\.\d+)/);
  if (ratingMatch) {
    attributes.push(`Rating: ${ratingMatch[1]}`);
  }

  return {
    section,
    row,
    seats,
    quantity,
    price,
    originalPrice: originalPrice || undefined,
    isDiscounted: originalPrice > 0,
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
 * Upload image files to Cloudinary via API
 */
export async function uploadImagesToCloudinary(imageFiles: Map<string, File>): Promise<Map<string, string>> {
  const uploadedUrls = new Map<string, string>();

  for (const [name, file] of imageFiles.entries()) {
    try {
      // Convert file to data URL first
      const dataUrl = await fileToDataUrl(file);

      // Upload to Cloudinary via API
      const response = await fetch('/api/upload-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: dataUrl, folder: 'ticket-views' })
      });

      const result = await response.json();
      if (result.url) {
        uploadedUrls.set(name, result.url);
        console.log(`Uploaded ${name} to Cloudinary: ${result.url}`);
      } else {
        // Don't fallback to data URL - skip this image
        console.warn(`Failed to get Cloudinary URL for ${name}, skipping`);
      }
    } catch (error) {
      console.error(`Failed to upload image ${name}:`, error);
      // Don't fallback to data URL - skip this image
    }
  }

  console.log(`Successfully processed ${uploadedUrls.size} ticket images`);
  return uploadedUrls;
}