import { Drawer } from 'expo-router/drawer';
import { useAuth, useUser } from '@clerk/expo';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { usePushNotifications } from '@/lib/hooks/use-push-notifications';
import { useDriverDashboard } from '@/lib/hooks/use-driver-api';
import type { DrawerContentComponentProps } from '@react-navigation/drawer';
import { DrawerContentScrollView } from '@react-navigation/drawer';

function CustomDrawerContent(props: DrawerContentComponentProps) {
  const { signOut } = useAuth();
  const { user } = useUser();
  const { data: dashboard } = useDriverDashboard();

  const firstName = dashboard?.user?.firstName ?? user?.firstName ?? 'Driver';
  const lastName = dashboard?.user?.lastName ?? user?.lastName ?? '';
  const email = dashboard?.user?.email ?? user?.primaryEmailAddress?.emailAddress ?? '';
  const approvalStatus = dashboard?.driver?.approvalStatus ?? 'PENDING';
  const availabilityStatus = dashboard?.driver?.availabilityStatus ?? 'UNAVAILABLE';

  const currentRoute = props.state.routes[props.state.index]?.name;

  const menuItems: { name: string; label: string; icon: string }[] = [
    { name: 'dashboard', label: 'Dashboard', icon: 'grid-outline' },
    { name: 'requests/index', label: 'Requests', icon: 'car-outline' },
    { name: 'profile', label: 'Profile Info', icon: 'person-outline' },
    { name: 'documents', label: 'Documents', icon: 'document-text-outline' },
    { name: 'settings', label: 'Settings', icon: 'settings-outline' },
  ];

  return (
    <DrawerContentScrollView
      {...props}
      style={styles.drawerScroll}
      contentContainerStyle={styles.drawerContent}
    >
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <Text style={styles.profileName} numberOfLines={1}>
          {firstName} {lastName}
        </Text>
        {email ? (
          <Text style={styles.profileEmail} numberOfLines={1}>
            {email}
          </Text>
        ) : null}
        <View style={styles.statusRow}>
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor:
                  availabilityStatus === 'AVAILABLE'
                    ? Colors.success
                    : Colors.textMuted,
              },
            ]}
          />
          <Text style={styles.statusText}>
            {availabilityStatus === 'AVAILABLE' ? 'Available' : 'Unavailable'}
          </Text>
          <View
            style={[
              styles.approvalBadge,
              {
                backgroundColor:
                  approvalStatus === 'APPROVED'
                    ? Colors.success + '22'
                    : Colors.warning + '22',
              },
            ]}
          >
            <Text
              style={[
                styles.approvalText,
                {
                  color:
                    approvalStatus === 'APPROVED'
                      ? Colors.success
                      : Colors.warning,
                },
              ]}
            >
              {approvalStatus}
            </Text>
          </View>
        </View>
      </View>

      {/* Menu Items */}
      <View style={styles.menuSection}>
        {menuItems.map((item) => {
          const isActive = currentRoute === item.name;
          return (
            <TouchableOpacity
              key={item.name}
              style={[styles.menuItem, isActive && styles.menuItemActive]}
              onPress={() => props.navigation.navigate(item.name)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={item.icon as any}
                size={20}
                color={isActive ? Colors.primary : Colors.textSecondary}
              />
              <Text
                style={[
                  styles.menuLabel,
                  isActive && styles.menuLabelActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Sign Out */}
      <View style={styles.bottomSection}>
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={() => signOut()}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={20} color={Colors.error} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </DrawerContentScrollView>
  );
}

export default function AppLayout() {
  usePushNotifications();

  return (
    <Drawer
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: Colors.background },
        headerTintColor: Colors.text,
        headerTitleStyle: { fontWeight: '600' },
        sceneStyle: { backgroundColor: Colors.background },
        drawerStyle: {
          backgroundColor: Colors.background,
          width: 280,
        },
        swipeEnabled: true,
      }}
    >
      <Drawer.Screen
        name="dashboard"
        options={{ title: 'Dashboard' }}
      />
      <Drawer.Screen
        name="requests/index"
        options={{ title: 'Requests' }}
      />
      <Drawer.Screen
        name="requests/[id]"
        options={{
          title: 'Request Details',
          drawerItemStyle: { display: 'none' },
        }}
      />
      <Drawer.Screen
        name="profile"
        options={{ title: 'Profile Info' }}
      />
      <Drawer.Screen
        name="documents"
        options={{ title: 'Documents' }}
      />
      <Drawer.Screen
        name="settings"
        options={{ title: 'Settings' }}
      />
    </Drawer>
  );
}

const styles = StyleSheet.create({
  drawerScroll: {
    backgroundColor: Colors.background,
  },
  drawerContent: {
    flex: 1,
    paddingTop: 0,
  },
  profileHeader: {
    padding: 20,
    paddingTop: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: 8,
  },
  profileName: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  profileEmail: {
    color: Colors.textSecondary,
    fontSize: 13,
    marginBottom: 10,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  approvalBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 4,
  },
  approvalText: {
    fontSize: 10,
    fontWeight: '600',
  },
  menuSection: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: 10,
    marginBottom: 2,
  },
  menuItemActive: {
    backgroundColor: Colors.primary + '18',
  },
  menuLabel: {
    color: Colors.textSecondary,
    fontSize: 15,
    fontWeight: '500',
  },
  menuLabelActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  bottomSection: {
    marginTop: 'auto',
    paddingHorizontal: 12,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 12,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: 10,
  },
  signOutText: {
    color: Colors.error,
    fontSize: 15,
    fontWeight: '500',
  },
});
