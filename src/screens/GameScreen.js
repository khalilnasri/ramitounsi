import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, SafeAreaView, ScrollView,
} from 'react-native';
import { COLORS } from '../utils/constants';
import { createDeck, dealCards, sortHand } from '../game/deck';
import { isValidCombination } from '../game/rules';
import { calcHandPoints } from '../game/scoring';
import PlayingCard from '../components/PlayingCard';
import CardHand from '../components/CardHand';
import PlayerSlot from '../components/PlayerSlot';
import CombinationZone from '../components/CombinationZone';
import { triggerTapHaptic } from '../utils/haptics';

const OPPONENT_NAMES = ['Ahmed B.', 'Sami T.', 'Rania K.'];

const GameScreen = ({ navigation, route }) => {
  const {
    room,
    roomId,
    hostId,
    players: roomPlayers = [],
    currentUserId,
    einsatz,
    topf,
  } = route.params || {};

  const [myHand, setMyHand] = useState([]);
  const [selectedCards, setSelectedCards] = useState([]);
  const [drawPile, setDrawPile] = useState([]);
  const [discardPile, setDiscardPile] = useState([]);
  const [combinations, setCombinations] = useState([]);
  const [currentTurn, setCurrentTurn] = useState(0); // 0 = moi
  const [hasDrawn, setHasDrawn] = useState(false);
  const [opponents, setOpponents] = useState([]);
  const [points, setPoints] = useState(0);
  const [phase, setPhase] = useState('draw'); // draw | play
  const isHobbyRoom = room?.id === 'hobby';
  const totalPlayers = Math.max(2, Math.min(4, roomPlayers.length || (isHobbyRoom ? 2 : 4)));

  useEffect(() => {
    const deck = createDeck();
    const { hands, drawPile: dp, discardPile: dp2 } = dealCards(deck, totalPlayers, 14);
    setMyHand(sortHand(hands[0]));
    setDrawPile(dp);
    setDiscardPile(dp2);
    const routeOpponents = roomPlayers
      .filter((p) => p.id !== currentUserId && p.uid !== currentUserId)
      .slice(0, totalPlayers - 1);
    setOpponents(
      hands
        .slice(1, totalPlayers)
        .map((cards, i) => ({
          id: routeOpponents[i]?.id || `opp${i + 1}`,
          name: routeOpponents[i]?.name || OPPONENT_NAMES[i] || `Bot ${i + 1}`,
          cards,
        }))
    );
  }, [totalPlayers, roomPlayers, currentUserId]);

  useEffect(() => {
    setPoints(calcHandPoints(myHand));
  }, [myHand]);

  const toggleCardSelect = (card) => {
    setSelectedCards((prev) => {
      const exists = prev.find((c) => c.id === card.id);
      return exists ? prev.filter((c) => c.id !== card.id) : [...prev, card];
    });
  };

  const drawFromPile = () => {
    if (hasDrawn || currentTurn !== 0) return;
    if (drawPile.length === 0) { Alert.alert('Pile vide!'); return; }
    const [card, ...rest] = drawPile;
    setMyHand((h) => sortHand([...h, card]));
    setDrawPile(rest);
    setHasDrawn(true);
    setPhase('play');
  };

  const drawFromDiscard = () => {
    if (hasDrawn || currentTurn !== 0) return;
    if (discardPile.length === 0) return;
    const card = discardPile[discardPile.length - 1];
    setDiscardPile((p) => p.slice(0, -1));
    setMyHand((h) => sortHand([...h, card]));
    setHasDrawn(true);
    setPhase('play');
  };

  const discardCard = () => {
    if (!hasDrawn || selectedCards.length !== 1) {
      Alert.alert('Sélectionnez 1 carte à défausser');
      return;
    }
    const card = selectedCards[0];
    setMyHand((h) => h.filter((c) => c.id !== card.id));
    setDiscardPile((p) => [...p, card]);
    setSelectedCards([]);
    setHasDrawn(false);
    setPhase('draw');

    // Vérifier victoire
    if (myHand.length - 1 === 0) {
      navigation.replace('Result', {
        room,
        winnerId: 'me',
        players: [
          { id: 'me', name: 'Moi', cards: [] },
          ...opponents,
        ],
      });
      return;
    }

    // Passer au tour suivant
    setCurrentTurn((t) => (t + 1) % totalPlayers);
  };

  const layDownCombination = () => {
    if (selectedCards.length < 3) {
      Alert.alert('Sélectionnez au moins 3 cartes');
      return;
    }
    if (!isValidCombination(selectedCards)) {
      Alert.alert('Combinaison invalide!', 'Brelan, Carré ou Séquence de même couleur');
      return;
    }
    setCombinations((prev) => [...prev, selectedCards]);
    setMyHand((h) => h.filter((c) => !selectedCards.find((s) => s.id === c.id)));
    setSelectedCards([]);
  };

  const onBackPress = async () => {
    await triggerTapHaptic();
    navigation.goBack();
  };
  const onDrawPilePress = async () => { await triggerTapHaptic(); drawFromPile(); };
  const onDrawDiscardPress = async () => { await triggerTapHaptic(); drawFromDiscard(); };
  const onDiscardPress = async () => { await triggerTapHaptic(); discardCard(); };
  const onCombinePress = async () => { await triggerTapHaptic(); layDownCombination(); };
  const onRamiPress = async () => {
    await triggerTapHaptic();
    navigation.replace('Result', { room, winnerId: 'me', players: [] });
  };

  const topDiscard = discardPile[discardPile.length - 1];

  useEffect(() => {
    if (currentTurn === 0) return undefined;
    if (opponents.length === 0) return undefined;

    const botIndex = currentTurn - 1;
    if (!opponents[botIndex]) return undefined;

    const timeout = setTimeout(() => {
      setOpponents((prevOpps) => {
        const nextOpps = [...prevOpps];
        const bot = nextOpps[botIndex];
        if (!bot) return prevOpps;

        const canDrawDiscard = discardPile.length > 0 && Math.random() < 0.35;
        let botCards = [...bot.cards];
        let nextDrawPile = [...drawPile];
        let nextDiscardPile = [...discardPile];

        if (canDrawDiscard) {
          const picked = nextDiscardPile[nextDiscardPile.length - 1];
          nextDiscardPile = nextDiscardPile.slice(0, -1);
          if (picked) botCards.push(picked);
        } else if (nextDrawPile.length > 0) {
          const [picked, ...rest] = nextDrawPile;
          nextDrawPile = rest;
          if (picked) botCards.push(picked);
        }

        if (botCards.length === 0) {
          setCurrentTurn((t) => (t + 1) % totalPlayers);
          return prevOpps;
        }

        const discardIndex = Math.floor(Math.random() * botCards.length);
        const [discarded] = botCards.splice(discardIndex, 1);
        if (discarded) nextDiscardPile = [...nextDiscardPile, discarded];

        nextOpps[botIndex] = { ...bot, cards: botCards };
        setDrawPile(nextDrawPile);
        setDiscardPile(nextDiscardPile);

        if (botCards.length === 0) {
          navigation.replace('Result', {
            room,
            winnerId: bot.id,
            players: [
              { id: 'me', name: 'Moi', cards: myHand },
              ...nextOpps,
            ],
          });
          return nextOpps;
        }

        setCurrentTurn((t) => (t + 1) % totalPlayers);
        return nextOpps;
      });
    }, 900);

    return () => clearTimeout(timeout);
  }, [currentTurn, opponents, drawPile, discardPile, totalPlayers, navigation, room, myHand]);

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBackPress} activeOpacity={0.85}>
          <Text style={styles.quitText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.roomTitle}>{room?.nameFr || 'Partie'}</Text>
        <View style={styles.pointsBadge}>
          <Text style={styles.pointsText}>📊 {points} pts</Text>
        </View>
      </View>

      {/* Game sync metadata placeholder */}
      <View style={styles.syncMetaBar}>
        <Text style={styles.syncMetaText}>
          Room: {roomId || room?.id || '-'} • Host: {(hostId || '-').toString().slice(0, 6)}
        </Text>
        <Text style={styles.syncMetaText}>
          Players: {roomPlayers.length} • Me: {(currentUserId || '-').toString().slice(0, 6)} • Einsatz: {einsatz || room?.einsatz || 0}D • Topf: {topf || room?.topf || 0}D
        </Text>
      </View>

      {/* Opponents */}
      <View style={styles.opponentsRow}>
        {opponents.map((opp, i) => (
          <View key={opp.id} style={styles.oppContainer}>
            <PlayerSlot
              player={opp}
              isCurrentTurn={currentTurn === i + 1}
              cardCount={opp.cards.length}
            />
            {/* Verdeckte Karten */}
            <View style={styles.oppCards}>
              {Array.from({ length: Math.min(opp.cards.length, 5) }).map((_, ci) => (
                <PlayingCard key={ci} card={opp.cards[ci]} faceDown small
                  style={{ marginLeft: ci > 0 ? -14 : 0 }} />
              ))}
            </View>
          </View>
        ))}
      </View>

      {/* Table Center */}
      <View style={styles.tableCenter}>
        {/* Draw Pile */}
        <TouchableOpacity style={styles.pile} onPress={onDrawPilePress} activeOpacity={0.85}>
          <PlayingCard card={{ id: 'back', isJoker: false }} faceDown />
          <Text style={styles.pileLabel}>{drawPile.length}</Text>
        </TouchableOpacity>

        <View style={styles.centerInfo}>
          <Text style={styles.turnIndicator}>
            {currentTurn === 0 ? '⭐ Mon tour' : `Tour de ${opponents[currentTurn - 1]?.name}`}
          </Text>
          <Text style={styles.phaseText}>
            {phase === 'draw' ? '👆 Piocher' : '🃏 Défausser'}
          </Text>
          <Text style={styles.phaseHint}>
            Ziehe links vom Stapel oder rechts von der Ablage
          </Text>
        </View>

        {/* Discard Pile */}
        <TouchableOpacity style={styles.pile} onPress={onDrawDiscardPress} activeOpacity={0.85}>
          {topDiscard ? (
            <PlayingCard card={topDiscard} />
          ) : (
            <View style={styles.emptyDiscard}>
              <Text style={styles.emptyDiscardText}>Vide</Text>
            </View>
          )}
          <Text style={styles.pileLabel}>{topDiscard ? 'Défausse' : 'Ablage leer'}</Text>
        </TouchableOpacity>
      </View>

      {/* Combination Zone */}
      <CombinationZone
        combinations={combinations}
        selectedCards={selectedCards}
        onAddToCombo={(idx) => {
          const combo = combinations[idx];
          setCombinations((prev) => {
            const updated = [...prev];
            updated[idx] = [...combo, ...selectedCards];
            return updated;
          });
          setMyHand((h) => h.filter((c) => !selectedCards.find((s) => s.id === c.id)));
          setSelectedCards([]);
        }}
      />

      {/* My Hand */}
      <View style={styles.myHandContainer}>
        <Text style={styles.handLabel}>
          Ma main ({myHand.length} cartes)
          {selectedCards.length > 0 && ` • ${selectedCards.length} sélectionnée(s)`}
        </Text>
        <CardHand
          cards={myHand}
          selectedCards={selectedCards}
          onCardPress={toggleCardSelect}
        />
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.btnDiscard, (!hasDrawn || selectedCards.length !== 1) && styles.btnDisabled]}
          onPress={onDiscardPress}
          activeOpacity={0.85}
        >
          <Text style={styles.actionText}>Défausser</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.btnCombo, selectedCards.length < 3 && styles.btnDisabled]}
          onPress={onCombinePress}
          activeOpacity={0.85}
        >
          <Text style={styles.actionText}>Combiner</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.btnRami, myHand.length > 0 && styles.btnDisabled]}
          onPress={onRamiPress}
          activeOpacity={0.85}
        >
          <Text style={styles.actionText}>RAMI!</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.tableGreen },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  quitText: { color: '#ef9a9a', fontSize: 20, fontWeight: 'bold', padding: 4 },
  roomTitle: { color: COLORS.gold, fontWeight: 'bold', fontSize: 16 },
  pointsBadge: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.gold,
  },
  pointsText: { color: COLORS.gold, fontSize: 12, fontWeight: 'bold' },
  syncMetaBar: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  syncMetaText: {
    color: COLORS.textMuted,
    fontSize: 10,
  },
  opponentsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    paddingHorizontal: 4,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  oppContainer: { alignItems: 'center' },
  oppCards: { flexDirection: 'row', marginTop: 4 },
  tableCenter: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(0,0,0,0.15)',
    marginVertical: 4,
  },
  pile: { alignItems: 'center', gap: 4 },
  pileLabel: { color: COLORS.textLight, fontSize: 11 },
  emptyDiscard: {
    width: 48, height: 70,
    borderWidth: 2, borderColor: '#555',
    borderStyle: 'dashed', borderRadius: 6,
    alignItems: 'center', justifyContent: 'center',
  },
  emptyDiscardText: { color: '#555', fontSize: 11 },
  centerInfo: { alignItems: 'center', gap: 4 },
  turnIndicator: { color: COLORS.gold, fontWeight: 'bold', fontSize: 13, textAlign: 'center' },
  phaseText: { color: COLORS.textLight, fontSize: 12 },
  phaseHint: { color: COLORS.textMuted, fontSize: 11, textAlign: 'center' },
  myHandContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
    margin: 8,
    padding: 8,
  },
  handLabel: { color: COLORS.textMuted, fontSize: 11, marginBottom: 6 },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  btnDiscard: { backgroundColor: '#c62828' },
  btnCombo: { backgroundColor: COLORS.greenAccent },
  btnRami: { backgroundColor: COLORS.gold },
  btnDisabled: { opacity: 0.4 },
  actionText: { color: COLORS.white, fontWeight: 'bold', fontSize: 13 },
});

export default GameScreen;
