import { apiClient } from './client';
import type {
  PaginatedResponse,
  AssignedRequest,
  AssignedRequestDetail,
  ClosedJobHistoryItem,
  QuoteSubmission,
  DriverStatsProfile,
  DriverProfile,
} from '@/lib/types/api';

export async function fetchAssignedRequests(page = 1, limit = 10) {
  const { data } = await apiClient.get<PaginatedResponse<AssignedRequest>>(
    '/driver/assigned-requests',
    { params: { page, limit } },
  );
  return data;
}

export async function fetchRequestDetails(requestId: number) {
  const { data } = await apiClient.get<AssignedRequestDetail>(
    `/driver/assigned-request/${requestId}`,
  );
  return data;
}

export async function submitQuote(requestId: number, quote: QuoteSubmission) {
  const { data } = await apiClient.patch(
    `/driver/assignment-update/${requestId}`,
    quote,
  );
  return data;
}

export async function updateDriverStatus(
  requestId: number,
  driverStatus: string,
  existingQuote?: { estimation: number; explanation: string },
) {
  const body: Record<string, unknown> = { driverStatus };
  if (existingQuote) {
    body.estimation = existingQuote.estimation;
    body.explanation = existingQuote.explanation;
  }
  const { data } = await apiClient.patch(
    `/driver/assignment-update/${requestId}`,
    body,
  );
  return data;
}

export async function fetchClosedJobsHistory(page = 1, limit = 10) {
  const { data } = await apiClient.get<PaginatedResponse<ClosedJobHistoryItem>>(
    '/driver/closed-jobs-history',
    { params: { page, limit } },
  );
  return data;
}

export async function closeAndRateJob(
  requestId: number,
  markAsCompleted: boolean,
  reason?: string,
  completionPhotos?: Array<{ photoNumber: number; fileName: string }>,
) {
  const { data } = await apiClient.post(
    `/driver/close-and-rate/${requestId}`,
    {
      markAsCompleted,
      ...(reason ? { reason } : {}),
      ...(completionPhotos && completionPhotos.length > 0
        ? { completionPhotos }
        : {}),
    },
  );
  return data;
}

export async function fetchDashboard() {
  const { data } = await apiClient.get<DriverStatsProfile>(
    '/driver/driver-dashboard',
  );
  return data;
}

export async function fetchProfile() {
  const { data } = await apiClient.get<DriverProfile>('/driver/profile');
  return data;
}

export async function updateDriverSettings(settings: {
  serviceRadius?: number;
  maxWeight?: number;
  availabilityStatus?: 'AVAILABLE' | 'UNAVAILABLE';
  address?: string | null;
}) {
  const { data } = await apiClient.patch('/driver/profile-settings', settings);
  return data;
}

export async function deleteDriverAccount() {
  const { data } = await apiClient.delete('/driver/account');
  return data;
}
