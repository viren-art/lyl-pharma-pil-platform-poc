import { randomUUID } from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

// LYL_DEP: @google-cloud/storage@7.7.0

// Mock GCP Cloud Storage (in production, use actual GCP SDK)
// For MVP, we'll use local file storage with AES-256 encryption

const STORAGE_BASE_PATH = process.env.STORAGE_PATH || './uploads';
const ENCRYPTION_ENABLED = process.env.ENCRYPTION_ENABLED !== 'false';

// AES-256 encryption configuration
const ENCRYPTION_ALGORITHM = 'aes-256-cbc';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32); // 256-bit key
const IV_LENGTH = 16; // AES block size

/**
 * Initialize storage directory
 */
export const initializeStorage = async () => {
  try {
    await fs.mkdir(STORAGE_BASE_PATH, { recursive: true });
    console.log(`Storage initialized at: ${STORAGE_BASE_PATH}`);
    
    // Warn if using default encryption key (insecure for production)
    if (!process.env.ENCRYPTION_KEY) {
      console.warn('WARNING: Using default encryption key. Set ENCRYPTION_KEY environment variable for production.');
    }
  } catch (error) {
    console.error('Failed to initialize storage:', error);
    throw error;
  }
};

/**
 * Encrypt file buffer using AES-256-CBC
 */
const encryptBuffer = (buffer) => {
  if (!ENCRYPTION_ENABLED) {
    return { encryptedData: buffer, iv: null };
  }

  try {
    // Generate random initialization vector
    const iv = crypto.randomBytes(IV_LENGTH);
    
    // Create cipher
    const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, ENCRYPTION_KEY, iv);
    
    // Encrypt data
    const encryptedData = Buffer.concat([
      cipher.update(buffer),
      cipher.final()
    ]);
    
    return { encryptedData, iv };
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('File encryption failed');
  }
};

/**
 * Decrypt file buffer using AES-256-CBC
 */
const decryptBuffer = (encryptedBuffer, iv) => {
  if (!ENCRYPTION_ENABLED || !iv) {
    return encryptedBuffer;
  }

  try {
    // Create decipher
    const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, ENCRYPTION_KEY, iv);
    
    // Decrypt data
    const decryptedData = Buffer.concat([
      decipher.update(encryptedBuffer),
      decipher.final()
    ]);
    
    return decryptedData;
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('File decryption failed');
  }
};

/**
 * Store file with AES-256 encryption
 * In production, this would use GCP Cloud Storage with server-side encryption
 */
export const storeFile = async (file, metadata) => {
  try {
    // Generate unique file path
    const fileId = randomUUID();
    const fileExtension = path.extname(file.originalname);
    const fileName = `${fileId}${fileExtension}`;
    const filePath = path.join(STORAGE_BASE_PATH, fileName);

    // Encrypt file buffer with AES-256
    const { encryptedData, iv } = encryptBuffer(file.buffer);

    // Store encrypted file
    await fs.writeFile(filePath, encryptedData);

    // Store IV separately for decryption (in production, use GCP KMS or Secret Manager)
    if (iv) {
      const ivPath = path.join(STORAGE_BASE_PATH, `${fileId}.iv`);
      await fs.writeFile(ivPath, iv);
    }

    // Return storage metadata
    return {
      filePath: fileName, // In production, this would be GCS URL
      fileId,
      storedAt: new Date().toISOString(),
      encrypted: ENCRYPTION_ENABLED,
      encryptionAlgorithm: ENCRYPTION_ENABLED ? ENCRYPTION_ALGORITHM : null,
      metadata: {
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        ...metadata
      }
    };
  } catch (error) {
    console.error('Failed to store file:', error);
    throw new Error('File storage failed');
  }
};

/**
 * Retrieve and decrypt file from storage
 */
export const retrieveFile = async (filePath) => {
  try {
    const fullPath = path.join(STORAGE_BASE_PATH, filePath);
    const encryptedBuffer = await fs.readFile(fullPath);

    // Read IV if encryption is enabled
    let iv = null;
    if (ENCRYPTION_ENABLED) {
      const fileId = path.basename(filePath, path.extname(filePath));
      const ivPath = path.join(STORAGE_BASE_PATH, `${fileId}.iv`);
      
      try {
        iv = await fs.readFile(ivPath);
      } catch (error) {
        console.warn(`IV file not found for ${filePath}, attempting decryption without IV`);
      }
    }

    // Decrypt file buffer
    const decryptedBuffer = decryptBuffer(encryptedBuffer, iv);
    
    return decryptedBuffer;
  } catch (error) {
    console.error('Failed to retrieve file:', error);
    throw new Error('File retrieval failed');
  }
};

/**
 * Delete file and associated IV from storage
 */
export const deleteFile = async (filePath) => {
  try {
    const fullPath = path.join(STORAGE_BASE_PATH, filePath);
    await fs.unlink(fullPath);

    // Delete IV file if it exists
    if (ENCRYPTION_ENABLED) {
      const fileId = path.basename(filePath, path.extname(filePath));
      const ivPath = path.join(STORAGE_BASE_PATH, `${fileId}.iv`);
      
      try {
        await fs.unlink(ivPath);
      } catch (error) {
        // IV file may not exist, ignore error
      }
    }

    return true;
  } catch (error) {
    console.error('Failed to delete file:', error);
    throw new Error('File deletion failed');
  }
};

/**
 * Clean up temporary files
 */
export const cleanupTempFiles = async (tempFilePaths) => {
  const results = await Promise.allSettled(
    tempFilePaths.map(filePath => deleteFile(filePath))
  );
  
  const failed = results.filter(r => r.status === 'rejected');
  if (failed.length > 0) {
    console.warn(`Failed to cleanup ${failed.length} temporary files`);
  }
  
  return {
    cleaned: results.filter(r => r.status === 'fulfilled').length,
    failed: failed.length
  };
};

/**
 * Generate signed URL for file download
 * In production, this would use GCP Cloud Storage signed URLs
 */
export const generateDownloadUrl = async (filePath, expirationMinutes = 60) => {
  // In production, generate GCS signed URL
  // For MVP, return a simple path
  return `/api/documents/download/${filePath}`;
};

/**
 * Virus scan placeholder
 * In production, integrate with ClamAV or cloud provider service
 */
export const scanFileForVirus = async (fileBuffer) => {
  // Placeholder for virus scanning
  // In production, integrate with antivirus service
  
  // Simulate scan delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // For MVP, always return clean
  return {
    clean: true,
    scannedAt: new Date().toISOString()
  };
};

/**
 * Validate storage health
 */
export const checkStorageHealth = async () => {
  try {
    await fs.access(STORAGE_BASE_PATH);
    return {
      healthy: true,
      path: STORAGE_BASE_PATH,
      encryption: ENCRYPTION_ENABLED,
      encryptionAlgorithm: ENCRYPTION_ENABLED ? ENCRYPTION_ALGORITHM : null
    };
  } catch (error) {
    return {
      healthy: false,
      error: error.message
    };
  }
};