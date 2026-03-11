import { useState } from 'react';
import { View, FlatList, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { useAssignedRequests } from '@/lib/hooks/use-driver-api';
import { RequestCard } from '@/components/RequestCard';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorView } from '@/components/ErrorView';
import { getApiErrorMessage } from '@/lib/api/client';

export default function RequestsListScreen() {
  const router = useRouter();
  const [page] = useState(1);
  const { data, isLoading, isError, error, refetch } = useAssignedRequests(page);

  if (isLoading) return <LoadingSpinner />;
  if (isError) return <ErrorView message={getApiErrorMessage(error, 'Failed to load requests')} onRetry={refetch} />;

  const requests = data?.data ?? [];

  return (
    <View style={styles.container}>
      <FlatList
        data={requests}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <RequestCard
            item={item}
            onPress={() => router.push(`/(app)/requests/${item.requestId}`)}
          />
        )}
        contentContainerStyle={styles.list}
        refreshing={false}
        onRefresh={refetch}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No requests assigned yet</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
