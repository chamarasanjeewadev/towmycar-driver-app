import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';
import {
  calculateQuoteRange,
  getQuotePosition,
  type QuotePosition,
} from '@/lib/utils/quote-range';

interface Props {
  distance: number | null;
  make: string | null;
  weight: number | null;
  currentAmount: string;
}

const positionColors: Record<QuotePosition, string> = {
  low: Colors.info,
  'in-range': Colors.success,
  high: Colors.warning,
};

const positionLabels: Record<QuotePosition, string> = {
  low: 'Below average',
  'in-range': 'Market range',
  high: 'Above average',
};

export function QuoteRangeIndicator({
  distance,
  make,
  weight,
  currentAmount,
}: Props) {
  const range = calculateQuoteRange(distance, make, weight);

  if (!range) return null;

  const amount = parseFloat(currentAmount);
  const hasAmount = !isNaN(amount) && amount > 0;
  const position = hasAmount ? getQuotePosition(amount, range) : null;
  const color = position ? positionColors[position] : Colors.textMuted;

  return (
    <View style={styles.container}>
      <View style={styles.rangeRow}>
        <Text style={styles.suggestedLabel}>Suggested: </Text>
        <Text style={styles.rangeText}>
          £{range.low} - £{range.high}
        </Text>
      </View>
      {position && (
        <View
          style={[
            styles.positionBadge,
            { backgroundColor: color + '22', borderColor: color + '55' },
          ]}
        >
          <View style={[styles.dot, { backgroundColor: color }]} />
          <Text style={[styles.positionText, { color }]}>
            {positionLabels[position]}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 6,
    marginBottom: 4,
  },
  rangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  suggestedLabel: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  rangeText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  positionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    marginTop: 4,
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  positionText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
