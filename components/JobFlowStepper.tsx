import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';

export type JobStep = 'ASSIGNED' | 'QUOTED' | 'ACCEPTED' | 'CONFIRMED' | 'COMPLETED';

export const STEP_ORDER: Record<JobStep, number> = {
  ASSIGNED: 0,
  QUOTED: 1,
  ACCEPTED: 2,
  CONFIRMED: 3,
  COMPLETED: 4,
};

const STEPS: { key: JobStep; label: string }[] = [
  { key: 'ASSIGNED', label: 'Assigned' },
  { key: 'QUOTED', label: 'Quoted' },
  { key: 'ACCEPTED', label: 'Accepted' },
  { key: 'CONFIRMED', label: 'Confirmed' },
  { key: 'COMPLETED', label: 'Done' },
];

export function getJobStep(driverStatus: string, userStatus: string | null): JobStep {
  if (driverStatus === 'CLOSED') return 'COMPLETED';
  if (driverStatus === 'ACCEPTED') return 'CONFIRMED';
  if (userStatus === 'ACCEPTED') return 'ACCEPTED';
  if (driverStatus === 'QUOTED') return 'QUOTED';
  return 'ASSIGNED';
}

const DOT_SIZE = 28;

export function JobFlowStepper({ currentStep }: { currentStep: JobStep }) {
  const currentIndex = STEP_ORDER[currentStep];

  return (
    <View style={styles.container}>
      {/* Dots + lines row */}
      <View style={styles.dotsRow}>
        {STEPS.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isLast = index === STEPS.length - 1;

          return (
            <React.Fragment key={step.key}>
              <View
                style={[
                  styles.dot,
                  isCompleted && styles.dotCompleted,
                  isCurrent && styles.dotCurrent,
                ]}
              >
                <Text style={[styles.dotText, (isCompleted || isCurrent) && styles.dotTextActive]}>
                  {isCompleted ? '✓' : String(index + 1)}
                </Text>
              </View>
              {!isLast && (
                <View style={[styles.line, isCompleted && styles.lineCompleted]} />
              )}
            </React.Fragment>
          );
        })}
      </View>

      {/* Labels row */}
      <View style={styles.labelsRow}>
        {STEPS.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isLast = index === STEPS.length - 1;

          return (
            <React.Fragment key={`lbl-${step.key}`}>
              <View style={styles.labelWrapper}>
                <Text
                  style={[
                    styles.label,
                    isCompleted && styles.labelCompleted,
                    isCurrent && styles.labelCurrent,
                  ]}
                >
                  {step.label}
                </Text>
              </View>
              {!isLast && <View style={styles.lineSpacer} />}
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  labelsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 6,
  },
  labelWrapper: {
    width: DOT_SIZE + 24,
    alignItems: 'center',
    marginHorizontal: -12,
  },
  lineSpacer: {
    flex: 1,
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    backgroundColor: Colors.surfaceLight,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotCurrent: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  dotCompleted: {
    backgroundColor: Colors.statusAccepted,
    borderColor: Colors.statusAccepted,
  },
  dotText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  dotTextActive: {
    color: Colors.text,
  },
  line: {
    flex: 1,
    height: 2,
    backgroundColor: Colors.border,
  },
  lineCompleted: {
    backgroundColor: Colors.statusAccepted,
  },
  label: {
    fontSize: 10,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
  labelCurrent: {
    color: Colors.primary,
    fontWeight: '700',
  },
  labelCompleted: {
    color: Colors.statusAccepted,
    fontWeight: '600',
  },
});
