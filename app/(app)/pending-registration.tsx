import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Linking,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@clerk/expo';
import { Colors } from '@/constants/colors';

const WEB_PANEL_URL = 'https://towmycar.uk/driver/sign-in';

export default function PendingRegistrationScreen() {
  const router = useRouter();
  const { signOut } = useAuth();

  const handleOpenWebPanel = () => {
    Linking.openURL(WEB_PANEL_URL);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Image
        source={require('@/assets/images/towmycar-driver-blue-logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />

      <View style={styles.iconContainer}>
        <Text style={styles.icon}>✓</Text>
      </View>

      <Text style={styles.title}>Account Created!</Text>
      <Text style={styles.subtitle}>
        Your driver account has been registered successfully.
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Next Step: Complete Your Profile</Text>
        <Text style={styles.cardText}>
          To start accepting jobs, you need to log in to the TowMyCar web panel and submit your required documents and driver information.
        </Text>

        <View style={styles.stepList}>
          <View style={styles.step}>
            <Text style={styles.stepNumber}>1</Text>
            <Text style={styles.stepText}>Log in at the TowMyCar web panel</Text>
          </View>
          <View style={styles.step}>
            <Text style={styles.stepNumber}>2</Text>
            <Text style={styles.stepText}>Upload your driving licence with towing entitlement</Text>
          </View>
          <View style={styles.step}>
            <Text style={styles.stepNumber}>3</Text>
            <Text style={styles.stepText}>Upload your vehicle insurance policy</Text>
          </View>
          <View style={styles.step}>
            <Text style={styles.stepNumber}>4</Text>
            <Text style={styles.stepText}>Await admin approval — then start accepting jobs!</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.primaryButton} onPress={handleOpenWebPanel}>
        <Text style={styles.primaryButtonText}>Open Web Panel</Text>
      </TouchableOpacity>

      <Text style={styles.urlHint}>towmycar.uk/driver/sign-in</Text>

      <TouchableOpacity style={styles.dashboardButton} onPress={() => router.replace('/(app)/dashboard')}>
        <Text style={styles.dashboardButtonText}>Go to Dashboard</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  logo: {
    width: 160,
    height: 120,
    marginBottom: 16,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  icon: {
    fontSize: 32,
    color: Colors.text,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 20,
    width: '100%',
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  cardText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  stepList: {
    gap: 12,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    color: Colors.text,
    textAlign: 'center',
    lineHeight: 24,
    fontSize: 13,
    fontWeight: '700',
    overflow: 'hidden',
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center',
    marginBottom: 8,
  },
  primaryButtonText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  urlHint: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 16,
  },
  dashboardButton: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  dashboardButtonText: {
    color: Colors.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
  signOutButton: {
    paddingVertical: 8,
  },
  signOutText: {
    color: Colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
  },
});
