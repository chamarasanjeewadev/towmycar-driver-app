import { useState } from 'react';
import { View, FlatList, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { useAssignedRequests, useClosedJobsHistory } from '@/lib/hooks/use-driver-api';
import { RequestCard } from '@/components/RequestCard';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorView } from '@/components/ErrorView';
import { getApiErrorMessage } from '@/lib/api/client';
import type { AssignedRequest, ClosedJobHistoryItem } from '@/lib/types/api';

type Tab = 'active' | 'history';

/** Flatten the nested history item into the same shape RequestCard expects */
function toCardItem(h: ClosedJobHistoryItem): AssignedRequest {
  return {
    id: h.id,
    requestId: h.requestId,
    driverStatus: h.driverStatus,
    userStatus: h.userStatus,
    estimation: h.estimation,
    explanation: h.explanation,
    updatedAt: h.updatedAt,
    createdAt: h.createdAt,
    isCompleted: true,
    isJobConfirmed: h.isJobConfirmed,
    address: h.userRequest?.address ?? null,
    postCode: h.userRequest?.postCode ?? null,
    toAddress: h.userRequest?.toAddress ?? null,
    toPostCode: h.userRequest?.toPostCode ?? null,
    description: h.userRequest?.description ?? null,
    regNo: h.userRequest?.regNo ?? null,
    make: h.userRequest?.make ?? null,
    makeModel: h.userRequest?.makeModel ?? null,
    requestType: h.userRequest?.requestType ?? null,
    status: h.userRequest?.status ?? '',
    firstName: null,
    lastName: null,
    mobileNumber: h.userRequest?.mobileNumber ?? null,
    userLocationLat: null,
    userLocationLng: null,
  };
}

export default function RequestsListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>('active');
  const [page] = useState(1);

  const active = useAssignedRequests(page);
  const history = useClosedJobsHistory(page);

  const isLoading = tab === 'active' ? active.isLoading : history.isLoading;
  const isError = tab === 'active' ? active.isError : history.isError;
  const error = tab === 'active' ? active.error : history.error;
  const refetch = tab === 'active' ? active.refetch : history.refetch;

  const activeItems: AssignedRequest[] = active.data?.data ?? [];
  const historyItems: AssignedRequest[] = (history.data?.data ?? []).map(toCardItem);
  const items = tab === 'active' ? activeItems : historyItems;

  return (
    <View style={styles.container}>
      {/* Tab bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, tab === 'active' && styles.tabActive]}
          onPress={() => setTab('active')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, tab === 'active' && styles.tabTextActive]}>
            Active
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'history' && styles.tabActive]}
          onPress={() => setTab('history')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, tab === 'history' && styles.tabTextActive]}>
            History
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <LoadingSpinner />
      ) : isError ? (
        <ErrorView message={getApiErrorMessage(error, 'Failed to load requests')} onRetry={refetch} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <RequestCard
              item={item}
              onPress={() => router.push(`/(app)/requests/${item.requestId}`)}
            />
          )}
          contentContainerStyle={[styles.list, { paddingBottom: 16 + insets.bottom }]}
          refreshing={false}
          onRefresh={refetch}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>
                {tab === 'active' ? 'No active requests' : 'No completed jobs yet'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    color: Colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextActive: {
    color: Colors.text,
  },
  list: {
    padding: 16,
    flexGrow: 1,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: 16,
  },
});
