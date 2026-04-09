import { View, Text, TouchableOpacity, StyleSheet, Linking, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { StatusBadge } from './StatusBadge';
import type { AssignedRequest } from '@/lib/types/api';

interface RequestCardProps {
  item: AssignedRequest;
  onPress: () => void;
}

const UK_POSTCODE_RE = /[A-Z]{1,2}[0-9][0-9A-Z]?\s*[0-9][A-Z]{2}/i;

function extractPostcode(postCode: string | null, address: string | null): string | null {
  if (postCode) return postCode.toUpperCase().trim();
  if (address) {
    const match = address.match(UK_POSTCODE_RE);
    return match ? match[0].toUpperCase().trim() : null;
  }
  return null;
}

function openDirections(from: string | null, to: string | null) {
  const origin = from ?? '';
  const destination = to ?? '';
  if (!origin && !destination) return;

  const query = [origin, destination].filter(Boolean).join(' to ');
  const url =
    Platform.OS === 'ios'
      ? `maps://?saddr=${encodeURIComponent(origin)}&daddr=${encodeURIComponent(destination)}`
      : `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`;

  Linking.canOpenURL(url).then((supported) => {
    if (supported) {
      Linking.openURL(url);
    } else {
      const fallback = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`;
      Linking.openURL(fallback);
    }
  });
}

function normalizeType(type: string | null): string {
  if (!type) return 'RECOVERY';
  return type.toUpperCase() === 'TOW' ? 'RECOVERY' : type.toUpperCase();
}

export function RequestCard({ item, onPress }: RequestCardProps) {
  const fromPostcode = extractPostcode(item.postCode, item.address);
  const toPostcode = extractPostcode(item.toPostCode, item.toAddress);
  const make = item.make || item.makeModel || '';
  const reg = item.regNo ?? '';

  const canOpenDirections = !!(fromPostcode || toPostcode);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <StatusBadge status={item.driverStatus} />
      </View>

      <View style={styles.routeRow}>
        <View style={styles.postcodeBlock}>
          <Text style={styles.postcodeLabel}>FROM</Text>
          <Text style={styles.postcodeValue}>{fromPostcode ?? '—'}</Text>
        </View>

        <View style={styles.arrowContainer}>
          <View style={styles.arrowLine} />
          <Text style={styles.arrowHead}>›</Text>
        </View>

        <View style={styles.postcodeBlock}>
          <Text style={styles.postcodeLabel}>TO</Text>
          <Text style={[styles.postcodeValue, styles.postcodeValueTo]}>{toPostcode ?? '—'}</Text>
        </View>

        {canOpenDirections && (
          <TouchableOpacity
            style={styles.mapIcon}
            onPress={() => openDirections(fromPostcode, toPostcode)}
            activeOpacity={0.6}
          >
            <Ionicons name="map-outline" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {(make || reg) && (
        <View style={styles.vehicleRow}>
          {make ? <Text style={styles.vehicleMake}>{make}</Text> : null}
          {reg ? (
            <View style={styles.regBadge}>
              <Text style={styles.regText}>{reg}</Text>
            </View>
          ) : null}
        </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.type}>{normalizeType(item.requestType)}</Text>
        <Text style={styles.date}>
          {new Date(item.createdAt).toLocaleDateString('en-GB')}
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
    marginBottom: 12,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  postcodeBlock: {
    alignItems: 'center',
    flex: 1,
  },
  postcodeLabel: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 4,
  },
  postcodeValue: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  postcodeValueTo: {
    color: Colors.success,
  },
  arrowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  arrowLine: {
    width: 20,
    height: 2,
    backgroundColor: Colors.textMuted,
    opacity: 0.5,
  },
  arrowHead: {
    color: Colors.textMuted,
    fontSize: 20,
    lineHeight: 22,
    marginLeft: -2,
  },
  mapIcon: {
    marginLeft: 8,
    padding: 4,
  },
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  vehicleMake: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  regBadge: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  regText: {
    color: Colors.accent,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
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
    letterSpacing: 0.5,
  },
  date: {
    color: Colors.textMuted,
    fontSize: 12,
  },
});
