import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/expo';
import {
  fetchAssignedRequests,
  fetchRequestDetails,
  submitQuote,
  updateDriverStatus,
  closeAndRateJob,
  fetchClosedJobsHistory,
  fetchDashboard,
  fetchProfile,
  updateDriverSettings,
} from '@/lib/api/driver';
import type { QuoteSubmission, AssignedRequestDetail } from '@/lib/types/api';

export function useAssignedRequests(page = 1) {
  const { isSignedIn } = useAuth();
  return useQuery({
    queryKey: ['assignedRequests', page],
    queryFn: () => fetchAssignedRequests(page),
    enabled: !!isSignedIn,
    retry: 1,
  });
}

export function useRequestDetails(requestId: number) {
  const { isSignedIn } = useAuth();
  return useQuery<AssignedRequestDetail>({
    queryKey: ['requestDetails', requestId],
    queryFn: () => fetchRequestDetails(requestId),
    enabled: !!isSignedIn && !!requestId,
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

export function useConfirmJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      requestId,
      existingQuote,
    }: {
      requestId: number;
      existingQuote?: { estimation: number; explanation: string };
    }) => updateDriverStatus(requestId, 'ACCEPTED', existingQuote),
    onSuccess: (_, { requestId }) => {
      queryClient.invalidateQueries({ queryKey: ['assignedRequests'] });
      queryClient.invalidateQueries({ queryKey: ['requestDetails', requestId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useCloseJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      requestId,
      markAsCompleted,
      reason,
    }: {
      requestId: number;
      markAsCompleted: boolean;
      reason?: string;
    }) => closeAndRateJob(requestId, markAsCompleted, reason),
    onSuccess: (_, { requestId }) => {
      queryClient.invalidateQueries({ queryKey: ['assignedRequests'] });
      queryClient.invalidateQueries({ queryKey: ['requestDetails', requestId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useClosedJobsHistory(page = 1) {
  const { isSignedIn } = useAuth();
  return useQuery({
    queryKey: ['closedJobsHistory', page],
    queryFn: () => fetchClosedJobsHistory(page),
    enabled: !!isSignedIn,
    retry: 1,
  });
}

export function useDriverDashboard() {
  const { isSignedIn } = useAuth();
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboard,
    enabled: !!isSignedIn,
    retry: 1,
  });
}

export function useDriverProfile() {
  const { isSignedIn } = useAuth();
  return useQuery({
    queryKey: ['driverProfile'],
    queryFn: fetchProfile,
    enabled: !!isSignedIn,
    retry: 1,
  });
}

export function useUpdateDriverSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (settings: {
      serviceRadius?: number;
      maxWeight?: number;
      availabilityStatus?: 'AVAILABLE' | 'UNAVAILABLE';
      address?: string | null;
    }) => updateDriverSettings(settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driverProfile'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
