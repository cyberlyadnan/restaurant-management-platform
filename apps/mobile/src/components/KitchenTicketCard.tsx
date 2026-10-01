import { AlertTriangle, Check, Clock, Flame } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAppTheme } from '../context/ThemeContext';
import { Button } from './common/Button';

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
  const { theme, isDark } = useAppTheme();
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
          <Button
            variant="primary"
            size="md"
            fullWidth
            onPress={() => onUpdateStatus(ticket.id, 'ACCEPTED')}
          >
            ACCEPT KOT
          </Button>
        );
      case 'ACCEPTED':
        return (
          <Button
            variant="secondary"
            size="md"
            fullWidth
            onPress={() => onUpdateStatus(ticket.id, 'PREPARING')}
          >
            START PREPARING
          </Button>
        );
      case 'PREPARING':
        return (
          <Button
            variant="primary"
            size="md"
            fullWidth
            style={{ backgroundColor: theme.colors.success }}
            onPress={() => onUpdateStatus(ticket.id, 'READY')}
          >
            MARK READY
          </Button>
        );
      case 'READY':
        return (
          <View
            style={[
              styles.completedBadge,
              {
                backgroundColor: theme.colors.successLight,
                borderColor: theme.colors.success,
              },
            ]}
          >
            <Check size={16} color={theme.colors.success} />
            <Text style={[styles.completedBadgeText, { color: theme.colors.success }]}>
              FOOD READY FOR WAITER
            </Text>
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
        {
          backgroundColor: theme.colors.surface,
          borderColor: ticket.isPriority
            ? theme.colors.secondary
            : isDelayed
            ? theme.colors.danger
            : theme.colors.surfaceBorder,
        },
      ]}
    >
      {/* Ticket Header */}
      <View style={[styles.header, { borderColor: theme.colors.surfaceBorder }]}>
        <View style={styles.headerTitleRow}>
          <Text style={[styles.orderNumber, { color: theme.colors.textPrimary }]}>
            #{ticket.orderNumber}
          </Text>
          {ticket.tableName ? (
            <View style={[styles.tableBadge, { backgroundColor: theme.colors.primaryLight }]}>
              <Text style={[styles.tableBadgeText, { color: theme.colors.primaryDark }]}>
                Table {ticket.tableName}
              </Text>
            </View>
          ) : (
            <View style={[styles.takeawayBadge, { backgroundColor: theme.colors.surfaceSubtle }]}>
              <Text style={[styles.takeawayText, { color: theme.colors.textMuted }]}>
                Takeaway
              </Text>
            </View>
          )}
        </View>

        <View style={styles.headerRightRow}>
          {/* Priority Toggle Chip */}
          <TouchableOpacity
            style={[
              styles.priorityChip,
              {
                backgroundColor: ticket.isPriority
                  ? theme.colors.secondary
                  : theme.colors.surfaceSubtle,
                borderColor: ticket.isPriority
                  ? theme.colors.secondary
                  : theme.colors.surfaceBorder,
              },
            ]}
            onPress={() => onTogglePriority(ticket.id, !!ticket.isPriority)}
            activeOpacity={0.7}
          >
            {ticket.isPriority ? <Flame size={12} color="#ffffff" /> : null}
            <Text
              style={[
                styles.priorityChipText,
                { color: ticket.isPriority ? '#ffffff' : theme.colors.textMuted },
              ]}
            >
              {ticket.isPriority ? 'RUSH' : 'NORMAL'}
            </Text>
          </TouchableOpacity>

          {/* Timer Badge */}
          <View
            style={[
              styles.timerBadge,
              {
                backgroundColor: isDelayed ? theme.colors.danger : theme.colors.surfaceSubtle,
              },
            ]}
          >
            <Clock size={12} color={isDelayed ? '#ffffff' : theme.colors.textMuted} />
            <Text
              style={[
                styles.timerText,
                { color: isDelayed ? '#ffffff' : theme.colors.textMuted },
              ]}
            >
              {formatTimer(elapsedSeconds)}
            </Text>
          </View>
        </View>
      </View>

      {/* General KOT Note */}
      {ticket.notes ? (
        <View
          style={[
            styles.kotNoteBox,
            {
              backgroundColor: isDark ? '#451a03' : '#ffedd5',
              borderColor: isDark ? '#7c2d12' : '#fed7aa',
            },
          ]}
        >
          <AlertTriangle size={14} color={theme.colors.secondary} />
          <Text style={[styles.kotNoteText, { color: isDark ? '#ffedd5' : '#7c2d12' }]}>
            NOTE: &quot;{ticket.notes}&quot;
          </Text>
        </View>
      ) : null}

      {/* Items List */}
      <View style={styles.itemList}>
        {ticket.items.map((item) => (
          <View key={item.id} style={styles.itemRow}>
            <View style={[styles.qtyBadge, { backgroundColor: theme.colors.primary }]}>
              <Text style={styles.qtyText}>{item.quantity}×</Text>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={[styles.itemName, { color: theme.colors.textPrimary }]}>
                {item.name}
              </Text>
              {item.modifiers && item.modifiers.length > 0 ? (
                <Text style={[styles.modifierText, { color: theme.colors.primary }]}>
                  + {item.modifiers.join(', ')}
                </Text>
              ) : null}
              {item.notes ? (
                <Text style={[styles.itemNoteText, { color: theme.colors.warning }]}>
                  Note: &quot;{item.notes}&quot;
                </Text>
              ) : null}
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
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1.5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: '800',
  },
  tableBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tableBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  takeawayBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  takeawayText: {
    fontSize: 11,
    fontWeight: '700',
  },
  headerRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  priorityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  priorityChipText: {
    fontSize: 10,
    fontWeight: '800',
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  timerText: {
    fontSize: 11,
    fontWeight: '800',
  },
  kotNoteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    borderWidth: 1,
  },
  kotNoteText: {
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  itemList: {
    marginVertical: 12,
    gap: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  qtyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  qtyText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  itemName: {
    fontSize: 15,
    fontWeight: '700',
  },
  modifierText: {
    fontSize: 11,
    marginTop: 2,
  },
  itemNoteText: {
    fontSize: 11,
    fontStyle: 'italic',
    marginTop: 2,
  },
  footer: {
    marginTop: 4,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  completedBadgeText: {
    fontSize: 13,
    fontWeight: '800',
  },
});
