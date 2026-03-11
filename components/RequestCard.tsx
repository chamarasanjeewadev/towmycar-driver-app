import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';
import { StatusBadge } from './StatusBadge';
import type { AssignedRequest } from '@/lib/types/api';

interface RequestCardProps {
  item: AssignedRequest;
  onPress: () => void;
}

export function RequestCard({ item, onPress }: RequestCardProps) {
  const vehicle = [item.make, item.makeModel].filter(Boolean).join(' ') || 'Unknown Vehicle';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <Text style={styles.vehicle} numberOfLines={1}>
          {vehicle}
        </Text>
        <StatusBadge status={item.driverStatus} />
      </View>

      {item.regNo && <Text style={styles.reg}>{item.regNo}</Text>}

      {item.address && (
        <Text style={styles.location} numberOfLines={1}>
          📍 {item.address}{item.postCode ? `, ${item.postCode}` : ''}
        </Text>
      )}

      <View style={styles.footer}>
        <Text style={styles.type}>{item.requestType ?? 'Tow'}</Text>
        <Text style={styles.date}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  vehicle: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  reg: {
    color: Colors.textSecondary,
    fontSize: 13,
    marginBottom: 6,
  },
  location: {
    color: Colors.textSecondary,
    fontSize: 13,
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  type: {
    color: Colors.textMuted,
    fontSize: 12,
    textTransform: 'uppercase',
  },
  date: {
    color: Colors.textMuted,
    fontSize: 12,
  },
});
