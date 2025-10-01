/**
 * Simplified image upload handler with fallback to data URLs
 */
export async function uploadImageWithFallback(
  file: File | string,
  folder: string = 'memorabilia'
): Promise<string> {
  // If already a URL or data URL, return as is
  if (typeof file === 'string') {
    return file;
  }

  // Skip Cloudinary for now - use data URLs
  // This avoids the 400 errors while still allowing the upload to work
  try {
    return await fileToDataUrl(file);
  } catch (error) {
    console.error('Failed to convert file to data URL:', error);
    return '';
  }
}

/**
 * Process multiple images in batches with fallback
 */
export async function uploadImagesInBatches(
  images: Array<{ file: File | string; key: string }>,
  batchSize: number = 10
): Promise<Map<string, string>> {
  const results = new Map<string, string>();

  for (let i = 0; i < images.length; i += batchSize) {
    const batch = images.slice(i, i + batchSize);
    const batchPromises = batch.map(async ({ file, key }) => {
      const url = await uploadImageWithFallback(file);
      return { key, url };
    });

    const batchResults = await Promise.all(batchPromises);
    batchResults.forEach(({ key, url }) => {
      if (url) {
        results.set(key, url);
      }
    });

    console.log(`Processed image batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(images.length/batchSize)}`);
  }

  return results;
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
 * Future Cloudinary implementation (when ready)
 * For now, this is disabled to avoid 400 errors
 */
export async function uploadToCloudinary(
  file: File,
  folder: string = 'memorabilia'
): Promise<string | null> {
  // Disabled for now - return null to use fallback
  return null;

  /* Future implementation:
  const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    return null;
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('folder', folder);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      { method: 'POST', body: formData }
    );

    if (response.ok) {
      const data = await response.json();
      return data.secure_url;
    }
  } catch (error) {
    console.error('Cloudinary upload failed:', error);
  }

  return null;
  */
}