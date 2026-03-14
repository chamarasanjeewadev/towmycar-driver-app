import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { useDriverProfile, useDriverDashboard } from '@/lib/hooks/use-driver-api';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorView } from '@/components/ErrorView';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { getApiErrorMessage } from '@/lib/api/client';

export default function ProfileScreen() {
  return (
    <ErrorBoundary>
      <ProfileContent />
    </ErrorBoundary>
  );
}

function ProfileContent() {
  const insets = useSafeAreaInsets();
  const { data: profile, isLoading, isError, error, refetch, isFetching } = useDriverProfile();
  const { data: dashboard } = useDriverDashboard();

  if (isLoading) return <LoadingSpinner />;
  if (isError || !profile) {
    return (
      <ErrorView
        message={getApiErrorMessage(error, 'Failed to load profile')}
        onRetry={refetch}
      />
    );
  }

  const driver = profile.driver;
  const ratings = dashboard?.ratings;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: 32 + insets.bottom }]}
      refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
    >
      {/* Profile Header */}
      <View style={styles.headerCard}>
        {profile.imageUrl ? (
          <Image source={{ uri: profile.imageUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitial}>
              {profile.firstName?.charAt(0)?.toUpperCase() ?? 'D'}
            </Text>
          </View>
        )}
        <Text style={styles.name}>
          {profile.firstName} {profile.lastName}
        </Text>
        <Text style={styles.email}>{profile.email}</Text>
        <View style={styles.badgeRow}>
          <View
            style={[
              styles.badge,
              {
                backgroundColor:
                  driver?.approvalStatus === 'APPROVED'
                    ? Colors.success + '22'
                    : Colors.warning + '22',
              },
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                {
                  color:
                    driver?.approvalStatus === 'APPROVED'
                      ? Colors.success
                      : Colors.warning,
                },
              ]}
            >
              {driver?.approvalStatus ?? 'PENDING'}
            </Text>
          </View>
          <View
            style={[
              styles.badge,
              {
                backgroundColor:
                  driver?.availabilityStatus === 'AVAILABLE'
                    ? Colors.success + '22'
                    : Colors.textMuted + '22',
              },
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                {
                  color:
                    driver?.availabilityStatus === 'AVAILABLE'
                      ? Colors.success
                      : Colors.textMuted,
                },
              ]}
            >
              {driver?.availabilityStatus === 'AVAILABLE' ? 'Available' : 'Unavailable'}
            </Text>
          </View>
        </View>
      </View>

      {/* Stats */}
      {ratings && (
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: Colors.statusCompleted }]}>
              {ratings.completedJobs}
            </Text>
            <Text style={styles.statLabel}>Jobs</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: Colors.warning }]}>
              {ratings.averageRating?.toFixed(1) ?? '—'}
            </Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: Colors.statusQuoted }]}>
              {ratings.count}
            </Text>
            <Text style={styles.statLabel}>Reviews</Text>
          </View>
        </View>
      )}

      {/* Contact Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact Details</Text>
        <DetailRow label="Phone" value={driver?.phoneNumber ?? '-'} />
        <DetailRow label="Email" value={profile.email ?? '-'} />
      </View>

      {/* Vehicle Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Vehicle Details</Text>
        <DetailRow label="Vehicle Type" value={driver?.vehicleType ?? '-'} />
        <DetailRow label="Registration" value={driver?.vehicleRegistration ?? '-'} />
        <DetailRow label="License No." value={driver?.licenseNumber ?? '-'} />
        <DetailRow label="Max Weight" value={driver?.maxWeight ? `${driver.maxWeight} kg` : '-'} />
      </View>

      {/* Service Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Service Details</Text>
        <DetailRow label="Service Radius" value={driver?.serviceRadius ? `${driver.serviceRadius} miles` : '-'} />
        <DetailRow label="Postcode" value={driver?.postcode ?? '-'} />
        <DetailRow label="City" value={driver?.city ?? '-'} />
        <DetailRow label="Address" value={driver?.address ?? '-'} />
        {driver?.organizationName && (
          <DetailRow label="Organization" value={driver.organizationName} />
        )}
      </View>

      {/* Service Type */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Service Type</Text>
        <View style={styles.servicesRow}>
          <View style={[styles.serviceBadge, styles.serviceBadgeActive]}>
            <Text style={[styles.serviceText, styles.serviceTextActive]}>
              Tow Driver
            </Text>
          </View>
        </View>
      </View>

      {/* Account */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <DetailRow label="Balance" value={driver?.balance ? `£${parseFloat(driver.balance).toFixed(2)}` : '£0.00'} />
        <DetailRow label="Terms Agreed" value={driver?.agreedTerms ? 'Yes' : 'No'} />
        <DetailRow label="Member Since" value={new Date(profile.createdAt).toLocaleDateString()} />
      </View>

      {/* Profile Description */}
      {driver?.profileDescription && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.description}>{driver.profileDescription}</Text>
        </View>
      )}
    </ScrollView>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 16,
  },
  headerCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginBottom: 12,
  },
  avatarPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarInitial: {
    color: Colors.text,
    fontSize: 28,
    fontWeight: '700',
  },
  name: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  email: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginBottom: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statsRow: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 2,
  },
  statLabel: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.border,
  },
  section: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border + '55',
  },
  detailLabel: {
    color: Colors.textMuted,
    fontSize: 14,
  },
  detailValue: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
    marginLeft: 12,
  },
  servicesRow: {
    flexDirection: 'row',
    gap: 10,
  },
  serviceBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  serviceBadgeActive: {
    backgroundColor: Colors.primary + '22',
    borderColor: Colors.primary + '66',
  },
  serviceText: {
    color: Colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  serviceTextActive: {
    color: Colors.primary,
  },
  description: {
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
});
