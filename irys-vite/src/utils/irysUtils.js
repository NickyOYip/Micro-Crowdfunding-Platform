/**
 * Utilities for working with Irys content
 */

// The Irys gateway URL for fetching stored content
export const IRYS_GATEWAY = 'https://gateway.irys.xyz/';

/**
 * Fetches content from Irys by transaction ID
 * @param {string} transactionId - The Irys transaction ID
 * @returns {Promise<string|null>} - The content as text or null if error
 */
export async function fetchIrysContent(transactionId) {
  if (!transactionId) return null;
  
  try {
    const response = await fetch(`${IRYS_GATEWAY}${transactionId}`);
    
    if (!response.ok) {
      console.error(`Error fetching Irys content: ${response.status} ${response.statusText}`);
      return null;
    }
    
    return await response.text();
  } catch (error) {
    console.error('Error fetching Irys content:', error);
    return null;
  }
}

/**
 * Gets a URL for an Irys transaction
 * @param {string} transactionId - The Irys transaction ID
 * @returns {string|null} - The full URL to the content or null if no ID provided
 */
export function getIrysUrl(transactionId) {
  if (!transactionId) return null;
  return `${IRYS_GATEWAY}${transactionId}`;
}

/**
 * Fetches multiple Irys contents in parallel
 * @param {string[]} transactionIds - Array of Irys transaction IDs
 * @returns {Promise<Object>} - Object with transaction IDs as keys and content as values
 */
export async function fetchMultipleIrysContents(transactionIds) {
  const results = {};
  
  if (!transactionIds || !transactionIds.length) return results;
  
  const promises = transactionIds.map(async (id) => {
    if (!id) return;
    try {
      const content = await fetchIrysContent(id);
      results[id] = content;
    } catch (error) {
      console.error(`Error fetching content for ${id}:`, error);
      results[id] = null;
    }
  });
  
  await Promise.all(promises);
  return results;
}

/**
 * Generates a full URL for content stored on Irys
 * @param {string} txId - The Irys transaction ID
 * @returns {string} The full URL to access the content
 */
export const getIrysContentUrl = (txId) => {
  if (!txId) return null;
  return `${IRYS_GATEWAY}${txId}`;
};

/**
 * Fetches text content from Irys
 * @param {string} txId - The Irys transaction ID
 * @returns {Promise<string>} The text content
 */
export const fetchIrysText = async (txId) => {
  if (!txId) return '';
  try {
    const response = await fetch(getIrysContentUrl(txId));
    if (!response.ok) throw new Error('Network response was not ok');
    return await response.text();
  } catch (error) {
    console.error('Error fetching Irys text content:', error);
    return '';
  }
};

/**
 * Fetches JSON content from Irys
 * @param {string} txId - The Irys transaction ID
 * @returns {Promise<Object>} The parsed JSON content
 */
export const fetchIrysJson = async (txId) => {
  if (!txId) return null;
  try {
    const response = await fetch(getIrysContentUrl(txId));
    if (!response.ok) throw new Error('Network response was not ok');
    return await response.json();
  } catch (error) {
    console.error('Error fetching Irys JSON content:', error);
    return null;
  }
};

/**
 * Check if an Irys transaction ID exists
 * @param {string} txId - The Irys transaction ID
 * @returns {Promise<boolean>} Whether the content exists
 */
export const checkIrysContent = async (txId) => {
  if (!txId) return false;
  try {
    const response = await fetch(getIrysContentUrl(txId), { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.error('Error checking Irys content:', error);
    return false;
  }
};

/**
 * Checks if an Irys URL is an image
 * @param {string} txId - The Irys transaction ID
 * @returns {Promise<boolean>} - True if the content is an image
 */
export const isIrysImage = async (txId) => {
  if (!txId) return false;
  
  try {
    const response = await fetch(getIrysUrl(txId), { method: 'HEAD' });
    if (!response.ok) return false;
    
    const contentType = response.headers.get('content-type');
    return contentType && contentType.startsWith('image/');
  } catch (error) {
    console.error(`Error checking if ${txId} is an image:`, error);
    return false;
  }
};

/**
 * Fetches batch of Irys content
 * @param {string[]} txIds - List of transaction IDs
 * @returns {Promise<Object>} - Object mapping txIds to content
 */
export const fetchBatchIrysContent = async (txIds) => {
  const result = {};
  
  await Promise.all(
    txIds.map(async (txId) => {
      if (!txId) return;
      try {
        result[txId] = await fetchIrysText(txId);
      } catch (error) {
        console.error(`Error fetching content for ${txId}:`, error);
        result[txId] = '';
      }
    })
  );
  
  return result;
};

/**
 * Upload data to Irys
 * @param {WebUploader} uploader - The Irys WebUploader instance
 * @param {File} file - The file to upload
 * @returns {Promise<Object>} - The upload receipt
 */
export const uploadFile = async (uploader, file) => {
  try {
    if (!uploader) throw new Error('Uploader not initialized');
    if (!file) throw new Error('File is required');
    
    // Get the receipt
    const receipt = await uploader.uploadFile(file);
    console.log(`File uploaded to: ${receipt.id}`);
    return receipt;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

/**
 * Upload text content to Irys
 * @param {WebUploader} uploader - The Irys WebUploader instance
 * @param {string} text - The text content to upload
 * @returns {Promise<Object>} - The upload receipt
 */
export const uploadText = async (uploader, text) => {
  try {
    if (!uploader) throw new Error('Uploader not initialized');
    if (!text) throw new Error('Text content is required');
    
    // Upload the text
    const receipt = await uploader.upload(text);
    console.log(`Text uploaded to: ${receipt.id}`);
    return receipt;
  } catch (error) {
    console.error('Error uploading text:', error);
    throw error;
  }
};
