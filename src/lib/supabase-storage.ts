import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create client only if credentials are available
export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Upload a file to Supabase Storage
 * @param file File or Blob to upload
 * @param bucket Supabase bucket name (default: 'uploads')
 * @param path Optional path within bucket
 * @returns Public URL of uploaded file
 */
export async function uploadFile(
  file: File | Blob,
  bucket: string = 'uploads',
  path?: string
): Promise<string> {
  if (!supabase) {
    throw new Error('Supabase not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }
  
  const fileName = file instanceof File ? file.name : `file-${Date.now()}`;
  const filePath = path ? `${path}/${fileName}` : fileName;

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return publicUrl;
}

/**
 * Upload multiple files to Supabase Storage
 * @param files Array of files to upload
 * @param bucket Supabase bucket name (default: 'uploads')
 * @param path Optional path within bucket
 * @returns Array of public URLs
 */
export async function uploadMultipleFiles(
  files: (File | Blob)[],
  bucket: string = 'uploads',
  path?: string
): Promise<string[]> {
  const uploadPromises = files.map(file => uploadFile(file, bucket, path));
  return Promise.all(uploadPromises);
}

/**
 * Delete a file from Supabase Storage
 * @param filePath Path to file in bucket
 * @param bucket Supabase bucket name (default: 'uploads')
 */
export async function deleteFile(
  filePath: string,
  bucket: string = 'uploads'
): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }
  
  const { error } = await supabase.storage
    .from(bucket)
    .remove([filePath]);

  if (error) {
    throw new Error(`Delete failed: ${error.message}`);
  }
}
