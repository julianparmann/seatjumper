interface ExtractedImage {
  url?: string;
  file?: File;
  type: 'url' | 'file' | 'data-url';
  context?: string; // Text near the image for matching
  index: number;
}

interface ClipboardContent {
  text: string;
  html?: string;
  images: ExtractedImage[];
}

/**
 * Extracts images from HTML content
 */
function extractImagesFromHTML(html: string): ExtractedImage[] {
  const images: ExtractedImage[] = [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Find all img tags - they will be in document order
  const imgElements = doc.querySelectorAll('img');
  console.log('Found img elements:', imgElements.length);

  // Process images in the order they appear in the document
  imgElements.forEach((img, index) => {
    // Try multiple attributes for image source
    const src = img.getAttribute('src') ||
                img.getAttribute('data-src') ||
                img.getAttribute('data-original') ||
                img.getAttribute('srcset')?.split(' ')[0];

    console.log(`Image ${index + 1}:`, src?.substring(0, 100));

    if (src) {
      // Get surrounding text for context (for matching to tickets)
      const parent = img.parentElement;
      let context = '';
      if (parent) {
        const textNodes = [];
        const walker = document.createTreeWalker(
          parent,
          NodeFilter.SHOW_TEXT,
          null
        );
        let node;
        while (node = walker.nextNode()) {
          textNodes.push(node.textContent || '');
        }
        context = textNodes.join(' ').substring(0, 200);
      }

      if (src.startsWith('data:')) {
        // Data URL - already embedded
        images.push({
          url: src,
          type: 'data-url',
          context,
          index
        });
      } else if (src.startsWith('http') || src.startsWith('//')) {
        // Direct URL - make sure it's absolute
        const absoluteUrl = src.startsWith('//') ? `https:${src}` : src;
        images.push({
          url: absoluteUrl,
          type: 'url',
          context,
          index
        });
      } else if (src.startsWith('/')) {
        // Relative URL - try to construct absolute URL
        // This is tricky without knowing the source domain
        console.log('Relative URL found, may need base URL:', src);
      }
    }
  });

  console.log(`Extracted ${images.length} images in document order`);
  return images;
}

/**
 * Processes clipboard paste event to extract text and images
 */
export async function processClipboardPaste(
  event: ClipboardEvent
): Promise<ClipboardContent> {
  const clipboardData = event.clipboardData;
  if (!clipboardData) {
    return { text: '', images: [] };
  }

  const content: ClipboardContent = {
    text: '',
    images: []
  };

  // Process each item in clipboard
  const items = Array.from(clipboardData.items);
  console.log('Clipboard items:', items.length, items.map(i => i.type));

  // First check for direct image files
  let hasImageFile = false;
  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    // Handle direct image files (screenshots, etc.)
    if (item.type.startsWith('image/')) {
      const file = item.getAsFile();
      if (file) {
        console.log('Found image file:', file.name, file.type);
        hasImageFile = true;
        content.images.push({
          file,
          type: 'file',
          index: i
        });
      }
    }
  }

  // Process text and HTML
  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    // Handle plain text
    if (item.type === 'text/plain') {
      content.text = await new Promise<string>((resolve) => {
        item.getAsString((text) => resolve(text));
      });
    }

    // Handle HTML (which may contain image URLs)
    if (item.type === 'text/html') {
      const html = await new Promise<string>((resolve) => {
        item.getAsString((htmlText) => resolve(htmlText));
      });
      content.html = html;
      console.log('HTML content:', html.substring(0, 500));

      // Only extract images from HTML if we didn't get direct image files
      if (!hasImageFile) {
        const htmlImages = extractImagesFromHTML(html);
        content.images.push(...htmlImages);
      }
    }
  }

  console.log('Processed clipboard content:', {
    textLength: content.text.length,
    imageCount: content.images.length
  });

  return content;
}

/**
 * Upload file to Cloudinary via API
 */
export async function uploadToCloudinary(
  file: File,
  folder: string = 'seat-views'
): Promise<string> {
  try {
    // Convert file to data URL first
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    // Upload to Cloudinary via API
    const response = await fetch('/api/upload-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: dataUrl, folder })
    });

    const result = await response.json();
    if (result.url) {
      return result.url;
    }

    // Don't fallback to data URL - return placeholder
    return '';
  } catch (error) {
    console.error('Failed to upload to Cloudinary:', error);
    // Don't fallback to data URL - return empty string
    return '';
  }
}

/**
 * Processes extracted images - uploads to Cloudinary via API
 */
export async function processExtractedImages(
  images: ExtractedImage[]
): Promise<string[]> {
  const processedUrls: string[] = [];

  for (const image of images) {
    try {
      if (image.type === 'file' && image.file) {
        // Upload file to Cloudinary via API
        const url = await uploadToCloudinary(image.file, 'ticket-views');
        processedUrls.push(url);
      } else if (image.type === 'url' && image.url) {
        // Direct URL - use as is
        processedUrls.push(image.url);
      } else if (image.type === 'data-url' && image.url) {
        // Data URL - upload to Cloudinary via API
        try {
          const response = await fetch('/api/upload-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: image.url, folder: 'ticket-views' })
          });
          const result = await response.json();
          if (result.url) {
            processedUrls.push(result.url);
          } else {
            // Don't fallback to data URL
            console.warn('Failed to get Cloudinary URL for data URL');
          }
        } catch (error) {
          console.error('Failed to upload data URL:', error);
          // Don't fallback to data URL
        }
      }
    } catch (error) {
      console.error('Failed to process image:', error);
    }
  }

  return processedUrls;
}

/**
 * Matches images to ticket sections based on proximity and context
 * Updated to handle 2 images per ticket
 */
export function matchImagesToTickets(
  tickets: any[],
  images: ExtractedImage[],
  text: string
): Map<number, { image1: string; image2?: string }> {
  const ticketImageMap = new Map<number, { image1: string; image2?: string }>();

  // Each ticket gets 2 images
  tickets.forEach((ticket, index) => {
    const imageIdx = index * 2; // Each ticket has 2 images
    const img1 = images[imageIdx];
    const img2 = images[imageIdx + 1];

    if (img1?.url || img2?.url) {
      ticketImageMap.set(index, {
        image1: img1?.url || '',
        image2: img2?.url || ''
      });
    }
  });

  console.log(`Matched ${ticketImageMap.size} tickets with image pairs`);
  return ticketImageMap;
}