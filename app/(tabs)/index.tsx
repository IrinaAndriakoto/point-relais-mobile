import { StyleSheet } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Link } from 'expo-router';

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <ThemedView style={styles.header}>
        <ThemedView>
          <ThemedText type="title" style={styles.greeting}>
            Point Relais
          </ThemedText>
          <ThemedText style={styles.subGreeting}>
            Découvrez nos services
          </ThemedText>
        </ThemedView>
        <IconSymbol
          size={40}
          name="person.fill"
          color={colors.tint}
        />
      </ThemedView>

      {/* Quick Actions */}
      <ThemedView style={styles.actionsContainer}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Actions rapides
        </ThemedText>
        <ThemedView style={styles.actions}>
          <Link href="/scanqr">
            <ThemedView style={[styles.actionCard, { backgroundColor: colors.tint + '15' }]}>
              <IconSymbol size={32} name="qrcode" color={colors.tint} />
              <ThemedText type="defaultSemiBold" style={styles.actionLabel}>
                Scanner un colis
              </ThemedText>
            </ThemedView>
          </Link>
          <Link href="/historique">
            <ThemedView style={[styles.actionCard, { backgroundColor: colors.tint + '15' }]}>
              <IconSymbol size={32} name="clock" color={colors.tint} />
              <ThemedText type="defaultSemiBold" style={styles.actionLabel}>
                Historique
              </ThemedText>
            </ThemedView>
          </Link>
        </ThemedView>
      </ThemedView>

      {/* Info Section */}
      <ThemedView style={styles.infoContainer}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          À venir
        </ThemedText>
        <ThemedView style={[styles.infoCard, { borderColor: colors.tint + '30' }]}>
          <IconSymbol size={24} name="shippingbox.fill" color={colors.tint} />
          <ThemedView style={styles.infoText}>
            <ThemedText type="defaultSemiBold">Suivi des colis</ThemedText>
            <ThemedText style={styles.infoDescription}>
              Visualisez tous vos colis en cours de livraison
            </ThemedText>
          </ThemedView>
        </ThemedView>
        <ThemedView style={[styles.infoCard, { borderColor: colors.tint + '30' }]}>
          <IconSymbol size={24} name="bell.fill" color={colors.tint} />
          <ThemedView style={styles.infoText}>
            <ThemedText type="defaultSemiBold">Notifications</ThemedText>
            <ThemedText style={styles.infoDescription}>
              Recevez des alertes quand un colis arrive
            </ThemedText>
          </ThemedView>
        </ThemedView>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  greeting: {
    marginBottom: 4,
  },
  subGreeting: {
    fontSize: 16,
    opacity: 0.7,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  actionsContainer: {
    marginBottom: 32,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    gap: 12,
  },
  actionLabel: {
    textAlign: 'center',
    fontSize: 14,
  },
  infoContainer: {
    gap: 12,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  infoText: {
    flex: 1,
    gap: 4,
  },
  infoDescription: {
    fontSize: 14,
    opacity: 0.7,
  },
});
