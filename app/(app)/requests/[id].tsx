import React, { useState, useEffect } from 'react';
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
  Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import {
  useRequestDetails,
  useSubmitQuote,
  useConfirmJob,
  useCloseJob,
} from '@/lib/hooks/use-driver-api';
import { StatusBadge } from '@/components/StatusBadge';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorView } from '@/components/ErrorView';
import { getApiErrorMessage } from '@/lib/api/client';
import { JobFlowStepper, getJobStep } from '@/components/JobFlowStepper';
import { QuoteRangeIndicator } from '@/components/QuoteRangeIndicator';
import { useToast } from '@/components/Toast';

const MAX_QUOTE_ATTEMPTS = 3;

// Session-level quote count per requestId (resets on app restart)
const quoteCountCache = new Map<number, number>();

export default function RequestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const requestId = Number(id);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data: request, isLoading, isError, error, refetch } = useRequestDetails(requestId);
  const submitQuote = useSubmitQuote();
  const confirmJob = useConfirmJob();
  const closeJob = useCloseJob();
  const { showToast } = useToast();

  const [estimation, setEstimation] = useState('');
  const [explanation, setExplanation] = useState('');
  const [isEditingQuote, setIsEditingQuote] = useState(false);
  const [quoteCount, setQuoteCount] = useState(0);

  useEffect(() => {
    if (!request) return;
    const cached = quoteCountCache.get(requestId);
    if (cached !== undefined) {
      setQuoteCount(cached);
    } else if (request.driverStatus === 'QUOTED' || request.driverStatus === 'ACCEPTED') {
      quoteCountCache.set(requestId, 1);
      setQuoteCount(1);
    }
  }, [requestId, request?.driverStatus]);

  if (isLoading) return <LoadingSpinner />;
  if (isError || !request) {
    return (
      <ErrorView
        message={getApiErrorMessage(error, 'Failed to load request details')}
        onRetry={refetch}
      />
    );
  }

  const jobInfo = request.userRequest;
  const customer = request.customer;
  const currentStep = getJobStep(request.driverStatus, request.userStatus);

  const isNeverQuoted = request.driverStatus === 'PENDING';
  const isQuoted = request.driverStatus === 'QUOTED' && request.userStatus !== 'ACCEPTED';
  const isCustomerAccepted =
    request.userStatus === 'ACCEPTED' && request.driverStatus === 'QUOTED';
  const isConfirmed =
    request.driverStatus === 'ACCEPTED';
  const isCompleted = request.driverStatus === 'CLOSED';

  const canRequote =
    quoteCount < MAX_QUOTE_ATTEMPTS && !isCustomerAccepted && !isConfirmed && !isCompleted;
  const showQuoteForm = isNeverQuoted || isEditingQuote;
  const showContacts = isCustomerAccepted || isConfirmed || isCompleted;

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

    try {
      await submitQuote.mutateAsync({
        requestId,
        quote: {
          estimation: amount,
          explanation: explanation.trim(),
          driverStatus: 'QUOTED',
        },
      });
      const newCount = quoteCount + 1;
      quoteCountCache.set(requestId, newCount);
      setQuoteCount(newCount);
      setIsEditingQuote(false);
      setEstimation('');
      setExplanation('');
      showToast(
        'success',
        isEditingQuote ? 'Quote Updated' : 'Quote Submitted',
      );
    } catch (err) {
      showToast('error', 'Quote Failed', getApiErrorMessage(err, 'Failed to submit quote. Please try again.'));
    }
  };

  const handleConfirmJob = () => {
    Alert.alert(
      'Confirm Job',
      'Are you ready to start this job? The customer is waiting.',
      [
        { text: 'Not yet', style: 'cancel' },
        {
          text: 'Confirm & Start',
          style: 'default',
          onPress: async () => {
            try {
              await confirmJob.mutateAsync({
                requestId,
                existingQuote: request.estimation
                  ? {
                      estimation: parseFloat(request.estimation),
                      explanation: request.explanation ?? '',
                    }
                  : undefined,
              });
              showToast('success', 'Job Confirmed', 'You are now on the job.');
            } catch (err) {
              showToast('error', 'Confirm Failed', getApiErrorMessage(err, 'Failed to confirm job. Please try again.'));
            }
          },
        },
      ],
    );
  };

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleStartEdit = () => {
    setEstimation(request.estimation ?? '');
    setExplanation(request.explanation ?? '');
    setIsEditingQuote(true);
  };

  const handleCancelEdit = () => {
    setIsEditingQuote(false);
    setEstimation('');
    setExplanation('');
  };

  const handleCompleteJob = () => {
    Alert.alert(
      'Complete Job',
      'Are you sure you want to mark this job as completed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          style: 'default',
          onPress: async () => {
            try {
              await closeJob.mutateAsync({ requestId, markAsCompleted: true });
              showToast('success', 'Job Completed', 'Great work!');
              router.replace('/(app)/requests');
            } catch (err) {
              showToast('error', 'Complete Failed', getApiErrorMessage(err, 'Failed to complete job. Please try again.'));
            }
          },
        },
      ],
    );
  };

  const handleCloseJob = () => {
    Alert.alert(
      'Close Job',
      'Are you sure you want to close this job? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Close Job',
          style: 'destructive',
          onPress: async () => {
            try {
              await closeJob.mutateAsync({ requestId, markAsCompleted: false });
              showToast('success', 'Job Closed');
              router.replace('/(app)/requests');
            } catch (err) {
              showToast('error', 'Close Failed', getApiErrorMessage(err, 'Failed to close job. Please try again.'));
            }
          },
        },
      ],
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 32 + insets.bottom }]}>

        {/* Flow Stepper */}
        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.sectionTitle}>Job Progress</Text>
            <StatusBadge status={request.driverStatus} />
          </View>
          <JobFlowStepper currentStep={currentStep} />
        </View>

        {/* State Banners */}
        {isCustomerAccepted && (
          <View style={[styles.banner, styles.bannerAccepted]}>
            <Text style={styles.bannerEmoji}>🎉</Text>
            <View style={styles.bannerText}>
              <Text style={styles.bannerTitle}>Quote Accepted!</Text>
              <Text style={styles.bannerSubtitle}>
                Customer accepted your quote. Confirm below to start the job.
              </Text>
            </View>
          </View>
        )}
        {isConfirmed && (
          <View style={[styles.banner, styles.bannerInProgress]}>
            <Text style={styles.bannerEmoji}>🚗</Text>
            <View style={styles.bannerText}>
              <Text style={styles.bannerTitle}>Job In Progress</Text>
              <Text style={styles.bannerSubtitle}>You&apos;re on the job. Contact details below.</Text>
            </View>
          </View>
        )}
        {isCompleted && (
          <View style={[styles.banner, styles.bannerCompleted]}>
            <Text style={styles.bannerEmoji}>✅</Text>
            <View style={styles.bannerText}>
              <Text style={styles.bannerTitle}>Job Completed</Text>
              <Text style={styles.bannerSubtitle}>Great work! This job has been completed.</Text>
            </View>
          </View>
        )}

        {/* Vehicle */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vehicle</Text>
          <DetailRow label="Make" value={jobInfo?.make ?? '-'} />
          <DetailRow label="Model" value={jobInfo?.makeModel ?? '-'} />
          <DetailRow label="Reg No" value={jobInfo?.regNo ?? '-'} />
          <DetailRow
            label="Type"
            value={
              jobInfo?.requestType
                ? jobInfo.requestType.toUpperCase() === 'TOW'
                  ? 'Recovery'
                  : jobInfo.requestType
                : '-'
            }
          />
        </View>

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
          <DetailRow label="Pickup" value={jobInfo?.address ?? request.address ?? '-'} />
          <DetailRow label="Post Code" value={jobInfo?.postCode ?? '-'} />
          {(jobInfo?.toAddress || request.toAddress) && (
            <DetailRow
              label="Drop Off"
              value={jobInfo?.toAddress ?? request.toAddress ?? '-'}
            />
          )}
        </View>

        {/* Customer Contact (full, with call button — shown after acceptance) */}
        {showContacts && (
          <View style={[styles.section, styles.contactSection]}>
            <Text style={styles.sectionTitle}>Customer Contact</Text>
            <View style={styles.contactCard}>
              <View style={styles.contactInfo}>
                <Text style={styles.contactName}>
                  {[customer?.firstName, customer?.lastName].filter(Boolean).join(' ') ||
                    'Customer'}
                </Text>
                {customer?.email && (
                  <Text style={styles.contactEmail}>{customer.email}</Text>
                )}
                {customer?.mobileNumber && (
                  <Text style={styles.contactPhone}>{customer.mobileNumber}</Text>
                )}
              </View>
              {customer?.mobileNumber && (
                <TouchableOpacity
                  style={styles.callButton}
                  onPress={() => handleCall(customer.mobileNumber!)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.callButtonText}>📞 Call</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Customer (name only — shown before acceptance) */}
        {!showContacts && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Customer</Text>
            <DetailRow
              label="Name"
              value={
                [customer?.firstName, customer?.lastName].filter(Boolean).join(' ') || '-'
              }
            />
          </View>
        )}

        {/* Description */}
        {jobInfo?.description ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{jobInfo.description}</Text>
          </View>
        ) : null}

        {/* Quote Form (first time or editing) */}
        {showQuoteForm && (
          <View style={styles.section}>
            <View style={styles.row}>
              <Text style={styles.sectionTitle}>
                {isEditingQuote ? 'Update Quote' : 'Submit Quote'}
              </Text>
              {isEditingQuote && (
                <Text style={styles.attemptCounter}>
                  {quoteCount + 1} / {MAX_QUOTE_ATTEMPTS}
                </Text>
              )}
            </View>
            {isEditingQuote && (
              <Text style={styles.editHint}>
                Submitting will use attempt {quoteCount + 1} of {MAX_QUOTE_ATTEMPTS}.
              </Text>
            )}

            <Text style={styles.inputLabel}>Estimated Amount (£)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 150"
              placeholderTextColor={Colors.textMuted}
              value={estimation}
              onChangeText={setEstimation}
              keyboardType="decimal-pad"
            />
            <QuoteRangeIndicator
              distance={jobInfo?.deliveryDistance ?? null}
              make={jobInfo?.make ?? null}
              weight={jobInfo?.weight ?? null}
              currentAmount={estimation}
            />

            <Text style={styles.inputLabel}>Explanation</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe your quote..."
              placeholderTextColor={Colors.textMuted}
              value={explanation}
              onChangeText={setExplanation}
              multiline
              numberOfLines={3}
            />

            <View style={styles.formActions}>
              {isEditingQuote && (
                <TouchableOpacity style={styles.cancelButton} onPress={handleCancelEdit}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  isEditingQuote && styles.submitButtonFlex,
                  submitQuote.isPending && styles.buttonDisabled,
                ]}
                onPress={handleSubmitQuote}
                disabled={submitQuote.isPending}
              >
                {submitQuote.isPending ? (
                  <ActivityIndicator color={Colors.text} />
                ) : (
                  <Text style={styles.submitText}>
                    {isEditingQuote ? 'Update Quote' : 'Submit Quote'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Current Quote Display + Requote Option */}
        {isQuoted && !showQuoteForm && (
          <View style={styles.section}>
            <View style={styles.row}>
              <Text style={styles.sectionTitle}>Your Quote</Text>
              <Text style={styles.attemptCounter}>
                {quoteCount} / {MAX_QUOTE_ATTEMPTS}
              </Text>
            </View>
            <DetailRow
              label="Amount"
              value={request.estimation ? `£${request.estimation}` : '-'}
            />
            <QuoteRangeIndicator
              distance={jobInfo?.deliveryDistance ?? null}
              make={jobInfo?.make ?? null}
              weight={jobInfo?.weight ?? null}
              currentAmount={request.estimation ?? ''}
            />
            <DetailRow label="Explanation" value={request.explanation ?? '-'} />

            {canRequote ? (
              <TouchableOpacity style={styles.requoteButton} onPress={handleStartEdit}>
                <Text style={styles.requoteText}>Update Quote</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.limitReachedBox}>
                <Text style={styles.limitReachedText}>
                  Quote limit reached ({MAX_QUOTE_ATTEMPTS}/{MAX_QUOTE_ATTEMPTS} used)
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Confirm Job Button */}
        {isCustomerAccepted && (
          <TouchableOpacity
            style={[styles.confirmButton, confirmJob.isPending && styles.buttonDisabled]}
            onPress={handleConfirmJob}
            disabled={confirmJob.isPending}
            activeOpacity={0.85}
          >
            {confirmJob.isPending ? (
              <ActivityIndicator color={Colors.text} size="large" />
            ) : (
              <>
                <Text style={styles.confirmButtonText}>Confirm & Start Job</Text>
                <Text style={styles.confirmButtonSub}>Tap to confirm you are on your way</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* Complete Job Button */}
        {isConfirmed && (
          <TouchableOpacity
            style={[styles.completeButton, closeJob.isPending && styles.buttonDisabled]}
            onPress={handleCompleteJob}
            disabled={closeJob.isPending}
            activeOpacity={0.85}
          >
            {closeJob.isPending ? (
              <ActivityIndicator color={Colors.text} size="large" />
            ) : (
              <>
                <Text style={styles.completeButtonText}>Complete Job</Text>
                <Text style={styles.completeButtonSub}>Mark this job as finished</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* Close / Dismiss Job — available in any non-completed state */}
        {!isCompleted && (
          <TouchableOpacity
            style={[styles.closeJobButton, closeJob.isPending && styles.buttonDisabled]}
            onPress={handleCloseJob}
            disabled={closeJob.isPending}
            activeOpacity={0.85}
          >
            {closeJob.isPending ? (
              <ActivityIndicator color={Colors.error} />
            ) : (
              <Text style={styles.closeJobText}>Close Job</Text>
            )}
          </TouchableOpacity>
        )}

        {/* Agreed Quote shown after acceptance / in-progress / completed */}
        {(isCustomerAccepted || isConfirmed || isCompleted) && request.estimation && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Agreed Quote</Text>
            <DetailRow
              label="Amount"
              value={request.estimation ? `£${request.estimation}` : '-'}
            />
            <DetailRow label="Explanation" value={request.explanation ?? '-'} />
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
  contactSection: {
    borderWidth: 1,
    borderColor: Colors.statusAccepted + '44',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
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
  description: {
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },

  // Banners
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    gap: 12,
  },
  bannerAccepted: {
    backgroundColor: Colors.statusAccepted + '22',
    borderWidth: 1,
    borderColor: Colors.statusAccepted + '66',
  },
  bannerInProgress: {
    backgroundColor: Colors.info + '22',
    borderWidth: 1,
    borderColor: Colors.info + '66',
  },
  bannerCompleted: {
    backgroundColor: Colors.statusCompleted + '22',
    borderWidth: 1,
    borderColor: Colors.statusCompleted + '66',
  },
  bannerEmoji: {
    fontSize: 28,
  },
  bannerText: {
    flex: 1,
  },
  bannerTitle: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  bannerSubtitle: {
    color: Colors.textSecondary,
    fontSize: 13,
  },

  // Contact card
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceLight,
    borderRadius: 10,
    padding: 12,
    marginBottom: 4,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  contactEmail: {
    color: Colors.textSecondary,
    fontSize: 13,
    marginBottom: 2,
  },
  contactPhone: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  callButton: {
    backgroundColor: Colors.statusAccepted,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginLeft: 12,
  },
  callButtonText: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '700',
  },

  // Quote form
  inputLabel: {
    color: Colors.textSecondary,
    fontSize: 13,
    marginBottom: 4,
    marginTop: 10,
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
  formActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelText: {
    color: Colors.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
  submitButton: {
    flex: 2,
    backgroundColor: Colors.statusAccepted,
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
  },
  submitButtonFlex: {
    flex: 2,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  submitText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  attemptCounter: {
    color: Colors.textMuted,
    fontSize: 12,
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  editHint: {
    color: Colors.warning,
    fontSize: 12,
    marginBottom: 4,
    marginTop: -4,
  },

  // Requote
  requoteButton: {
    backgroundColor: Colors.info + '22',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: Colors.info + '55',
  },
  requoteText: {
    color: Colors.info,
    fontSize: 14,
    fontWeight: '700',
  },
  limitReachedBox: {
    backgroundColor: Colors.textMuted + '22',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  limitReachedText: {
    color: Colors.textMuted,
    fontSize: 13,
  },

  // Confirm job
  confirmButton: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: Colors.primary,
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 8,
  },
  confirmButtonText: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  confirmButtonSub: {
    color: Colors.text + 'bb',
    fontSize: 12,
    marginTop: 4,
  },

  // Complete job
  completeButton: {
    backgroundColor: Colors.statusCompleted,
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: Colors.statusCompleted,
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 8,
  },
  completeButtonText: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  completeButtonSub: {
    color: Colors.text + 'bb',
    fontSize: 12,
    marginTop: 4,
  },

  // Close / dismiss job
  closeJobButton: {
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.error + '55',
    backgroundColor: Colors.error + '15',
  },
  closeJobText: {
    color: Colors.error,
    fontSize: 15,
    fontWeight: '600',
  },
});
