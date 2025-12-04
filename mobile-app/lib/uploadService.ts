import { supabase } from './supabase';
import * as ImageManipulator from 'expo-image-manipulator';
import { decode } from 'base64-arraybuffer';

export interface ImageUploadResult {
  url: string;
  path: string;
}

export interface ImageUploadError {
  error: string;
  details?: any;
}

/**
 * Compresses an image to optimize for web delivery
 * @param uri - Local file URI of the image
 * @param maxWidth - Maximum width in pixels (default: 1200)
 * @param quality - Compression quality 0-1 (default: 0.8)
 * @returns Compressed image URI
 */
export async function compressImage(
  uri: string,
  maxWidth: number = 1200,
  quality: number = 0.8
): Promise<string> {
  try {
    const manipResult = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: maxWidth } }],
      { compress: quality, format: ImageManipulator.SaveFormat.JPEG }
    );
    return manipResult.uri;
  } catch (error) {
    console.error('Error compressing image:', error);
    throw error;
  }
}

/**
 * Uploads a single image to Supabase Storage
 * @param uri - Local file URI of the image
 * @param userId - User ID for folder organization
 * @param bucket - Storage bucket name (default: 'product-images')
 * @returns Upload result with public URL and storage path
 */
export async function uploadImage(
  uri: string,
  userId: string,
  bucket: string = 'product-images'
): Promise<ImageUploadResult> {
  try {
    // Compress image before upload
    const compressedUri = await compressImage(uri);

    // Read file as base64
    const response = await fetch(compressedUri);
    const blob = await response.blob();
    const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = reject;
      reader.readAsArrayBuffer(blob);
    });

    // Generate unique filename
    const fileExt = 'jpg';
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, arrayBuffer, {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (error) {
      throw error;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return {
      url: urlData.publicUrl,
      path: filePath,
    };
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
}

/**
 * Uploads multiple images to Supabase Storage
 * @param uris - Array of local file URIs
 * @param userId - User ID for folder organization
 * @param bucket - Storage bucket name (default: 'product-images')
 * @param onProgress - Optional callback for upload progress
 * @returns Array of upload results
 */
export async function uploadMultipleImages(
  uris: string[],
  userId: string,
  bucket: string = 'product-images',
  onProgress?: (current: number, total: number) => void
): Promise<ImageUploadResult[]> {
  const results: ImageUploadResult[] = [];
  
  for (let i = 0; i < uris.length; i++) {
    try {
      const result = await uploadImage(uris[i], userId, bucket);
      results.push(result);
      
      if (onProgress) {
        onProgress(i + 1, uris.length);
      }
    } catch (error) {
      console.error(`Error uploading image ${i + 1}:`, error);
      throw error;
    }
  }
  
  return results;
}

/**
 * Deletes an image from Supabase Storage
 * @param path - Storage path of the image
 * @param bucket - Storage bucket name (default: 'product-images')
 */
export async function deleteImage(
  path: string,
  bucket: string = 'product-images'
): Promise<void> {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error deleting image:', error);
    throw error;
  }
}

/**
 * Deletes multiple images from Supabase Storage
 * @param paths - Array of storage paths
 * @param bucket - Storage bucket name (default: 'product-images')
 */
export async function deleteMultipleImages(
  paths: string[],
  bucket: string = 'product-images'
): Promise<void> {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove(paths);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error deleting images:', error);
    throw error;
  }
}

/**
 * Gets the file size of an image in bytes
 * @param uri - Local file URI
 * @returns File size in bytes
 */
export async function getImageSize(uri: string): Promise<number> {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    return blob.size;
  } catch (error) {
    console.error('Error getting image size:', error);
    return 0;
  }
}

/**
 * Validates image before upload
 * @param uri - Local file URI
 * @param maxSizeMB - Maximum file size in MB (default: 5)
 * @returns Validation result
 */
export async function validateImage(
  uri: string,
  maxSizeMB: number = 5
): Promise<{ valid: boolean; error?: string }> {
  try {
    const size = await getImageSize(uri);
    const sizeMB = size / (1024 * 1024);
    
    if (sizeMB > maxSizeMB) {
      return {
        valid: false,
        error: `Image size (${sizeMB.toFixed(2)}MB) exceeds maximum allowed size of ${maxSizeMB}MB`,
      };
    }
    
    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: 'Failed to validate image',
    };
  }
}
