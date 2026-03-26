import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, SafeAreaView, Animated,
} from 'react-native';
import { COLORS, ROOMS } from '../utils/constants';
import { formatDinar } from '../utils/helpers';
import RoomCard from '../components/RoomCard';
import { collection, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { triggerTapHaptic } from '../utils/haptics';
import { EASE, T } from '../utils/animation';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

const HomeScreen = ({ navigation, route }) => {
  const [balance, setBalance] = useState(50.0);
  const [bonusClaimed, setBonusClaimed] = useState(false);
  const [occupancy, setOccupancy] = useState({});
  const [roomState, setRoomState] = useState({});
  const [notice, setNotice] = useState('');
  const [displayBalance, setDisplayBalance] = useState(0);

  const promoShimmer = useRef(new Animated.Value(-1)).current;
  const roomAnims = useRef(ROOMS.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    if (!route?.params?.notice) return undefined;
    setNotice(route.params.notice);
    const timeout = setTimeout(() => setNotice(''), 3000);
    return () => clearTimeout(timeout);
  }, [route?.params?.notice]);

  useEffect(() => {
    let frameId;
    const startValue = displayBalance;
    const endValue = balance;
    const startTime = Date.now();
    const duration = T.verySlow;

    const updateValue = () => {
      const progress = Math.min((Date.now() - startTime) / duration, 1);
      const next = startValue + ((endValue - startValue) * progress);
      setDisplayBalance(parseFloat(next.toFixed(2)));
      if (progress < 1) frameId = requestAnimationFrame(updateValue);
    };

    frameId = requestAnimationFrame(updateValue);
    return () => cancelAnimationFrame(frameId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [balance]);

  useEffect(() => {
    const shimmerLoop = Animated.loop(
      Animated.timing(promoShimmer, {
        toValue: 1,
        duration: T.verySlow,
        easing: EASE,
        useNativeDriver: true,
      })
    );
    shimmerLoop.start();
    return () => shimmerLoop.stop();
  }, [promoShimmer]);

  useEffect(() => {
    roomAnims.forEach((anim) => anim.setValue(0));
    const fadeIn = roomAnims.map((anim, i) => (
      Animated.timing(anim, {
        toValue: 1,
        duration: T.slow,
        delay: i * T.stagger,
        useNativeDriver: true,
      })
    ));
    const roomIntro = Animated.stagger(T.stagger, fadeIn);
    roomIntro.start();
    return () => roomIntro.stop();
  }, [roomAnims]);

  useEffect(() => {
    const unsubscribers = [];
    ROOMS.forEach((room) => {
      const playersRef = collection(db, 'rooms', room.id, 'spieler');
      const roomDocRef = doc(db, 'rooms', room.id);

      unsubscribers.push(onSnapshot(playersRef, (snap) => {
        setOccupancy((prev) => ({ ...prev, [room.id]: snap.size }));
      }));

      unsubscribers.push(onSnapshot(roomDocRef, (snap) => {
        const data = snap.exists() ? snap.data() : {};
        setRoomState((prev) => ({
          ...prev,
          [room.id]: { gameStarted: Boolean(data.gameStarted) },
        }));
      }));
    });

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, []);

  const claimBonus = async () => {
    await triggerTapHaptic();
    if (!bonusClaimed) {
      setBalance((b) => parseFloat((b + 5).toFixed(2)));
      setBonusClaimed(true);
    }
  };

  const handleJoinRoom = (room) => {
    navigation.navigate('GameRoom', {
      room,
      roomId: room.id,
      einsatz: room.einsatz,
      balance,
      forceShowRules: true,
      offlineMode: room.id === 'hobby',
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>رامي تونسي</Text>
          <Text style={styles.headerSubtitle}>Rami Tounsi Café</Text>
        </View>
        <TouchableOpacity style={styles.balanceChip} activeOpacity={0.85}>
          <Text style={styles.coinIcon}>🪙</Text>
          <Text style={styles.balanceText}>{formatDinar(displayBalance)}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {notice ? (
          <View style={styles.noticeBanner}>
            <Text style={styles.noticeText}>{notice}</Text>
          </View>
        ) : null}

        {/* Promo Banner */}
        <AnimatedTouchableOpacity
          style={[styles.promoBanner, bonusClaimed && styles.promoBannerClaimed]}
          onPress={claimBonus}
          activeOpacity={0.85}
        >
          <Animated.View
            pointerEvents="none"
            style={[
              styles.shimmer,
              {
                transform: [{
                  translateX: promoShimmer.interpolate({
                    inputRange: [-1, 1],
                    outputRange: [-260, 260],
                  }),
                }],
              },
            ]}
          />
          <Text style={styles.promoIcon}>{bonusClaimed ? '✓' : '🎁'}</Text>
          <View style={styles.promoTextContainer}>
            <Text style={styles.promoTitle}>
              {bonusClaimed ? 'Bonus réclamé!' : 'Bonus du jour'}
            </Text>
            <Text style={styles.promoAmount}>
              {bonusClaimed ? 'Revenez demain' : '+ 5.00 D'}
            </Text>
          </View>
        </AnimatedTouchableOpacity>

        {/* Section Title */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Salles de jeu</Text>
          <Text style={styles.sectionSubtitle}>Choisissez votre table</Text>
        </View>

        {/* Room Cards */}
        {ROOMS.map((room, index) => (
          <Animated.View
            key={room.id}
            style={{
              opacity: roomAnims[index],
              transform: [{
                translateY: roomAnims[index].interpolate({ inputRange: [0, 1], outputRange: [16, 0] }),
              }],
            }}
          >
            <RoomCard
              room={room}
              occupiedCount={room.id === 'hobby' ? 1 : (occupancy[room.id] || 0)}
              gameStarted={roomState[room.id]?.gameStarted}
              onJoin={handleJoinRoom}
            />
          </Animated.View>
        ))}

        {/* Win Distribution */}
        <View style={styles.distributionCard}>
          <Text style={styles.distTitle}>Répartition des gains</Text>
          <View style={styles.distBar}>
            <View style={[styles.distSegment, styles.distFirst, { flex: 5 }]}>
              <Text style={styles.distLabel}>🥇 50%</Text>
            </View>
            <View style={[styles.distSegment, styles.distSecond, { flex: 3 }]}>
              <Text style={styles.distLabel}>🥈 30%</Text>
            </View>
            <View style={[styles.distSegment, styles.distApp, { flex: 2 }]}>
              <Text style={styles.distLabel}>20%</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1e3d20',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.gold,
  },
  headerSubtitle: {
    fontSize: 11,
    color: COLORS.textMuted,
    letterSpacing: 1,
  },
  balanceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.gold,
    gap: 6,
  },
  coinIcon: {
    fontSize: 16,
  },
  balanceText: {
    color: COLORS.gold,
    fontWeight: 'bold',
    fontSize: 15,
  },
  promoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a4a1a',
    borderWidth: 1,
    borderColor: COLORS.gold,
    borderRadius: 14,
    margin: 16,
    padding: 16,
    gap: 12,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#c9a02a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 120,
    height: '100%',
    backgroundColor: 'rgba(201,160,42,0.22)',
  },
  noticeBanner: {
    backgroundColor: '#8b1f1f',
    borderColor: '#b14b4b',
    borderWidth: 1,
    borderRadius: 10,
    marginHorizontal: 16,
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  noticeText: {
    color: '#ffe5e5',
    textAlign: 'center',
    fontWeight: '600',
  },
  promoBannerClaimed: {
    opacity: 0.6,
    borderColor: COLORS.greenAccent,
  },
  promoIcon: {
    fontSize: 32,
  },
  promoTextContainer: {
    flex: 1,
  },
  promoTitle: {
    color: COLORS.textLight,
    fontSize: 16,
    fontWeight: 'bold',
  },
  promoAmount: {
    color: COLORS.gold,
    fontSize: 22,
    fontWeight: 'bold',
  },
  sectionHeader: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    color: COLORS.textLight,
    fontSize: 18,
    fontWeight: 'bold',
  },
  sectionSubtitle: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  distributionCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 14,
    margin: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1e3d20',
    shadowColor: '#c9a02a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  distTitle: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginBottom: 10,
    textAlign: 'center',
  },
  distBar: {
    flexDirection: 'row',
    height: 36,
    borderRadius: 8,
    overflow: 'hidden',
    gap: 2,
  },
  distSegment: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  distFirst: {
    backgroundColor: '#c9a02a',
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
  },
  distSecond: {
    backgroundColor: '#888',
  },
  distApp: {
    backgroundColor: '#555',
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
  },
  distLabel: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 12,
  },
});

export default HomeScreen;
