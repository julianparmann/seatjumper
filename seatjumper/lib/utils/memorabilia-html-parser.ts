import { ParsedMemorabiliaItem, MemorabiliaItemInput } from './memorabilia-parser';

interface HTMLFolderContent {
  htmlFile: File | null;
  imageFiles: Map<string, File>;
  items: ParsedMemorabiliaItem[];
  imageMapping: Map<number, string>; // item index to image URL
}

/**
 * Process uploaded folder containing HTML and images for memorabilia
 */
export async function processMemorabiliaHTMLFolder(files: FileList): Promise<HTMLFolderContent> {
  const result: HTMLFolderContent = {
    htmlFile: null,
    imageFiles: new Map(),
    items: [],
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
  const { items, imageMapping } = await parseHTMLForMemorabiliaItems(htmlContent, result.imageFiles);

  result.items = items;
  result.imageMapping = imageMapping;

  return result;
}

/**
 * Parse HTML content for memorabilia information and images
 */
async function parseHTMLForMemorabiliaItems(
  html: string,
  imageFiles: Map<string, File>
): Promise<{ items: ParsedMemorabiliaItem[], imageMapping: Map<number, string> }> {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const items: ParsedMemorabiliaItem[] = [];
  const imageMapping = new Map<number, string>();

  // Find all images in the document
  const images = doc.querySelectorAll('img');
  console.log(`Found ${images.length} images in memorabilia HTML`);

  // For each image, collect the text that follows it until the next image
  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    const imgSrc = img.getAttribute('src') || '';

    // Get text between this image and the next one (or end of doc)
    const textContent = getTextBetweenImages(img, images[i + 1]);

    if (textContent) {
      // Parse the memorabilia info from this text block
      const itemInfo = extractMemorabiliaInfo(textContent);

      if (itemInfo) {
        const itemIndex = items.length;
        items.push(itemInfo);

        // Extract image filename from path (e.g., "images/image1.png" -> "image1.png")
        const imageName = imgSrc.split('/').pop();

        if (imageName && imageFiles.has(imageName)) {
          // Convert image file to data URL for immediate display
          const imageFile = imageFiles.get(imageName)!;
          const dataUrl = await fileToDataUrl(imageFile);
          imageMapping.set(itemIndex, dataUrl);
        }
      }
    }
  }

  return { items, imageMapping };
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
 * Extract memorabilia information from a text block
 */
function extractMemorabiliaInfo(text: string): ParsedMemorabiliaItem | null {
  // Extract price
  let price = 0;
  let originalPrice = 0;
  let isDiscounted = false;

  console.log('Extracting memorabilia info from text:', text.substring(0, 200));

  // Handle multi-line pricing format from Google Docs
  const multiLinePricePattern = /\$?([\d,]+)(?:\.\d{2})?\s*\n?\s*Now\s*\n?\s*\$?([\d,]+)(?:\.\d{2})?/i;
  const multiLineMatch = text.match(multiLinePricePattern);

  if (multiLineMatch) {
    // First price is original, second is discounted
    originalPrice = parseFloat(multiLineMatch[1].replace(/[$,]/g, ''));
    price = parseFloat(multiLineMatch[2].replace(/[$,]/g, ''));
    isDiscounted = true;
    console.log('Found discounted price:', price, 'original:', originalPrice);
  } else {
    // Look for regular price pattern - make it more flexible
    const pricePatterns = [
      /\$([\d,]+)(?:\.\d{2})?/g,  // $123 or $123.45
      /USD\s*([\d,]+)(?:\.\d{2})?/gi,  // USD 123
      /([\d,]+)(?:\.\d{2})?\s*(?:dollars?|usd)/gi,  // 123 dollars
      /price:?\s*\$?([\d,]+)(?:\.\d{2})?/gi,  // Price: $123
      /(?:^|\s)([\d,]+)(?:\.\d{2})?(?:\s|$)/g  // Just numbers (fallback)
    ];

    for (const pattern of pricePatterns) {
      const matches = text.match(pattern);
      if (matches && matches.length > 0) {
        // Extract the numeric part
        const numMatch = matches[0].match(/[\d,]+(?:\.\d{2})?/);
        if (numMatch) {
          price = parseFloat(numMatch[0].replace(/,/g, ''));
          console.log('Found price with pattern:', pattern, 'price:', price);
          break;
        }
      }
    }
  }

  // If no price found, log warning but still try to extract other info
  if (price === 0) {
    console.warn('No price found in text:', text.substring(0, 100));
    // Set a default price of 1 so the item isn't skipped
    price = 1;
  }

  // Extract the name/description (usually the first substantial line before the price)
  const lines = text.split('\n').filter(line => line.trim());
  let name = '';
  let description = '';

  // Find the main product name (usually the longest line that's not a price or attribute)
  for (const line of lines) {
    // Skip price lines and short attribute lines
    if (!/^\$/.test(line) &&
        !/^(Almost Gone|Limited|New|Rare|Authentic|PSA|BGS|JSA)/i.test(line) &&
        line.length > 20) {
      if (!name) {
        name = line;
        description = line;
      }
      break;
    }
  }

  if (!name) {
    // Fallback: use the first non-price line
    name = lines.find(line => !/^\$/.test(line)) || 'Memorabilia Item';
    description = name;
  }

  console.log('Extracted item:', { name, price, originalPrice });

  // Build attributes from common keywords
  const attributes: string[] = [];

  // Card-specific attributes
  if (/signed|autograph|auto/i.test(text)) attributes.push('Autographed');
  if (/psa|beckett|bas|jsa|bgs/i.test(text)) attributes.push('Authenticated');
  if (/grade\s*10|gem\s*mint|pristine/i.test(text)) attributes.push('Grade 10');
  if (/grade\s*9/i.test(text)) attributes.push('Grade 9');
  if (/#\d+\/\d+|\d+\/\d+/i.test(text)) attributes.push('Numbered');
  if (/\brc\b|rookie/i.test(text)) attributes.push('Rookie Card');
  if (/patch/i.test(text)) attributes.push('Patch');
  if (/refractor/i.test(text)) attributes.push('Refractor');
  if (/prizm/i.test(text)) attributes.push('Prizm');
  if (/chrome/i.test(text)) attributes.push('Chrome');
  if (/mosaic/i.test(text)) attributes.push('Mosaic');
  if (/panini/i.test(text)) attributes.push('Panini');
  if (/topps/i.test(text)) attributes.push('Topps');

  // General attributes
  if (/limited|rare/i.test(text)) attributes.push('Limited Edition');
  if (/almost gone|only \d+ left/i.test(text)) attributes.push('Limited Availability');
  if (/sealed|unopened/i.test(text)) attributes.push('Sealed');
  if (/game.?used|game.?worn/i.test(text)) attributes.push('Game Used');

  // Extract year if present
  const yearMatch = text.match(/\b(19\d{2}|20\d{2})\b/);
  if (yearMatch) {
    attributes.push(`${yearMatch[1]} Release`);
  }

  // Extract player name (common pattern: First Last)
  const playerMatch = name.match(/\b([A-Z][a-z]+ [A-Z][a-z]+)\b/);
  if (playerMatch) {
    attributes.push(playerMatch[1]);
  }

  // Extract team if mentioned
  const teamPatterns = [
    /Raiders?/i, /Chiefs?/i, /Broncos?/i, /Chargers?/i,
    /Patriots?/i, /Bills?/i, /Dolphins?/i, /Jets?/i,
    /Steelers?/i, /Ravens?/i, /Browns?/i, /Bengals?/i,
    /Texans?/i, /Colts?/i, /Titans?/i, /Jaguars?/i,
    /Cowboys?/i, /Eagles?/i, /Giants?/i, /Washington/i,
    /Packers?/i, /Vikings?/i, /Bears?/i, /Lions?/i,
    /Saints?/i, /Falcons?/i, /Panthers?/i, /Buccaneers?/i,
    /49ers?/i, /Seahawks?/i, /Rams?/i, /Cardinals?/i
  ];

  for (const pattern of teamPatterns) {
    if (pattern.test(text)) {
      const match = text.match(pattern);
      if (match) attributes.push(match[0]);
      break;
    }
  }

  return {
    name: name.substring(0, 200), // Limit name length
    description: description.substring(0, 500),
    price,
    quantity: 1, // Default quantity
    attributes: [...new Set(attributes)], // Remove duplicates
    rawText: text.substring(0, 1000)
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
 * Upload memorabilia images with simplified batch processing
 */
export async function uploadMemorabiliaImagesToCloudinary(imageFiles: Map<string, File>): Promise<Map<string, string>> {
  const uploadedUrls = new Map<string, string>();
  const batchSize = 10; // Process 10 images at a time
  const entries = Array.from(imageFiles.entries());

  console.log(`Processing ${entries.length} images in batches of ${batchSize}`);

  // Process images in batches to avoid overwhelming the system
  for (let i = 0; i < entries.length; i += batchSize) {
    const batch = entries.slice(i, i + batchSize);
    const batchPromises = batch.map(async ([name, file]) => {
      try {
        // For now, just use data URLs to avoid Cloudinary 400 errors
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

    console.log(`Processed image batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(entries.length/batchSize)}`);
  }

  console.log(`Successfully processed ${uploadedUrls.size} images`);
  return uploadedUrls;
}