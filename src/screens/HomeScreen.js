import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, SafeAreaView, Animated, Image,
} from 'react-native';
import { COLORS, ROOMS } from '../utils/constants';
import { formatDinar } from '../utils/helpers';
import RoomCard from '../components/RoomCard';
import { collection, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { triggerTapHaptic } from '../utils/haptics';
import { EASE, T } from '../utils/animation';

/* ── Static image mapping (require must be static strings) ── */
const ROOM_IMAGES = {
  vip:    require('../../assets/vip.png'),
  salle3: require('../../assets/salle3.webp'),
  salle2: require('../../assets/salle2.webp'),
  salle1: require('../../assets/salle1.webp'),
};

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

const HomeScreen = ({ navigation, route }) => {
  const [balance, setBalance]               = useState(50.0);
  const [bonusClaimed, setBonusClaimed]     = useState(false);
  const [occupancy, setOccupancy]           = useState({});
  const [roomState, setRoomState]           = useState({});
  const [notice, setNotice]                 = useState('');
  const [displayBalance, setDisplayBalance] = useState(0);

  const promoShimmer = useRef(new Animated.Value(-1)).current;
  const roomAnims    = useRef(ROOMS.map(() => new Animated.Value(0))).current;
  const headerScale  = useRef(new Animated.Value(0.96)).current;

  /* Notice banner */
  useEffect(() => {
    if (!route?.params?.notice) return undefined;
    setNotice(route.params.notice);
    const t = setTimeout(() => setNotice(''), 3000);
    return () => clearTimeout(t);
  }, [route?.params?.notice]);

  /* Animated balance counter */
  useEffect(() => {
    let frameId;
    const from = displayBalance;
    const to   = balance;
    const t0   = Date.now();
    const run  = () => {
      const p    = Math.min((Date.now() - t0) / T.verySlow, 1);
      const next = from + (to - from) * p;
      setDisplayBalance(parseFloat(next.toFixed(2)));
      if (p < 1) frameId = requestAnimationFrame(run);
    };
    frameId = requestAnimationFrame(run);
    return () => cancelAnimationFrame(frameId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [balance]);

  /* Shimmer on bonus banner */
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(promoShimmer, {
        toValue: 1, duration: T.verySlow, easing: EASE, useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [promoShimmer]);

  /* Staggered room cards entrance */
  useEffect(() => {
    roomAnims.forEach((a) => a.setValue(0));
    const seq = Animated.stagger(
      T.stagger,
      roomAnims.map((a) =>
        Animated.timing(a, { toValue: 1, duration: T.slow, easing: EASE, useNativeDriver: true })
      )
    );
    seq.start();
    return () => seq.stop();
  }, [roomAnims]);

  /* Header entrance */
  useEffect(() => {
    Animated.timing(headerScale, {
      toValue: 1, duration: T.normal, easing: EASE, useNativeDriver: true,
    }).start();
  }, [headerScale]);

  /* Firebase: room occupancy & game state */
  useEffect(() => {
    const unsubs = [];
    ROOMS.forEach((room) => {
      unsubs.push(
        onSnapshot(collection(db, 'rooms', room.id, 'spieler'), (snap) =>
          setOccupancy((prev) => ({ ...prev, [room.id]: snap.size }))
        )
      );
      unsubs.push(
        onSnapshot(doc(db, 'rooms', room.id), (snap) => {
          const data = snap.exists() ? snap.data() : {};
          setRoomState((prev) => ({
            ...prev,
            [room.id]: { gameStarted: Boolean(data.gameStarted) },
          }));
        })
      );
    });
    return () => unsubs.forEach((u) => u());
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
      <StatusBar barStyle="light-content" backgroundColor="#1a0a2e" />

      {/* ── Header ── */}
      <Animated.View style={[styles.header, { transform: [{ scale: headerScale }] }]}>
        {/* Left: avatar + title */}
        <View style={styles.headerLeft}>
          <View style={styles.avatarRing}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>ر</Text>
            </View>
          </View>
          <View style={styles.headerTitles}>
            <Text style={styles.headerTitleAr}>رامي تونسي</Text>
            <Text style={styles.headerSubtitle}>Rami Tounsi Café</Text>
          </View>
        </View>

        {/* Right: balance chip */}
        <TouchableOpacity style={styles.balanceChip} activeOpacity={0.85}>
          <Text style={styles.coinEmoji}>🪙</Text>
          <Text style={styles.balanceText}>{formatDinar(displayBalance)}</Text>
        </TouchableOpacity>
      </Animated.View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Notice banner */}
        {notice ? (
          <View style={styles.noticeBanner}>
            <Text style={styles.noticeText}>{notice}</Text>
          </View>
        ) : null}

        {/* ── Daily Bonus Banner ── */}
        <AnimatedTouchableOpacity
          style={[styles.bonusBanner, bonusClaimed && styles.bonusBannerClaimed]}
          onPress={claimBonus}
          activeOpacity={0.85}
        >
          {/* Shimmer sweep */}
          <Animated.View
            pointerEvents="none"
            style={[
              styles.shimmer,
              {
                transform: [{
                  translateX: promoShimmer.interpolate({
                    inputRange: [-1, 1], outputRange: [-260, 260],
                  }),
                }],
              },
            ]}
          />
          <Text style={styles.bonusIcon}>{bonusClaimed ? '✓' : '🎁'}</Text>
          <View style={styles.bonusTexts}>
            <Text style={styles.bonusTitle}>
              {bonusClaimed ? 'Bonus réclamé !' : 'Bonus du jour'}
            </Text>
            <Text style={styles.bonusAmount}>
              {bonusClaimed ? 'Revenez demain' : '+ 5.00 D'}
            </Text>
          </View>
          {!bonusClaimed && (
            <View style={styles.bonusBadge}>
              <Text style={styles.bonusBadgeText}>GRATUIT</Text>
            </View>
          )}
        </AnimatedTouchableOpacity>

        {/* ── Section title ── */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <View style={styles.sectionAccentBar} />
            <Text style={styles.sectionTitle}>Salles de jeu</Text>
          </View>
          <Text style={styles.sectionSub}>Choisissez votre table</Text>
        </View>

        {/* ── Room Cards ── */}
        {ROOMS.map((room, index) => (
          <Animated.View
            key={room.id}
            style={{
              opacity: roomAnims[index],
              transform: [{
                translateY: roomAnims[index].interpolate({
                  inputRange: [0, 1], outputRange: [20, 0],
                }),
              }],
            }}
          >
            <RoomCard
              room={room}
              image={ROOM_IMAGES[room.id]}
              occupiedCount={room.id === 'hobby' ? 1 : (occupancy[room.id] || 0)}
              gameStarted={roomState[room.id]?.gameStarted}
              onJoin={handleJoinRoom}
            />
          </Animated.View>
        ))}

        {/* ── Win distribution ── */}
        <View style={styles.distCard}>
          <Text style={styles.distTitle}>Répartition des gains</Text>
          <View style={styles.distBar}>
            <View style={[styles.distSeg, styles.distFirst, { flex: 5 }]}>
              <Text style={styles.distLabel}>🥇 50%</Text>
            </View>
            <View style={[styles.distSeg, styles.distSecond, { flex: 3 }]}>
              <Text style={styles.distLabel}>🥈 30%</Text>
            </View>
            <View style={[styles.distSeg, styles.distApp, { flex: 2 }]}>
              <Text style={styles.distLabel}>20%</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 90 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0d0820',
  },
  scroll: {
    paddingTop: 4,
  },

  /* ── Header ── */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1a0a2e',
    borderBottomWidth: 1,
    borderBottomColor: '#3d1a6e',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarRing: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2,
    borderColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#6a1b9a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerTitles: {
    gap: 1,
  },
  headerTitleAr: {
    fontSize: 19,
    fontWeight: 'bold',
    color: COLORS.gold,
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#9e9e9e',
    letterSpacing: 0.8,
  },
  balanceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f2710',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: COLORS.gold,
    gap: 6,
    elevation: 4,
    shadowColor: COLORS.gold,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  coinEmoji: {
    fontSize: 17,
  },
  balanceText: {
    color: COLORS.gold,
    fontWeight: 'bold',
    fontSize: 16,
  },

  /* ── Notice ── */
  noticeBanner: {
    backgroundColor: '#7f1d1d',
    borderColor: '#ef4444',
    borderWidth: 1,
    borderRadius: 10,
    marginHorizontal: 14,
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  noticeText: {
    color: '#fee2e2',
    textAlign: 'center',
    fontWeight: '600',
  },

  /* ── Bonus Banner ── */
  bonusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a0e2e',
    borderWidth: 1.5,
    borderColor: COLORS.gold,
    borderRadius: 16,
    margin: 14,
    padding: 14,
    gap: 12,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: COLORS.gold,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  bonusBannerClaimed: {
    opacity: 0.55,
    borderColor: COLORS.greenAccent,
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 110,
    height: '100%',
    backgroundColor: 'rgba(201,160,42,0.18)',
  },
  bonusIcon: {
    fontSize: 34,
  },
  bonusTexts: {
    flex: 1,
  },
  bonusTitle: {
    color: COLORS.textLight,
    fontSize: 15,
    fontWeight: 'bold',
  },
  bonusAmount: {
    color: COLORS.gold,
    fontSize: 22,
    fontWeight: 'bold',
  },
  bonusBadge: {
    backgroundColor: COLORS.gold,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  bonusBadgeText: {
    color: '#000',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },

  /* ── Section header ── */
  sectionHeader: {
    paddingHorizontal: 16,
    marginBottom: 6,
    marginTop: 2,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  sectionAccentBar: {
    width: 4,
    height: 20,
    borderRadius: 2,
    backgroundColor: COLORS.gold,
  },
  sectionTitle: {
    color: COLORS.textLight,
    fontSize: 18,
    fontWeight: 'bold',
  },
  sectionSub: {
    color: COLORS.textMuted,
    fontSize: 12,
    paddingLeft: 12,
  },

  /* ── Win distribution ── */
  distCard: {
    backgroundColor: '#0f0a1e',
    borderRadius: 14,
    marginHorizontal: 14,
    marginTop: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2a1a4a',
    elevation: 3,
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
  distSeg: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  distFirst: {
    backgroundColor: '#c9a02a',
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
  },
  distSecond: {
    backgroundColor: '#78909c',
  },
  distApp: {
    backgroundColor: '#455a64',
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
  },
  distLabel: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
});

export default HomeScreen;
