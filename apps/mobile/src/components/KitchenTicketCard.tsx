import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { theme } from '../theme';

export interface KotTicketItem {
  id: string;
  orderNumber: string;
  tableName?: string;
  orderType: string;
  status: 'NEW' | 'ACCEPTED' | 'PREPARING' | 'READY' | 'COMPLETED';
  isPriority?: boolean;
  notes?: string;
  createdAt: string;
  items: {
    id: string;
    name: string;
    quantity: number;
    notes?: string;
    modifiers?: string[];
  }[];
}

interface KitchenTicketCardProps {
  ticket: KotTicketItem;
  onUpdateStatus: (id: string, newStatus: string) => void;
  onTogglePriority: (id: string, currentPriority: boolean) => void;
}

export function KitchenTicketCard({
  ticket,
  onUpdateStatus,
  onTogglePriority,
}: KitchenTicketCardProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    const createdTime = new Date(ticket.createdAt).getTime();
    const calculateElapsed = () => {
      const now = Date.now();
      setElapsedSeconds(Math.max(0, Math.floor((now - createdTime) / 1000)));
    };

    calculateElapsed();
    const interval = setInterval(calculateElapsed, 1000);
    return () => clearInterval(interval);
  }, [ticket.createdAt]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isDelayed = elapsedSeconds > 900; // >15 mins

  const renderStatusButton = () => {
    switch (ticket.status) {
      case 'NEW':
        return (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: theme.colors.primary }]}
            onPress={() => onUpdateStatus(ticket.id, 'ACCEPTED')}
            activeOpacity={0.8}
          >
            <Text style={styles.actionBtnText}>[ ACCEPT KOT ]</Text>
          </TouchableOpacity>
        );
      case 'ACCEPTED':
        return (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: theme.colors.warning }]}
            onPress={() => onUpdateStatus(ticket.id, 'PREPARING')}
            activeOpacity={0.8}
          >
            <Text style={styles.actionBtnText}>[ PREPARING ]</Text>
          </TouchableOpacity>
        );
      case 'PREPARING':
        return (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: theme.colors.success }]}
            onPress={() => onUpdateStatus(ticket.id, 'READY')}
            activeOpacity={0.8}
          >
            <Text style={styles.actionBtnText}>[ MARK READY ]</Text>
          </TouchableOpacity>
        );
      case 'READY':
        return (
          <View style={styles.completedBadge}>
            <Text style={styles.completedBadgeText}>✓ FOOD READY FOR WAITER</Text>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View
      style={[
        styles.card,
        ticket.isPriority && styles.cardPriority,
        isDelayed && styles.cardDelayed,
      ]}
    >
      {/* Ticket Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.orderNumber}>#{ticket.orderNumber}</Text>
          {ticket.tableName ? (
            <View style={styles.tableBadge}>
              <Text style={styles.tableBadgeText}>Table {ticket.tableName}</Text>
            </View>
          ) : (
            <View style={styles.takeawayBadge}>
              <Text style={styles.takeawayText}>Takeaway</Text>
            </View>
          )}
        </View>

        <View style={styles.headerRightRow}>
          {/* Priority Toggle Chip */}
          <TouchableOpacity
            style={[styles.priorityChip, ticket.isPriority && styles.priorityChipActive]}
            onPress={() => onTogglePriority(ticket.id, !!ticket.isPriority)}
          >
            <Text style={[styles.priorityChipText, ticket.isPriority && styles.priorityChipTextActive]}>
              {ticket.isPriority ? '🔥 RUSH' : 'NORMAL'}
            </Text>
          </TouchableOpacity>

          {/* Timer Badge */}
          <View style={[styles.timerBadge, isDelayed && styles.timerBadgeDelayed]}>
            <Text style={[styles.timerText, isDelayed && styles.timerTextDelayed]}>
              ⏱️ {formatTimer(elapsedSeconds)}
            </Text>
          </View>
        </View>
      </View>

      {/* General KOT Note */}
      {ticket.notes ? (
        <View style={styles.kotNoteBox}>
          <Text style={styles.kotNoteText}>⚠️ NOTE: &quot;{ticket.notes}&quot;</Text>
        </View>
      ) : null}

      {/* Items List */}
      <View style={styles.itemList}>
        {ticket.items.map((item) => (
          <View key={item.id} style={styles.itemRow}>
            <View style={styles.qtyBadge}>
              <Text style={styles.qtyText}>{item.quantity}×</Text>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.itemName}>{item.name}</Text>
              {item.modifiers && item.modifiers.length > 0 ? (
                <Text style={styles.modifierText}>+ {item.modifiers.join(', ')}</Text>
              ) : null}
              {item.notes ? <Text style={styles.itemNoteText}>Note: &quot;{item.notes}&quot;</Text> : null}
            </View>
          </View>
        ))}
      </View>

      {/* Action Footer */}
      <View style={styles.footer}>{renderStatusButton()}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1.5,
    borderColor: theme.colors.surfaceBorder,
  },
  cardPriority: {
    borderColor: theme.colors.secondary,
  },
  cardDelayed: {
    borderColor: theme.colors.danger,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceBorder,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  orderNumber: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  tableBadge: {
    backgroundColor: theme.colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radius.sm,
  },
  tableBadgeText: {
    color: theme.colors.primaryDark,
    fontSize: 12,
    fontWeight: '800',
  },
  takeawayBadge: {
    backgroundColor: theme.colors.surfaceSubtle,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radius.sm,
  },
  takeawayText: {
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  headerRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  priorityChip: {
    backgroundColor: theme.colors.surfaceSubtle,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
  },
  priorityChipActive: {
    backgroundColor: theme.colors.secondary,
    borderColor: theme.colors.secondary,
  },
  priorityChipText: {
    color: theme.colors.textDim,
    fontSize: 10,
    fontWeight: '800',
  },
  priorityChipTextActive: {
    color: '#ffffff',
  },
  timerBadge: {
    backgroundColor: theme.colors.surfaceSubtle,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.radius.sm,
  },
  timerBadgeDelayed: {
    backgroundColor: theme.colors.danger,
  },
  timerText: {
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: '800',
  },
  timerTextDelayed: {
    color: '#ffffff',
  },
  kotNoteBox: {
    backgroundColor: '#451a03',
    borderRadius: theme.radius.md,
    padding: theme.spacing.sm,
    marginTop: theme.spacing.sm,
    borderWidth: 1,
    borderColor: '#7c2d12',
  },
  kotNoteText: {
    color: '#ffedd5',
    fontSize: 12,
    fontWeight: '700',
  },
  itemList: {
    marginVertical: theme.spacing.md,
    gap: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  qtyBadge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.radius.md,
  },
  qtyText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  itemName: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  modifierText: {
    color: theme.colors.primary,
    fontSize: 11,
    marginTop: 2,
  },
  itemNoteText: {
    color: theme.colors.warning,
    fontSize: 11,
    fontStyle: 'italic',
    marginTop: 2,
  },
  footer: {
    marginTop: theme.spacing.xs,
  },
  actionBtn: {
    borderRadius: theme.radius.lg,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  completedBadge: {
    backgroundColor: theme.colors.surfaceSubtle,
    paddingVertical: 10,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.success,
  },
  completedBadgeText: {
    color: theme.colors.success,
    fontSize: 13,
    fontWeight: '800',
  },
});
