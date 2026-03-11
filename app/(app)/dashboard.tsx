import { View, Text, TouchableOpacity, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useUser } from '@clerk/expo';
import { Colors } from '@/constants/colors';
import { useDriverDashboard } from '@/lib/hooks/use-driver-api';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorView } from '@/components/ErrorView';
import { getApiErrorMessage } from '@/lib/api/client';

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useUser();
  const { data, isLoading, isError, error, refetch, isFetching } = useDriverDashboard();

  if (isLoading) return <LoadingSpinner />;

  if (isError) {
    return (
      <ErrorView
        message={getApiErrorMessage(error, 'Failed to load dashboard')}
        onRetry={refetch}
      />
    );
  }

  const approvalStatus = data?.driver?.approvalStatus ?? 'INITIAL';
  const availabilityStatus = data?.driver?.availabilityStatus ?? 'UNAVAILABLE';
  const balance = parseFloat(data?.driver?.balance ?? '0').toFixed(2);
  const completedJobs = data?.ratings?.completedJobs ?? 0;
  const avgRating = data?.ratings?.averageRating;
  const reviewCount = data?.ratings?.count ?? 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
    >
      <Text style={styles.welcome}>
        Welcome, {data?.user?.firstName ?? user?.firstName ?? 'Driver'}
      </Text>

      {approvalStatus !== 'APPROVED' && (
        <View style={styles.approvalBanner}>
          <Text style={styles.approvalText}>
            {approvalStatus === 'PENDING'
              ? '⏳ Your account is pending admin approval.'
              : approvalStatus === 'REJECTED'
              ? '❌ Your account was rejected. Contact support.'
              : '📋 Complete your profile to get approved.'}
          </Text>
        </View>
      )}

      <View style={styles.statsGrid}>
        <StatCard
          label="Completed Jobs"
          value={completedJobs}
          color={Colors.statusCompleted}
        />
        <StatCard
          label="Reviews"
          value={reviewCount}
          color={Colors.statusQuoted}
        />
        <StatCard
          label="Avg Rating"
          value={avgRating != null ? avgRating.toFixed(1) : '—'}
          color={Colors.warning}
          isText
        />
        <StatCard
          label="Balance"
          value={`£${balance}`}
          color={Colors.success}
          isText
        />
      </View>

      <View style={styles.statusRow}>
        <View style={[styles.badge, availabilityStatus === 'AVAILABLE' ? styles.badgeAvailable : styles.badgeUnavailable]}>
          <Text style={styles.badgeText}>
            {availabilityStatus === 'AVAILABLE' ? '● Available' : '● Unavailable'}
          </Text>
        </View>
        <View style={[styles.badge, styles.badgeApproval]}>
          <Text style={styles.badgeText}>{approvalStatus}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push('/(app)/requests')}
      >
        <Text style={styles.buttonText}>View My Requests</Text>
      </TouchableOpacity>

      {data?.reviews && data.reviews.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Reviews</Text>
          {data.reviews.slice(0, 3).map((review, i) => (
            <View key={i} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <Text style={styles.reviewerName}>
                  {review.customer.firstName} {review.customer.lastName}
                </Text>
                <Text style={styles.reviewRating}>⭐ {review.rating}</Text>
              </View>
              <Text style={styles.reviewText}>{review.feedback}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function StatCard({
  label,
  value,
  color,
  isText = false,
}: {
  label: string;
  value: number | string;
  color: string;
  isText?: boolean;
}) {
  return (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Text style={[isText ? styles.statValueText : styles.statValue, { color }]}>
        {value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  welcome: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  approvalBanner: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.warning,
  },
  approvalText: {
    color: Colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    width: '47%',
    borderLeftWidth: 4,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statValueText: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
  statusRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeAvailable: {
    backgroundColor: '#052e16',
  },
  badgeUnavailable: {
    backgroundColor: '#1c1917',
  },
  badgeApproval: {
    backgroundColor: Colors.surfaceLight,
  },
  badgeText: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: '500',
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  buttonText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  reviewCard: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    padding: 14,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  reviewerName: {
    color: Colors.text,
    fontWeight: '600',
    fontSize: 14,
  },
  reviewRating: {
    color: Colors.warning,
    fontSize: 14,
  },
  reviewText: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
});
