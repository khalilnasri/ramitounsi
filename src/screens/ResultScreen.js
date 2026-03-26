import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated, SafeAreaView, ScrollView,
} from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import { COLORS } from '../utils/constants';
import { calcPrizes, buildRanking } from '../game/scoring';
import { formatDinar, getInitials } from '../utils/helpers';
import { triggerTapHaptic } from '../utils/haptics';
import { BOUNCE_EASE, EASE, T } from '../utils/animation';

const MOCK_RANKING = [
  { id: 'me', name: 'Moi', cards: [], rank: 1, handPoints: 0 },
  { id: 'opp1', name: 'Ahmed B.', cards: [], rank: 2, handPoints: 24 },
  { id: 'opp2', name: 'Sami T.', cards: [], rank: 3, handPoints: 37 },
  { id: 'opp3', name: 'Rania K.', cards: [], rank: 4, handPoints: 52 },
];

const RANK_ICONS = ['🥇', '🥈', '🥉', '4️⃣'];
const RANK_COLORS = [COLORS.gold, '#aaa', '#cd7f32', '#666'];

const ResultScreen = ({ navigation, route }) => {
  const { room, winnerId, players } = route.params || {};
  const topf = room?.topf || 4;
  const prizes = calcPrizes(topf);

  const ranking = MOCK_RANKING;
  const [displayWin, setDisplayWin] = React.useState(0);
  const crownDropAnim = useRef(new Animated.Value(0)).current;
  const replayPulseAnim = useRef(new Animated.Value(0)).current;
  const rankRowAnims = useRef(ranking.map(() => new Animated.Value(0))).current;

  const [showConfetti, setShowConfetti] = React.useState(true);

  useEffect(() => {
    const crownAnim = Animated.timing(crownDropAnim, {
      toValue: 1,
      duration: T.verySlow,
      easing: BOUNCE_EASE,
      useNativeDriver: true,
    });
    crownAnim.start();

    const rankAnimations = rankRowAnims.map((anim, i) => (
      Animated.timing(anim, {
        toValue: 1,
        duration: T.slow,
        delay: i * 200,
        easing: EASE,
        useNativeDriver: true,
      })
    ));
    const rankIntro = Animated.stagger(200, rankAnimations);
    rankIntro.start();

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(replayPulseAnim, { toValue: 1, duration: T.verySlow, easing: EASE, useNativeDriver: true }),
        Animated.timing(replayPulseAnim, { toValue: 0, duration: T.verySlow, easing: EASE, useNativeDriver: true }),
      ])
    );
    pulseLoop.start();

    const winFrom = 0;
    const winTo = prizes.first;
    const startAt = Date.now();
    const duration = T.verySlow;
    let frame;
    const step = () => {
      const t = Math.min((Date.now() - startAt) / duration, 1);
      setDisplayWin(parseFloat((winFrom + ((winTo - winFrom) * t)).toFixed(2)));
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);

    return () => {
      crownAnim.stop();
      rankIntro.stop();
      pulseLoop.stop();
      cancelAnimationFrame(frame);
    };
  }, []);

  const onReplay = async () => {
    await triggerTapHaptic();
    navigation.replace('GameRoom', { room });
  };

  const onBackHome = async () => {
    await triggerTapHaptic();
    navigation.navigate('HomeMain');
  };

  const getPrizeForRank = (rank) => {
    if (rank === 1) return prizes.first;
    if (rank === 2) return prizes.second;
    return null;
  };

  return (
    <SafeAreaView style={styles.safe}>
      {showConfetti && (
        <ConfettiCannon
          count={80}
          origin={{ x: -10, y: 0 }}
          fallSpeed={2600}
          autoStart
          fadeOut
          explosionSpeed={420}
          colors={[COLORS.gold, '#2e7d32', '#f0f0f0']}
          onAnimationEnd={() => setShowConfetti(false)}
        />
      )}

      <ScrollView contentContainerStyle={styles.container}>
        {/* Title */}
        <Text style={styles.title}>Résultats</Text>
        <Text style={styles.subtitle}>Partie terminée!</Text>

        {/* Winner spotlight */}
        <View style={styles.winnerCard}>
          <Animated.Text
            style={[
              styles.winnerCrown,
              {
                transform: [
                  { translateY: crownDropAnim.interpolate({ inputRange: [0, 1], outputRange: [-80, 0] }) },
                  { scale: crownDropAnim.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0.6, 1.2, 1] }) },
                ],
              },
            ]}
          >
            👑
          </Animated.Text>
          <View style={styles.winnerAvatar}>
            <Text style={styles.winnerInitials}>{getInitials(ranking[0].name)}</Text>
          </View>
          <Text style={styles.winnerName}>{ranking[0].name}</Text>
          <Text style={styles.winnerLabel}>RAMI!</Text>
          <Text style={styles.winnerPrize}>+{formatDinar(displayWin)}</Text>
        </View>

        {/* Full ranking */}
        <View style={styles.rankingContainer}>
          {ranking.map((player, index) => {
            const prize = getPrizeForRank(player.rank);
            return (
              <Animated.View
                key={player.id}
                style={[
                  styles.rankRow,
                  player.rank === 1 && styles.rankRowWinner,
                  {
                    opacity: rankRowAnims[index],
                    transform: [{
                      translateY: rankRowAnims[index].interpolate({ inputRange: [0, 1], outputRange: [22, 0] }),
                    }],
                  },
                ]}
              >
                <Text style={styles.rankIcon}>{RANK_ICONS[player.rank - 1]}</Text>
                <View style={[
                  styles.rankAvatar,
                  { backgroundColor: RANK_COLORS[player.rank - 1] + '44' }
                ]}>
                  <Text style={[styles.rankAvatarText, { color: RANK_COLORS[player.rank - 1] }]}>
                    {getInitials(player.name)}
                  </Text>
                </View>
                <Text style={styles.rankName}>{player.name}</Text>
                <Text style={styles.rankPoints}>
                  {player.handPoints > 0 ? `${player.handPoints} pts` : 'Rami!'}
                </Text>
                {prize !== null && (
                  <View style={styles.prizeBadge}>
                    <Text style={styles.prizeText}>+{formatDinar(prize)}</Text>
                  </View>
                )}
              </Animated.View>
            );
          })}
        </View>

        {/* Topf summary */}
        <View style={styles.potSummary}>
          <Text style={styles.potLabel}>Pot total: {formatDinar(topf)}</Text>
          <View style={styles.potBreakdown}>
            <Text style={styles.potItem}>🥇 1er: {formatDinar(prizes.first)}</Text>
            <Text style={styles.potItem}>🥈 2ème: {formatDinar(prizes.second)}</Text>
          </View>
        </View>

        {/* Buttons */}
        <TouchableOpacity
          style={[
            styles.btnPrimary,
            {
              transform: [{ scale: replayPulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.04] }) }],
            },
          ]}
          onPress={onReplay}
          activeOpacity={0.85}
        >
          <Text style={styles.btnPrimaryText}>🔄 Rejouer</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.btnSecondary}
          onPress={onBackHome}
          activeOpacity={0.85}
        >
          <Text style={styles.btnSecondaryText}>🏠 Retour au lobby</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  container: { padding: 20, alignItems: 'center' },
  title: {
    color: COLORS.gold,
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 10,
  },
  subtitle: { color: COLORS.textMuted, fontSize: 14, marginBottom: 20 },
  winnerCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    borderWidth: 2,
    borderColor: COLORS.gold,
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#c9a02a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 9,
  },
  winnerCrown: { fontSize: 40, marginBottom: 8 },
  winnerAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.greenAccent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderWidth: 3,
    borderColor: COLORS.gold,
  },
  winnerInitials: { color: COLORS.white, fontSize: 24, fontWeight: 'bold' },
  winnerName: { color: COLORS.textLight, fontSize: 18, fontWeight: 'bold' },
  winnerLabel: { color: COLORS.gold, fontSize: 22, fontWeight: 'bold', marginTop: 4 },
  winnerPrize: { color: '#4caf50', fontSize: 28, fontWeight: 'bold', marginTop: 4 },
  rankingContainer: { width: '100%', gap: 8, marginBottom: 20 },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    padding: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: '#1e3d20',
    shadowColor: '#c9a02a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.14,
    shadowRadius: 6,
    elevation: 4,
  },
  rankRowWinner: { borderColor: COLORS.gold, backgroundColor: '#1a3010' },
  rankIcon: { fontSize: 22, width: 30, textAlign: 'center' },
  rankAvatar: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  rankAvatarText: { fontWeight: 'bold', fontSize: 14 },
  rankName: { flex: 1, color: COLORS.textLight, fontWeight: '600', fontSize: 14 },
  rankPoints: { color: COLORS.textMuted, fontSize: 12 },
  prizeBadge: {
    backgroundColor: COLORS.greenAccent,
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 10,
  },
  prizeText: { color: COLORS.white, fontSize: 12, fontWeight: 'bold' },
  potSummary: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    padding: 14,
    width: '100%',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#1e3d20',
    alignItems: 'center',
    shadowColor: '#c9a02a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 7,
    elevation: 4,
  },
  potLabel: { color: COLORS.textMuted, fontSize: 13, marginBottom: 8 },
  potBreakdown: { flexDirection: 'row', gap: 20 },
  potItem: { color: COLORS.textLight, fontSize: 13 },
  btnPrimary: {
    backgroundColor: COLORS.gold,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 40,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
    elevation: 4,
  },
  btnPrimaryText: { color: COLORS.black, fontWeight: 'bold', fontSize: 16 },
  btnSecondary: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 40,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a4a2a',
  },
  btnSecondaryText: { color: COLORS.textLight, fontWeight: '600', fontSize: 15 },
});

export default ResultScreen;
