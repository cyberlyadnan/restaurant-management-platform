import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BarChart3, BookOpen, Home, Package, User, UtensilsCrossed } from 'lucide-react-native';
import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { FloatingTabBar } from '../components/common/FloatingTabBar';
import { useAuth } from '../context/AuthContext';
import { ThemeProvider, useAppTheme } from '../context/ThemeContext';
import { KitchenHomeScreen } from '../screens/kitchen/KitchenHomeScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { OwnerHomeScreen } from '../screens/owner/OwnerHomeScreen';
import { OwnerReportsScreen } from '../screens/owner/OwnerReportsScreen';
import { WaiterCartScreen } from '../screens/waiter/WaiterCartScreen';
import { WaiterHomeScreen } from '../screens/waiter/WaiterHomeScreen';
import { WaiterMenuScreen } from '../screens/waiter/WaiterMenuScreen';
import { WaiterNotificationsScreen } from '../screens/waiter/WaiterNotificationsScreen';
import { WaiterOrdersScreen } from '../screens/waiter/WaiterOrdersScreen';
import { WaiterProfileScreen } from '../screens/waiter/WaiterProfileScreen';
import { WaiterTablesScreen } from '../screens/waiter/WaiterTablesScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function WaiterTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={WaiterHomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => <Home size={size || 20} color={color} />,
        }}
      />
      <Tab.Screen
        name="Tables"
        component={WaiterTablesScreen}
        options={{
          tabBarLabel: 'Tables',
          tabBarIcon: ({ color, size }) => <UtensilsCrossed size={size || 20} color={color} />,
        }}
      />
      <Tab.Screen
        name="Menu"
        component={WaiterMenuScreen}
        options={{
          tabBarLabel: 'New Order',
          tabBarIcon: ({ color, size }) => <BookOpen size={size || 20} color={color} />,
        }}
      />
      <Tab.Screen
        name="Orders"
        component={WaiterOrdersScreen}
        options={{
          tabBarLabel: 'Orders',
          tabBarIcon: ({ color, size }) => <Package size={size || 20} color={color} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={WaiterProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => <User size={size || 20} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

function OwnerTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={OwnerHomeScreen}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color, size }) => <Home size={size || 20} color={color} />,
        }}
      />
      <Tab.Screen
        name="Tables"
        component={WaiterTablesScreen}
        options={{
          tabBarLabel: 'Tables',
          tabBarIcon: ({ color, size }) => <UtensilsCrossed size={size || 20} color={color} />,
        }}
      />
      <Tab.Screen
        name="Orders"
        component={WaiterOrdersScreen}
        options={{
          tabBarLabel: 'Orders',
          tabBarIcon: ({ color, size }) => <Package size={size || 20} color={color} />,
        }}
      />
      <Tab.Screen
        name="Reports"
        component={OwnerReportsScreen}
        options={{
          tabBarLabel: 'Reports',
          tabBarIcon: ({ color, size }) => <BarChart3 size={size || 20} color={color} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={WaiterProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => <User size={size || 20} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

function NavigationRoot() {
  const { user, isLoading, isKitchen, isOwnerOrManager } = useAuth();
  const { theme } = useAppTheme();

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : isKitchen ? (
          <Stack.Screen name="KitchenMain" component={KitchenHomeScreen} />
        ) : isOwnerOrManager ? (
          <>
            <Stack.Screen name="OwnerMain" component={OwnerTabs} />
            <Stack.Screen name="Menu" component={WaiterMenuScreen} />
            <Stack.Screen name="Cart" component={WaiterCartScreen} />
            <Stack.Screen name="Notifications" component={WaiterNotificationsScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="WaiterMain" component={WaiterTabs} />
            <Stack.Screen name="Cart" component={WaiterCartScreen} />
            <Stack.Screen name="Notifications" component={WaiterNotificationsScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export function AppNavigator() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <NavigationRoot />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
