import { apiClient } from './client';

export type SignedRequestPhoto = {
  photoNumber: number;
  s3Path: string;
  fileName: string;
  uploadedAt: string;
  signedUrl: string;
};

/**
 * Fetch CloudFront-signed URLs for the driver's own completion photos on a request.
 */
export async function fetchDriverCompletionPhotos(
  requestId: number,
): Promise<SignedRequestPhoto[]> {
  const { data } = await apiClient.get<{ photos: SignedRequestPhoto[] }>(
    `/driver/completion-photos/${requestId}`,
  );
  return data.photos;
}

/**
 * Fetch CloudFront-signed URLs for the customer's request photos.
 * Driver must already have an assignment on this request.
 */
export async function fetchDriverRequestPhotos(
  requestId: number,
): Promise<SignedRequestPhoto[]> {
  const { data } = await apiClient.get<{ photos: SignedRequestPhoto[] }>(
    `/driver/request-photos/${requestId}`,
  );
  return data.photos;
}

/**
 * Fetch presigned PUT URLs (3 slots) for uploading driver completion photos
 * for a given assignment.
 */
export async function getCompletionPhotoPresignedUrls(
  assignmentId: number,
  extension: string = '.jpg',
): Promise<{
  presignedUrls: Array<{ photoNumber: number; presignedUrl: string }>;
}> {
  const { data } = await apiClient.get(
    '/driver/get-completion-photo-presigned-url',
    { params: { assignmentId, extension } },
  );
  return data;
}

/**
 * Upload a single image file to its S3 presigned URL.
 */
export async function uploadFileToS3(
  presignedUrl: string,
  uri: string,
  contentType: string,
): Promise<void> {
  const response = await fetch(uri);
  const blob = await response.blob();

  const putRes = await fetch(presignedUrl, {
    method: 'PUT',
    body: blob,
    headers: { 'Content-Type': contentType },
  });

  if (!putRes.ok) {
    throw new Error(`S3 upload failed: ${putRes.status} ${putRes.statusText}`);
  }
}
