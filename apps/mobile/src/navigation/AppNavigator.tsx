import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { ManagerRestrictedScreen } from '../screens/common/ManagerRestrictedScreen';
import { KitchenHomeScreen } from '../screens/kitchen/KitchenHomeScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { WaiterCartScreen } from '../screens/waiter/WaiterCartScreen';
import { WaiterHomeScreen } from '../screens/waiter/WaiterHomeScreen';
import { WaiterMenuScreen } from '../screens/waiter/WaiterMenuScreen';
import { WaiterNotificationsScreen } from '../screens/waiter/WaiterNotificationsScreen';
import { WaiterOrdersScreen } from '../screens/waiter/WaiterOrdersScreen';
import { WaiterProfileScreen } from '../screens/waiter/WaiterProfileScreen';
import { WaiterTablesScreen } from '../screens/waiter/WaiterTablesScreen';
import { theme } from '../theme';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function WaiterTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.surfaceBorder,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textDim,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={WaiterHomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 18, opacity: focused ? 1 : 0.6 }}>🏠</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Tables"
        component={WaiterTablesScreen}
        options={{
          tabBarLabel: 'Tables',
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 18, opacity: focused ? 1 : 0.6 }}>🍽️</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Menu"
        component={WaiterMenuScreen}
        options={{
          tabBarLabel: 'Menu',
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 18, opacity: focused ? 1 : 0.6 }}>📋</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Orders"
        component={WaiterOrdersScreen}
        options={{
          tabBarLabel: 'Orders',
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 18, opacity: focused ? 1 : 0.6 }}>📦</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={WaiterProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 18, opacity: focused ? 1 : 0.6 }}>👤</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  const { user, isLoading, isKitchen } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
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
        ) : (
          <>
            <Stack.Screen name="WaiterMain" component={WaiterTabs} />
            <Stack.Screen name="Cart" component={WaiterCartScreen} />
            <Stack.Screen name="Notifications" component={WaiterNotificationsScreen} />
            <Stack.Screen name="ManagerNotice" component={ManagerRestrictedScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
