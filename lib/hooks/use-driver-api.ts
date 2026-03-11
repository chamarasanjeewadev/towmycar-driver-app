import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchAssignedRequests,
  fetchRequestDetails,
  submitQuote,
  fetchDashboard,
  fetchProfile,
} from '@/lib/api/driver';
import type { QuoteSubmission, AssignedRequestDetail } from '@/lib/types/api';

export function useAssignedRequests(page = 1) {
  return useQuery({
    queryKey: ['assignedRequests', page],
    queryFn: () => fetchAssignedRequests(page),
    retry: 1,
  });
}

export function useRequestDetails(requestId: number) {
  return useQuery<AssignedRequestDetail>({
    queryKey: ['requestDetails', requestId],
    queryFn: () => fetchRequestDetails(requestId),
    enabled: !!requestId,
    retry: 1,
  });
}

export function useSubmitQuote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      requestId,
      quote,
    }: {
      requestId: number;
      quote: QuoteSubmission;
    }) => submitQuote(requestId, quote),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignedRequests'] });
      queryClient.invalidateQueries({ queryKey: ['requestDetails'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useDriverDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboard,
    retry: 1,
  });
}

export function useDriverProfile() {
  return useQuery({
    queryKey: ['driverProfile'],
    queryFn: fetchProfile,
    retry: 1,
  });
}
