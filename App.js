import React, { useEffect, useMemo, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import SplashScreen from './src/screens/SplashScreen';
import HomeScreen from './src/screens/HomeScreen';
import GameRoomScreen from './src/screens/GameRoomScreen';
import GameScreen from './src/screens/GameScreen';
import ResultScreen from './src/screens/ResultScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import { COLORS } from './src/utils/constants';
import { signInAnon, onAuthChange } from './firebase';
import { AuthContext } from './src/context/AuthContext';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const fadeTransition = {
  cardStyleInterpolator: ({ current }) => ({
    cardStyle: { opacity: current.progress },
  }),
};

const TabIcon = ({ name, focused }) => (
  <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{name}</Text>
);

const HomeStack = createStackNavigator();
const HomeTab = () => (
  <HomeStack.Navigator screenOptions={{ headerShown: false, ...fadeTransition }}>
    <HomeStack.Screen name="HomeMain" component={HomeScreen} />
    <HomeStack.Screen name="GameRoom" component={GameRoomScreen} />
    <HomeStack.Screen name="Game" component={GameScreen} />
    <HomeStack.Screen name="Result" component={ResultScreen} />
  </HomeStack.Navigator>
);

// Placeholder screens for tabs
const PartiesScreen = () => (
  <View style={{ flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center' }}>
    <Text style={{ color: COLORS.textMuted, fontSize: 16 }}>Historique des parties</Text>
    <Text style={{ color: COLORS.textMuted, fontSize: 13, marginTop: 8 }}>Bientôt disponible</Text>
  </View>
);

const ClassementScreen = () => (
  <View style={{ flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center' }}>
    <Text style={{ color: COLORS.gold, fontSize: 32, marginBottom: 16 }}>🏆</Text>
    <Text style={{ color: COLORS.textLight, fontSize: 16, fontWeight: 'bold' }}>Classement</Text>
    {[
      { name: 'Ayoub S.', wins: 34 },
      { name: 'Meryem L.', wins: 29 },
      { name: 'Khalil N.', wins: 22 },
    ].map((p, i) => (
      <View key={p.name} style={{
        flexDirection: 'row', width: '80%', justifyContent: 'space-between',
        backgroundColor: COLORS.cardBackground, borderRadius: 10, padding: 12,
        marginTop: 10, borderWidth: 1, borderColor: '#1e3d20',
      }}>
        <Text style={{ color: COLORS.gold }}>#{i + 1}</Text>
        <Text style={{ color: COLORS.textLight }}>{p.name}</Text>
        <Text style={{ color: COLORS.greenAccent }}>{p.wins} victoires</Text>
      </View>
    ))}
  </View>
);

const MainTabs = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarStyle: {
        backgroundColor: COLORS.cardBackground,
        borderTopColor: '#1e3d20',
        borderTopWidth: 1,
        height: 60,
        paddingBottom: 8,
      },
      tabBarActiveTintColor: COLORS.gold,
      tabBarInactiveTintColor: COLORS.textMuted,
      tabBarLabelStyle: { fontSize: 11 },
    }}
  >
    <Tab.Screen
      name="Accueil"
      component={HomeTab}
      options={{ tabBarIcon: ({ focused }) => <TabIcon name="🏠" focused={focused} /> }}
    />
    <Tab.Screen
      name="Parties"
      component={PartiesScreen}
      options={{ tabBarIcon: ({ focused }) => <TabIcon name="🃏" focused={focused} /> }}
    />
    <Tab.Screen
      name="Classement"
      component={ClassementScreen}
      options={{ tabBarIcon: ({ focused }) => <TabIcon name="🏆" focused={focused} /> }}
    />
    <Tab.Screen
      name="Profil"
      component={ProfileScreen}
      options={{ tabBarIcon: ({ focused }) => <TabIcon name="👤" focused={focused} /> }}
    />
  </Tab.Navigator>
);

export default function App() {
  const [userId, setUserId] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    let unsubAuth = () => {};
    let isMounted = true;

    const initAuth = async () => {
      try {
        await signInAnon();
      } catch (error) {
        // Keep app booting even if auth has temporary issues.
      }

      unsubAuth = onAuthChange((user) => {
        if (!isMounted) return;
        setUserId(user?.uid || null);
        setAuthReady(true);
      });
    };

    initAuth();
    return () => {
      isMounted = false;
      unsubAuth();
    };
  }, []);

  const authValue = useMemo(() => ({ userId, authReady }), [userId, authReady]);

  if (!authReady) {
    return (
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: COLORS.background }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 }}>
          <ActivityIndicator size="large" color={COLORS.gold} />
          <Text style={{ color: COLORS.textLight, fontWeight: '600' }}>
            Verbindung wird vorbereitet...
          </Text>
        </View>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthContext.Provider value={authValue}>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false, ...fadeTransition }}>
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="Main" component={MainTabs} />
            {/* Direct game routes (from splash → home) */}
          </Stack.Navigator>
        </NavigationContainer>
      </AuthContext.Provider>
    </GestureHandlerRootView>
  );
}
