import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { theme } from '../theme';

export interface MobileTable {
  id: string;
  number: number;
  name: string | null;
  capacity: number;
  shape: string;
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'CLEANING' | 'OUT_OF_SERVICE';
  statusSince?: string | null;
}

export function TableCard({
  table,
  onStartOrder,
  onAddRound,
  onBillTable,
}: {
  table: MobileTable;
  onStartOrder: () => void;
  onAddRound: () => void;
  onBillTable: () => void;
}) {
  const isOccupied = table.status === 'OCCUPIED';
  const isAvailable = table.status === 'AVAILABLE';
  const isReserved = table.status === 'RESERVED';
  const isCleaning = table.status === 'CLEANING';

  const statusColor = isOccupied
    ? theme.colors.danger
    : isAvailable
      ? theme.colors.success
      : isReserved
        ? theme.colors.warning
        : theme.colors.info;

  const statusLabel = isOccupied
    ? 'Occupied'
    : isAvailable
      ? 'Available'
      : isReserved
        ? 'Reserved'
        : 'Cleaning';

  return (
    <View style={[styles.card, { borderColor: statusColor + '50' }]}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={styles.tableName}>
            {table.name ?? `Table ${table.number}`}
          </Text>
        </View>

        <View
          style={[
            styles.statusBadge,
            { backgroundColor: statusColor + '20', borderColor: statusColor + '40' },
          ]}
        >
          <Text style={[styles.statusBadgeText, { color: statusColor }]}>
            {statusLabel}
          </Text>
        </View>
      </View>

      {/* Meta Row: Capacity & Shape */}
      <View style={styles.metaRow}>
        <Text style={styles.metaText}>{table.capacity} Guests</Text>
        <Text style={styles.metaDot}>•</Text>
        <Text style={styles.metaText}>{table.shape}</Text>
      </View>

      {/* Status Bar */}
      <View style={styles.stateBar}>
        {isOccupied ? (
          <Text style={styles.stateBarTextActive}>Active Dining Session</Text>
        ) : isAvailable ? (
          <Text style={styles.stateBarTextReady}>Ready to seat guests</Text>
        ) : (
          <Text style={styles.stateBarTextMuted}>{statusLabel} status</Text>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsRow}>
        {isAvailable && (
          <TouchableOpacity
            style={styles.btnPrimary}
            onPress={onStartOrder}
            activeOpacity={0.8}
          >
            <Text style={styles.btnPrimaryText}>+ Start Order</Text>
          </TouchableOpacity>
        )}

        {isOccupied && (
          <View style={styles.splitBtnRow}>
            <TouchableOpacity
              style={styles.btnOutline}
              onPress={onAddRound}
              activeOpacity={0.8}
            >
              <Text style={styles.btnOutlineText}>+ Add Round</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.btnDanger}
              onPress={onBillTable}
              activeOpacity={0.8}
            >
              <Text style={styles.btnDangerText}>Bill Table</Text>
            </TouchableOpacity>
          </View>
        )}

        {!isAvailable && !isOccupied && (
          <TouchableOpacity
            style={styles.btnSecondary}
            onPress={onStartOrder}
            activeOpacity={0.8}
          >
            <Text style={styles.btnSecondaryText}>Seat & Order</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    borderWidth: 1.5,
    marginBottom: theme.spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  tableName: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: theme.spacing.sm,
  },
  metaText: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  metaDot: {
    color: theme.colors.textDim,
    fontSize: 12,
  },
  stateBar: {
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: theme.radius.sm,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginBottom: theme.spacing.md,
  },
  stateBarTextActive: {
    color: '#f87171',
    fontSize: 11,
    fontWeight: '700',
  },
  stateBarTextReady: {
    color: '#34d399',
    fontSize: 11,
    fontWeight: '700',
  },
  stateBarTextMuted: {
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: '500',
  },
  actionsRow: {
    borderTopWidth: 1,
    borderTopColor: '#37415140',
    paddingTop: theme.spacing.sm,
  },
  btnPrimary: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimaryText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  splitBtnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  btnOutline: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: theme.radius.md,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnOutlineText: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
  btnDanger: {
    flex: 1,
    backgroundColor: theme.colors.danger,
    borderRadius: theme.radius.md,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDangerText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  btnSecondary: {
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: theme.radius.md,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSecondaryText: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
});
