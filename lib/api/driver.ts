import { apiClient } from './client';
import type {
  PaginatedResponse,
  AssignedRequest,
  AssignedRequestDetail,
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
