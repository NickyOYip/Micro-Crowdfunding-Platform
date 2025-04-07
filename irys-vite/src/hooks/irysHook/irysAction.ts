/**
 * Check the current balance for the connected wallet in Irys
 * @param irysUploader - The WebUploader instance
 * @returns The current balance
 */
export const checkBalance = async (irysUploader: WebUploader) => {
  try {
    const balance = await irysUploader.getBalance();
    console.log("Current balance:", balance);
    // Convert BigNumber to string to avoid serialization issues
    return balance.toString();
  } catch (error) {
    console.error("Error checking balance:", error);
    throw error;
  }
};

/**
 * Fund your Irys account with the specified amount
 * @param irysUploader - The WebUploader instance
 * @param amount - Amount to fund (in atomic units)
 * @returns The funding transaction details
 */
export const fundAccount = async (irysUploader: WebUploader, amount: string) => {
  try {
    console.log(`Attempting to fund with ${amount} ETH...`);
    
    // For testnet environments, we need specific transaction settings
    const fundTx = await irysUploader.fund(irysUploader.utils.toAtomic(amount));
    
    console.log("Funding transaction:", fundTx);
    
    // Wait a bit for the transaction to be processed before returning
    // This helps avoid race conditions with immediate balance checks
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    return fundTx;
  } catch (error) {
    console.error("Error funding account:", error);
    throw error;
  }
};

/**
 * Upload a file or data to Irys with timeout protection
 * @param irysUploader - The WebUploader instance
 * @param data - File or data to upload
 * @returns The upload receipt containing the transaction ID
 */
export const uploadData = async (
  irysUploader: WebUploader,
  data: File,
) => {
  try {
    // Check balance before upload
    const balance = await irysUploader.getBalance();
    console.log("Current balance before upload:", balance.toString());
    
    // Get file size
    const fileSize = data instanceof File ? data.size : 0;
    
    console.log("Uploading file, size:", fileSize, "bytes");
    
    // Check if enough funds (optional)
    const price = await irysUploader.getPrice(fileSize);
    console.log("Cost to upload:", price.toString());
    
    if (balance.lt(price)) {
      throw new Error(`Insufficient funds: have ${balance}, need ${price}`);
    }

    // Create timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Upload timed out after 60 seconds")), 60000);
    });
    console.log("Cost to upload:", irysUploader.address);

    // Race the upload against timeout
    const receipt = await Promise.race([
      irysUploader.uploadFile(data),
      timeoutPromise
    ]);
    
    console.log("Upload successful:", receipt.id);
    return receipt;
  } catch (error) {
    console.error("Upload error:", error);
    throw error;
  }
};

/**
 * Upload a string to Irys with timeout protection
 * @param irysUploader - The WebUploader instance
 * @param data - String to upload
 * @returns The upload receipt containing the transaction ID
 */
export const uploadString = async (
  irysUploader: WebUploader,
  data: string,
) => {
  try {
    // Check balance before upload
    const balance = await irysUploader.getBalance();
    console.log("Current balance before upload:", balance.toString());
    
    // Get file size
    const fileSize = Buffer.byteLength(data, 'utf-8');
    
    console.log("Uploading string, size:", fileSize, "bytes");
    
    // Check if enough funds (optional)
    const price = await irysUploader.getPrice(fileSize);
    console.log("Cost to upload:", price.toString());
    
    if (balance.lt(price)) {
      throw new Error(`Insufficient funds: have ${balance}, need ${price}`);
    }

    // Create timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Upload timed out after 60 seconds")), 60000);
    });
    console.log("Cost to upload:", irysUploader.address);

    // Race the upload against timeout
    const receipt = await Promise.race([
      irysUploader.upload(data),
      timeoutPromise
    ]);
    
    console.log("Upload successful:", receipt.id);
    return receipt;
  } catch (error) {
    console.error("Upload error:", error);
    throw error;
  }
};

/**
 * Get the price estimation for uploading data of certain size
 * @param irysUploader - The WebUploader instance
 * @param bytes - Size of data in bytes
 * @returns The estimated price
 */
export const getPrice = async (irysUploader: WebUploader, bytes: number) => {
  try {
    const price = await irysUploader.getPrice(bytes);
    console.log(`Cost to upload ${bytes} bytes:`, price.toString());
    return price.toString();
  } catch (error) {
    console.error("Error getting price estimation:", error);
    throw error;
  }
};

/**
 * Get the connected wallet's address on Irys
 * @param irysUploader - The WebUploader instance
 * @returns The wallet address
 */
export const getAddress = (irysUploader: WebUploader) => {
  return irysUploader.address;
};