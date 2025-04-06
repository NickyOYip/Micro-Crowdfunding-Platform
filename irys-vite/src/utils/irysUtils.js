/**
 * Utilities for working with Irys content
 */

// The Irys gateway URL
export const IRYS_GATEWAY = 'https://gateway.irys.xyz/';

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
