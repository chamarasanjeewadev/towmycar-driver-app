import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { useRequestDetails, useSubmitQuote } from '@/lib/hooks/use-driver-api';
import { StatusBadge } from '@/components/StatusBadge';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorView } from '@/components/ErrorView';
import { getApiErrorMessage } from '@/lib/api/client';

export default function RequestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const requestId = Number(id);

  const { data: request, isLoading, isError, error, refetch } = useRequestDetails(requestId);
  const submitQuote = useSubmitQuote();

  const [estimation, setEstimation] = useState('');
  const [explanation, setExplanation] = useState('');
  const [vehicleNo, setVehicleNo] = useState('');

  if (isLoading) return <LoadingSpinner />;
  if (isError || !request) {
    return (
      <ErrorView
        message={getApiErrorMessage(error, 'Failed to load request details')}
        onRetry={refetch}
      />
    );
  }

  const hasQuoted = request.driverStatus === 'QUOTED' || request.driverStatus === 'ACCEPTED';
  const jobInfo = request.userRequest;
  const customer = request.customer;

  const handleSubmitQuote = async () => {
    const amount = parseFloat(estimation);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid positive amount.');
      return;
    }
    if (!explanation.trim()) {
      Alert.alert('Missing Explanation', 'Please provide an explanation for your quote.');
      return;
    }
    if (!vehicleNo.trim()) {
      Alert.alert('Missing Vehicle', 'Please enter your vehicle registration number.');
      return;
    }

    try {
      await submitQuote.mutateAsync({
        requestId,
        quote: {
          estimation: amount,
          explanation: explanation.trim(),
          vehicleNo: vehicleNo.trim(),
          driverStatus: 'QUOTED',
        },
      });
      Alert.alert('Success', 'Quote submitted successfully.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err) {
      Alert.alert('Error', getApiErrorMessage(err, 'Failed to submit quote. Please try again.'));
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.sectionTitle}>Vehicle</Text>
            <StatusBadge status={request.driverStatus} />
          </View>
          <DetailRow label="Make" value={jobInfo?.make ?? '-'} />
          <DetailRow label="Model" value={jobInfo?.makeModel ?? '-'} />
          <DetailRow label="Reg No" value={jobInfo?.regNo ?? '-'} />
          <DetailRow label="Type" value={jobInfo?.requestType ?? '-'} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
          <DetailRow label="Pickup" value={jobInfo?.address ?? request.address ?? '-'} />
          <DetailRow label="Post Code" value={jobInfo?.postCode ?? '-'} />
          {(jobInfo?.toAddress || request.toAddress) && (
            <DetailRow label="Drop Off" value={jobInfo?.toAddress ?? request.toAddress ?? '-'} />
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer</Text>
          <DetailRow
            label="Name"
            value={[customer?.firstName, customer?.lastName].filter(Boolean).join(' ') || '-'}
          />
          <DetailRow label="Phone" value={customer?.mobileNumber ?? '-'} />
        </View>

        {jobInfo?.description ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{jobInfo.description}</Text>
          </View>
        ) : null}

        {hasQuoted ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Quote</Text>
            <DetailRow label="Amount" value={request.estimation ? `£${request.estimation}` : '-'} />
            <DetailRow label="Explanation" value={request.explanation ?? '-'} />
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Submit Quote</Text>

            <Text style={styles.label}>Estimated Amount (£)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 150"
              placeholderTextColor={Colors.textMuted}
              value={estimation}
              onChangeText={setEstimation}
              keyboardType="decimal-pad"
            />

            <Text style={styles.label}>Explanation</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe your quote..."
              placeholderTextColor={Colors.textMuted}
              value={explanation}
              onChangeText={setExplanation}
              multiline
              numberOfLines={3}
            />

            <Text style={styles.label}>Your Vehicle Registration</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. AB12 CDE"
              placeholderTextColor={Colors.textMuted}
              value={vehicleNo}
              onChangeText={setVehicleNo}
              autoCapitalize="characters"
            />

            <TouchableOpacity
              style={[styles.submitButton, submitQuote.isPending && styles.buttonDisabled]}
              onPress={handleSubmitQuote}
              disabled={submitQuote.isPending}
            >
              {submitQuote.isPending ? (
                <ActivityIndicator color={Colors.text} />
              ) : (
                <Text style={styles.submitText}>Submit Quote</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
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
  section: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    paddingVertical: 6,
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
  description: {
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  label: {
    color: Colors.textSecondary,
    fontSize: 13,
    marginBottom: 4,
    marginTop: 8,
  },
  input: {
    backgroundColor: Colors.surfaceLight,
    color: Colors.text,
    borderRadius: 8,
    padding: 14,
    fontSize: 15,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: Colors.success,
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  submitText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
});
