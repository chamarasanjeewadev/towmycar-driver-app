import { Stack } from 'expo-router';
import { useAuth } from '@clerk/expo';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';

export default function AppLayout() {
  const { signOut } = useAuth();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.background },
        headerTintColor: Colors.text,
        headerTitleStyle: { fontWeight: '600' },
        contentStyle: { backgroundColor: Colors.background },
        headerRight: () => (
          <TouchableOpacity onPress={() => signOut()} style={styles.signOut}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        ),
      }}
    >
      <Stack.Screen name="dashboard" options={{ title: 'Dashboard' }} />
      <Stack.Screen name="requests/index" options={{ title: 'Requests' }} />
      <Stack.Screen name="requests/[id]" options={{ title: 'Request Details' }} />
    </Stack>
  );
}

const styles = StyleSheet.create({
  signOut: {
    marginRight: 8,
  },
  signOutText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});
