import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { useDriverProfile, useUpdateDriverSettings } from '@/lib/hooks/use-driver-api';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorView } from '@/components/ErrorView';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { CustomSlider } from '@/components/CustomSlider';
import { getApiErrorMessage } from '@/lib/api/client';
import { useToast } from '@/components/Toast';

function SettingsContent() {
  const insets = useSafeAreaInsets();
  const { data: profile, isLoading, isError, error, refetch } = useDriverProfile();
  const updateSettings = useUpdateDriverSettings();
  const { showToast } = useToast();

  const driver = profile?.driver;

  const [isAvailable, setIsAvailable] = useState(false);
  const [serviceRadius, setServiceRadius] = useState(50);
  const [maxWeight, setMaxWeight] = useState(2000);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (driver) {
      setIsAvailable(driver.availabilityStatus === 'AVAILABLE');
      setServiceRadius(driver.serviceRadius ?? 50);
      setMaxWeight(driver.maxWeight ?? 2000);
      setHasChanges(false);
    }
  }, [driver]);

  if (isLoading) return <LoadingSpinner />;
  if (isError || !profile) {
    return (
      <ErrorView
        message={getApiErrorMessage(error, 'Failed to load settings')}
        onRetry={refetch}
      />
    );
  }

  const markChanged = () => {
    if (!hasChanges) setHasChanges(true);
  };

  const handleAvailabilityChange = (val: boolean) => {
    setIsAvailable(val);
    markChanged();
  };

  const handleRadiusChange = (val: number) => {
    setServiceRadius(val);
    markChanged();
  };

  const handleWeightChange = (val: number) => {
    setMaxWeight(val);
    markChanged();
  };

  const handleUpdateSettings = async () => {
    try {
      await updateSettings.mutateAsync({
        serviceRadius,
        maxWeight,
        availabilityStatus: isAvailable ? 'AVAILABLE' : 'UNAVAILABLE',
      });
      setHasChanges(false);
      showToast('success', 'Settings Updated');
    } catch (err) {
      showToast('error', 'Update Failed', getApiErrorMessage(err, 'Failed to update settings. Please try again.'));
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: 40 + insets.bottom }]}
    >
      {/* Header */}
      <View style={styles.headerCard}>
        <Text style={styles.headerTitle}>Driver Settings</Text>
        <Text style={styles.headerSubtitle}>
          Update your driver settings. Update accurate information to receive notifications from users within your service radius.
        </Text>
      </View>

      {/* Service Availability */}
      <View style={styles.section}>
        <View style={styles.switchRow}>
          <View style={styles.switchInfo}>
            <Text style={styles.switchLabel}>Service Availability Status</Text>
            <Text style={styles.switchHint}>
              Make sure this is switched on to receive requests from users within your service radius.
            </Text>
          </View>
          <Switch
            value={isAvailable}
            onValueChange={handleAvailabilityChange}
            trackColor={{ false: Colors.surfaceLight, true: Colors.primary + '66' }}
            thumbColor={isAvailable ? Colors.primary : Colors.textMuted}
          />
        </View>
      </View>

      {/* Service Radius */}
      <View style={styles.section}>
        <View style={styles.sliderHeader}>
          <Text style={styles.sliderLabel}>Preferred Service Radius (Miles)</Text>
          <Text style={styles.sliderValue}>{serviceRadius}</Text>
        </View>
        <CustomSlider
          minimumValue={1}
          maximumValue={300}
          step={1}
          value={serviceRadius}
          onValueChange={handleRadiusChange}
        />
        <Text style={styles.sliderHint}>
          Set the maximum distance (in miles) within which you can provide towing services.
        </Text>
      </View>

      {/* Max Weight */}
      <View style={styles.section}>
        <View style={styles.sliderHeader}>
          <Text style={styles.sliderLabel}>Max Weight (kg)</Text>
          <Text style={styles.sliderValue}>{maxWeight}</Text>
        </View>
        <CustomSlider
          minimumValue={500}
          maximumValue={5000}
          step={100}
          value={maxWeight}
          onValueChange={handleWeightChange}
        />
        <Text style={styles.sliderHint}>
          Adjust based on the maximum weight your recovery is certified to carry.
        </Text>
      </View>

      {/* Current Location */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Current Location</Text>
        <View style={styles.locationRow}>
          <Text style={styles.locationText}>
            {driver?.address || driver?.postcode || 'No location set'}
          </Text>
        </View>
        {driver?.city && (
          <Text style={styles.locationDetail}>
            {[driver.city, driver.state].filter(Boolean).join(', ')}
          </Text>
        )}
      </View>

      {/* Update Button */}
      <TouchableOpacity
        style={[
          styles.updateButton,
          (!hasChanges || updateSettings.isPending) && styles.updateButtonDisabled,
        ]}
        onPress={handleUpdateSettings}
        disabled={!hasChanges || updateSettings.isPending}
        activeOpacity={0.8}
      >
        {updateSettings.isPending ? (
          <ActivityIndicator color={Colors.text} />
        ) : (
          <Text style={styles.updateButtonText}>
            {hasChanges ? 'Update Settings' : 'No Changes'}
          </Text>
        )}
      </TouchableOpacity>

      {/* Info */}
      <Text style={styles.infoText}>
        We need your current location to send you jobs based on the service radius and service availability status you set. It can be changed as you move. Turn off Service Availability Status if you do not want any job notifications.
      </Text>
    </ScrollView>
  );
}

export default function SettingsScreen() {
  return (
    <ErrorBoundary>
      <SettingsContent />
    </ErrorBoundary>
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
    marginBottom: 16,
  },
  headerTitle: {
    color: Colors.text,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 6,
  },
  headerSubtitle: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
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
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchInfo: {
    flex: 1,
    marginRight: 16,
  },
  switchLabel: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  switchHint: {
    color: Colors.primary,
    fontSize: 12,
    lineHeight: 16,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sliderLabel: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  sliderValue: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  sliderHint: {
    color: Colors.primary,
    fontSize: 12,
    lineHeight: 16,
    marginTop: 4,
  },
  locationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationText: {
    color: Colors.text,
    fontSize: 14,
    flex: 1,
  },
  locationDetail: {
    color: Colors.textSecondary,
    fontSize: 13,
    marginTop: 4,
  },
  updateButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  updateButtonDisabled: {
    opacity: 0.5,
  },
  updateButtonText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  infoText: {
    color: Colors.primary,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
});
