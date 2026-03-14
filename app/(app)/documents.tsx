import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { useDriverProfile } from '@/lib/hooks/use-driver-api';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorView } from '@/components/ErrorView';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { getApiErrorMessage } from '@/lib/api/client';

interface DocumentItem {
  label: string;
  icon: string;
  status: 'uploaded' | 'pending' | 'missing';
  description: string;
}

export default function DocumentsScreen() {
  return (
    <ErrorBoundary>
      <DocumentsContent />
    </ErrorBoundary>
  );
}

function DocumentsContent() {
  const insets = useSafeAreaInsets();
  const { data: profile, isLoading, isError, error, refetch } = useDriverProfile();

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

  // Derive document status from profile fields
  const documents: DocumentItem[] = [
    {
      label: 'Driving License',
      icon: 'card-outline',
      status: driver?.licenseNumber ? 'uploaded' : 'missing',
      description: driver?.licenseNumber
        ? `License: ${driver.licenseNumber}`
        : 'Please upload your driving license',
    },
    {
      label: 'Vehicle Registration',
      icon: 'car-outline',
      status: driver?.vehicleRegistration ? 'uploaded' : 'missing',
      description: driver?.vehicleRegistration
        ? `Reg: ${driver.vehicleRegistration}`
        : 'Please upload vehicle registration document',
    },
    {
      label: 'Insurance Certificate',
      icon: 'shield-checkmark-outline',
      status: 'pending',
      description: 'Business insurance documentation',
    },
    {
      label: 'MOT Certificate',
      icon: 'document-text-outline',
      status: 'pending',
      description: 'Current MOT certificate for your vehicle',
    },
    {
      label: 'Terms & Conditions',
      icon: 'checkbox-outline',
      status: driver?.agreedTerms ? 'uploaded' : 'missing',
      description: driver?.agreedTerms
        ? 'Terms agreed'
        : 'Please review and accept the terms',
    },
  ];

  const getStatusColor = (status: DocumentItem['status']) => {
    switch (status) {
      case 'uploaded':
        return Colors.success;
      case 'pending':
        return Colors.warning;
      case 'missing':
        return Colors.error;
    }
  };

  const getStatusLabel = (status: DocumentItem['status']) => {
    switch (status) {
      case 'uploaded':
        return 'Complete';
      case 'pending':
        return 'Pending';
      case 'missing':
        return 'Required';
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingBottom: 32 + insets.bottom }]}>
      {/* Status Summary */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Document Status</Text>
        <Text style={styles.summarySubtitle}>
          Keep your documents up to date to maintain your driver status.
        </Text>
        <View style={styles.summaryStats}>
          <View style={styles.summaryStatItem}>
            <Text style={[styles.summaryStatValue, { color: Colors.success }]}>
              {documents.filter((d) => d.status === 'uploaded').length}
            </Text>
            <Text style={styles.summaryStatLabel}>Complete</Text>
          </View>
          <View style={styles.summaryStatItem}>
            <Text style={[styles.summaryStatValue, { color: Colors.warning }]}>
              {documents.filter((d) => d.status === 'pending').length}
            </Text>
            <Text style={styles.summaryStatLabel}>Pending</Text>
          </View>
          <View style={styles.summaryStatItem}>
            <Text style={[styles.summaryStatValue, { color: Colors.error }]}>
              {documents.filter((d) => d.status === 'missing').length}
            </Text>
            <Text style={styles.summaryStatLabel}>Required</Text>
          </View>
        </View>
      </View>

      {/* Document List */}
      {documents.map((doc, index) => (
        <View key={index} style={styles.docCard}>
          <View style={styles.docIconContainer}>
            <Ionicons
              name={doc.icon as any}
              size={24}
              color={getStatusColor(doc.status)}
            />
          </View>
          <View style={styles.docInfo}>
            <Text style={styles.docLabel}>{doc.label}</Text>
            <Text style={styles.docDescription}>{doc.description}</Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(doc.status) + '22' },
            ]}
          >
            <Text
              style={[styles.statusText, { color: getStatusColor(doc.status) }]}
            >
              {getStatusLabel(doc.status)}
            </Text>
          </View>
        </View>
      ))}

      {/* Info Banner */}
      <View style={styles.infoBanner}>
        <Ionicons name="information-circle-outline" size={20} color={Colors.info} />
        <Text style={styles.infoText}>
          Document uploads and verification are managed through the web portal.
          Contact support if you need to update any documents.
        </Text>
      </View>
    </ScrollView>
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
  summaryCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  summaryTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  summarySubtitle: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryStatItem: {
    alignItems: 'center',
  },
  summaryStatValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 2,
  },
  summaryStatLabel: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  docCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  docIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docInfo: {
    flex: 1,
  },
  docLabel: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  docDescription: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.info + '12',
    borderRadius: 10,
    padding: 14,
    marginTop: 8,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.info + '33',
  },
  infoText: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
});
