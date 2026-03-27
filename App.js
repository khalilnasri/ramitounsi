import React, { useEffect, useMemo, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';

import SplashScreen from './src/screens/SplashScreen';
import HomeScreen from './src/screens/HomeScreen';
import GameRoomScreen from './src/screens/GameRoomScreen';
import GameScreen from './src/screens/GameScreen';
import ResultScreen from './src/screens/ResultScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import HistoriqueScreen from './src/screens/HistoriqueScreen';
import ClassementScreen from './src/screens/ClassementScreen';
import ParametresScreen from './src/screens/ParametresScreen';
import { COLORS } from './src/utils/constants';
import { signInAnon, onAuthChange } from './firebase';
import { AuthContext } from './src/context/AuthContext';
import { LanguageContext } from './src/context/LanguageContext';
import { t } from './src/utils/i18n';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const fadeTransition = {
  cardStyleInterpolator: ({ current }) => ({
    cardStyle: { opacity: current.progress },
  }),
};

const LANGUAGE_KEY = 'language';

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

const MainTabs = ({ language }) => (
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
      name={t(language, 'home')}
      component={HomeTab}
      options={{ tabBarIcon: ({ focused }) => <TabIcon name="🏠" focused={focused} /> }}
    />
    <Tab.Screen
      name={t(language, 'games')}
      component={HistoriqueScreen}
      options={{ tabBarIcon: ({ focused }) => <TabIcon name="🎮" focused={focused} /> }}
    />
    <Tab.Screen
      name={t(language, 'classement')}
      component={ClassementScreen}
      options={{ tabBarIcon: ({ focused }) => <TabIcon name="🏆" focused={focused} /> }}
    />
    <Tab.Screen
      name={t(language, 'profile')}
      component={ProfileScreen}
      options={{ tabBarIcon: ({ focused }) => <TabIcon name="👤" focused={focused} /> }}
    />
  </Tab.Navigator>
);

export default function App() {
  const [userId, setUserId] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [language, setLanguage] = useState('fr');

  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const saved = await AsyncStorage.getItem(LANGUAGE_KEY);
        if (saved === 'fr' || saved === 'ar') setLanguage(saved);
        if (saved === 'FR') setLanguage('fr');
        if (saved === 'AR') setLanguage('ar');
      } catch (error) {
        // Keep default language.
      }
    };
    loadLanguage();
  }, []);

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
  const languageValue = useMemo(() => ({ language, setLanguage }), [language]);

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
        <LanguageContext.Provider value={languageValue}>
          <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false, ...fadeTransition }}>
              <Stack.Screen name="Splash" component={SplashScreen} />
              <Stack.Screen name="Main">
                {(props) => <MainTabs {...props} language={language} />}
              </Stack.Screen>
              <Stack.Screen name="Historique" component={HistoriqueScreen} />
              <Stack.Screen name="ClassementGlobal" component={ClassementScreen} />
              <Stack.Screen name="Parametres" component={ParametresScreen} />
              {/* Direct game routes (from splash → home) */}
            </Stack.Navigator>
          </NavigationContainer>
        </LanguageContext.Provider>
      </AuthContext.Provider>
    </GestureHandlerRootView>
  );
}
