import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';

const statusColors: Record<string, string> = {
  PENDING: Colors.statusPending,
  ASSIGNED: Colors.statusPending,
  PREQUOTED: Colors.statusPending,
  QUOTED: Colors.statusQuoted,
  ACCEPTED: Colors.statusAccepted,
  REJECTED: Colors.statusRejected,
  CLOSED: Colors.statusCompleted,
};

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const color = statusColors[status] ?? Colors.textMuted;
  const label = status.replace(/_/g, ' ');

  return (
    <View style={[styles.badge, { backgroundColor: color + '20' }]}>
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});
