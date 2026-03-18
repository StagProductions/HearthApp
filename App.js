import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/hooks/useAuth';

import AuthScreen from './src/screens/AuthScreen';
import HouseholdSetupScreen from './src/screens/HouseholdSetupScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import CalendarScreen from './src/screens/CalendarScreen';
import { ShiftsScreen } from './src/screens/ShiftsScreen';
import MealsScreen from './src/screens/MealsScreen';
import BillsScreen from './src/screens/BillsScreen';
import DocumentsScreen from './src/screens/DocumentsScreen';
import { colors } from './src/utils/theme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  Home: '🏠',
  Calendar: '📅',
  Shifts: '🔄',
  Meals: '🍽️',
  Bills: '💳',
  Documents: '📁',
};

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused }) => (
          <Text style={{ fontSize: focused ? 22 : 20, opacity: focused ? 1 : 0.6 }}>
            {TAB_ICONS[route.name]}
          </Text>
        ),
        tabBarLabel: ({ focused, color }) => (
          <Text style={{ fontSize: 10, color: focused ? colors.rust : colors.textMuted, fontWeight: focused ? '700' : '400', marginBottom: 2 }}>
            {route.name}
          </Text>
        ),
        tabBarStyle: {
          backgroundColor: colors.warmWhite,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 80,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.rust,
        tabBarInactiveTintColor: colors.textMuted,
        headerStyle: { backgroundColor: colors.warmWhite },
        headerTitleStyle: { color: colors.darkBrown, fontWeight: '700', fontSize: 18 },
        headerShadowVisible: false,
      })}
    >
      <Tab.Screen name="Home" component={DashboardScreen} options={{ title: 'Hearth', headerTitle: '🏡 Hearth' }}/>
      <Tab.Screen name="Calendar" component={CalendarScreen}/>
      <Tab.Screen name="Shifts" component={ShiftsScreen}/>
      <Tab.Screen name="Meals" component={MealsScreen}/>
      <Tab.Screen name="Bills" component={BillsScreen}/>
      <Tab.Screen name="Documents" component={DocumentsScreen}/>
    </Tab.Navigator>
  );
}

function RootNavigator() {
  const { user, household, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingLogo}>🏡</Text>
        <Text style={styles.loadingTitle}>Hearth</Text>
        <ActivityIndicator color={colors.rust} style={{ marginTop: 24 }}/>
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user
        ? <Stack.Screen name="Auth" component={AuthScreen}/>
        : !household
          ? <Stack.Screen name="HouseholdSetup" component={HouseholdSetupScreen}/>
          : <Stack.Screen name="Main" component={TabNavigator}/>
      }
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer>
          <RootNavigator/>
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.cream,
  },
  loadingLogo: { fontSize: 64 },
  loadingTitle: { fontSize: 32, fontWeight: '800', color: colors.darkBrown, marginTop: 12, letterSpacing: 0.5 },
});
