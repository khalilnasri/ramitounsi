import React, { useState, useEffect, useRef, useMemo, useContext } from 'react';
import {
  Alert,
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  FlatList, KeyboardAvoidingView, Platform, Animated, SafeAreaView, Modal, ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, COUNTDOWN_SECONDS } from '../utils/constants';
import PlayerSlot from '../components/PlayerSlot';
import { auth, db } from '../../firebase';
import { AuthContext } from '../context/AuthContext';
import {
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
} from 'firebase/firestore';
import { triggerTapHaptic } from '../utils/haptics';
import { BOUNCE_EASE, EASE, T } from '../utils/animation';

const MAX_PLAYERS = 4;
const MIN_PLAYERS_TO_START = 3;
const BOT_NAMES = ['Karim', 'Sonia', 'Nader', 'Lina'];

const GameRoomScreen = ({ navigation, route }) => {
  const RULES_SHOWN_KEY = 'rulesShown';
  const USERNAME_KEY = 'username';
  const { userId } = useContext(AuthContext);
  const { room } = route.params || {};
  const isOfflineRoom = route?.params?.offlineMode === true || room?.id === 'hobby';
  const roomId = room?.id || 'default-room';
  const roomRef = useMemo(() => doc(db, 'rooms', roomId), [roomId]);
  const playersRef = useMemo(() => collection(db, 'rooms', roomId, 'spieler'), [roomId]);
  const currentUserId = userId || auth.currentUser?.uid || null;
  const effectiveUserId = currentUserId || `local-${roomId}`;

  const [players, setPlayers] = useState([]);
  const [messages, setMessages] = useState([
    { id: '1', user: 'Système', text: 'Bienvenue dans la salle!' },
  ]);
  const [inputText, setInputText] = useState('');
  const [countdown, setCountdown] = useState(null);
  const [roomCreatorId, setRoomCreatorId] = useState(null);
  const [countdownActive, setCountdownActive] = useState(false);
  const [countdownEndsAt, setCountdownEndsAt] = useState(null);
  const [isRoomActive, setIsRoomActive] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [bannerVisible, setBannerVisible] = useState(false);
  const [bannerText, setBannerText] = useState('⚠️ Verbindung fehlt - pruefe dein Internet');
  const [username, setUsername] = useState('');
  const [waitingDotCount, setWaitingDotCount] = useState(1);

  const dotAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const countPulseAnim = useRef(new Animated.Value(0)).current;
  const modalSlideAnim = useRef(new Animated.Value(1)).current;
  const modalContentVisibleRef = useRef(false);
  const slotAnims = useRef(Array.from({ length: MAX_PLAYERS }, () => new Animated.Value(0))).current;
  const previousSlotIdsRef = useRef(Array.from({ length: MAX_PLAYERS }, () => null));
  const sectionBounceAnims = useRef(Array.from({ length: 5 }, () => new Animated.Value(0))).current;
  const playBtnShimmer = useRef(new Animated.Value(-1)).current;
  const modalCloseAnimRef = useRef(null);
  const flatListRef = useRef();
  const hasNavigatedRef = useRef(false);
  const countdownFinalizedRef = useRef(false);
  const myPlayerDocRef = useRef(null);
  const hasEverJoinedRef = useRef(false);
  const hasLeftRef = useRef(false);
  const playersCount = players.length;
  const requiredPlayersToStart = isOfflineRoom ? 2 : MIN_PLAYERS_TO_START;
  const canStartGame = playersCount >= requiredPlayersToStart;
  const isCreator = isOfflineRoom
    ? true
    : (Boolean(currentUserId) && roomCreatorId === currentUserId);
  const allSlotsFilled = playersCount === MAX_PLAYERS;

  useEffect(() => {
    const loadUsername = async () => {
      try {
        const savedUsername = await AsyncStorage.getItem(USERNAME_KEY);
        if (savedUsername && savedUsername.trim()) setUsername(savedUsername.trim());
      } catch (error) {
        // Ignore, fallback name will be used.
      }
    };
    loadUsername();
  }, []);

  useEffect(() => {
    const loadRulesPreference = async () => {
      try {
        const alreadyShown = await AsyncStorage.getItem(RULES_SHOWN_KEY);
        const forceShowRules = route?.params?.forceShowRules === true;
        if (alreadyShown === 'true' && !forceShowRules) {
          setIsRoomActive(true);
          return;
        }
        setShowRulesModal(true);
      } catch (error) {
        // Fallback: don't block room flow if storage fails.
        setIsRoomActive(true);
      }
    };

    loadRulesPreference();
  }, []);

  const openRulesModal = () => {
    setShowRulesModal(true);
  };

  const closeRulesModal = () => {
    modalCloseAnimRef.current = Animated.timing(modalSlideAnim, {
      toValue: 1,
      duration: T.normal,
      easing: EASE,
      useNativeDriver: true,
    });
    modalCloseAnimRef.current.start(() => {
      setShowRulesModal(false);
      setIsRoomActive(true);
      modalContentVisibleRef.current = false;
    });
  };

  useEffect(() => () => {
    modalCloseAnimRef.current?.stop();
  }, []);

  const rememberRules = async () => {
    try {
      await AsyncStorage.setItem(RULES_SHOWN_KEY, 'true');
    } catch (error) {
      // Even if saving fails, user can continue.
    }
    closeRulesModal();
  };

  const navigateToGame = () => {
    if (hasNavigatedRef.current) return;
    hasNavigatedRef.current = true;
    navigation.replace('Game', {
      room,
      roomId,
      hostId: roomCreatorId,
      players,
      currentUserId,
      einsatz: room?.einsatz,
      topf: room?.topf,
    });
  };

  const navigateHome = (notice) => {
    if (hasNavigatedRef.current) return;
    hasNavigatedRef.current = true;
    navigation.navigate('HomeMain', notice ? { notice } : undefined);
  };

  const startGameForAll = async () => {
    if (isOfflineRoom) {
      navigateToGame();
      return;
    }
    try {
      await setDoc(roomRef, {
        gameStarted: true,
        countdownActive: false,
        countdownEndsAt: null,
        startedAt: serverTimestamp(),
      }, { merge: true });
    } catch (error) {
      navigateToGame();
    }
  };

  const startCountdown = async () => {
    try {
      countdownFinalizedRef.current = false;
      await setDoc(roomRef, {
        countdownActive: true,
        countdownEndsAt: Timestamp.fromDate(new Date(Date.now() + (COUNTDOWN_SECONDS * 1000))),
        gameStarted: false,
      }, { merge: true });
    } catch (error) {
      // Ignore and keep waiting state.
    }
  };

  const cancelCountdown = async () => {
    if (isOfflineRoom) {
      setCountdown(null);
      return;
    }
    try {
      await setDoc(roomRef, {
        countdownActive: false,
        countdownEndsAt: null,
      }, { merge: true });
      setCountdown(null);
    } catch (error) {
      // Ignore.
    }
  };

  // Join room + room state subscription
  useEffect(() => {
    if (!isRoomActive) return undefined;
    if (isOfflineRoom) {
      const me = {
        id: effectiveUserId,
        uid: effectiveUserId,
        name: username || `Joueur ${effectiveUserId.slice(0, 4)}`,
        bereit: true,
      };
      const botId = `bot-local-${roomId}`;
      const bot = {
        id: botId,
        uid: botId,
        name: 'Rami Bot',
        bereit: true,
        isBot: true,
      };
      setRoomCreatorId(effectiveUserId);
      setPlayers([me, bot]);
      setCountdownActive(false);
      setCountdownEndsAt(null);
      return undefined;
    }
    if (!currentUserId) return undefined;

    let unsubscribeRoom = () => {};
    let unsubscribePlayers = () => {};
    let isMounted = true;

    const joinAndSubscribe = async () => {
      try {
        const roomSnap = await getDoc(roomRef);
        const roomData = roomSnap.exists() ? roomSnap.data() : null;

        if (!roomSnap.exists()) {
          await setDoc(roomRef, {
            hostId: currentUserId,
            gameStarted: false,
            countdownActive: false,
            countdownEndsAt: null,
            createdAt: serverTimestamp(),
            spielerIds: [currentUserId],
          }, { merge: true });
          if (isMounted) setRoomCreatorId(currentUserId);
        } else if (!roomData?.hostId) {
          await setDoc(roomRef, { hostId: currentUserId }, { merge: true });
          if (isMounted) setRoomCreatorId(currentUserId);
        } else if (isMounted) {
          setRoomCreatorId(roomData.hostId);
        }

        myPlayerDocRef.current = doc(playersRef, currentUserId);
        await setDoc(myPlayerDocRef.current, {
          uid: currentUserId,
          name: username || `Joueur ${currentUserId.slice(0, 4)}`,
          bereit: false,
          joinedAt: serverTimestamp(),
        }, { merge: true });

        await setDoc(roomRef, { spielerIds: arrayUnion(currentUserId) }, { merge: true });

        unsubscribeRoom = onSnapshot(
          roomRef,
          (snap) => {
            setBannerVisible(false);
            if (!snap.exists()) {
              if (!hasLeftRef.current) navigateHome('Der Host hat den Raum verlassen');
              return;
            }
            const data = snap.data();
            setRoomCreatorId(data.hostId || null);
            setCountdownActive(Boolean(data.countdownActive));
            setCountdownEndsAt(data.countdownEndsAt || null);

            if (data.gameStarted) {
              navigateToGame();
            }
          },
          () => {
            setBannerVisible(true);
            setBannerText('⚠️ Verbindung fehlt - pruefe dein Internet');
          }
        );

        const playersQuery = query(playersRef, orderBy('joinedAt', 'asc'));
        unsubscribePlayers = onSnapshot(
          playersQuery,
          (snap) => {
            setBannerVisible(false);
            const joined = snap.docs
              .map((d) => ({ id: d.id, ...d.data() }))
              .slice(0, MAX_PLAYERS);
            setPlayers(joined);
            const stillInRoom = joined.some((p) => p.id === currentUserId || p.uid === currentUserId);
            if (stillInRoom) {
              hasEverJoinedRef.current = true;
            } else if (hasEverJoinedRef.current && !hasLeftRef.current) {
              navigateHome('Du wurdest aus dem Raum entfernt');
            }
          },
          () => {
            setBannerVisible(true);
            setBannerText('⚠️ Verbindung fehlt - pruefe dein Internet');
          }
        );
      } catch (error) {
        setBannerVisible(true);
        setBannerText('⚠️ Verbindung fehlt - pruefe dein Internet');
      }
    };

    joinAndSubscribe();

    return () => {
      isMounted = false;
      unsubscribeRoom();
      unsubscribePlayers();
      if (myPlayerDocRef.current && !hasLeftRef.current) {
        deleteDoc(myPlayerDocRef.current).catch(() => {});
      }
      if (!hasLeftRef.current) {
        setDoc(roomRef, { spielerIds: arrayRemove(currentUserId) }, { merge: true }).catch(() => {});
      }
    };
  }, [isRoomActive, roomRef, playersRef, currentUserId, username, isOfflineRoom, roomId, effectiveUserId]);

  // Auto-start countdown when room reaches 4/4.
  useEffect(() => {
    if (isOfflineRoom) return undefined;
    if (!isRoomActive) return undefined;
    if (allSlotsFilled && isCreator && !countdownActive) {
      startCountdown();
    }
    return undefined;
  }, [allSlotsFilled, isCreator, countdownActive, isRoomActive, isOfflineRoom]);

  // Auto-fill room with random bot players (host side).
  useEffect(() => {
    if (isOfflineRoom) return undefined;
    if (!isRoomActive || !isCreator || countdownActive) return undefined;
    if (playersCount >= MAX_PLAYERS) return undefined;

    const timeout = setTimeout(async () => {
      try {
        const botCount = players.filter((p) => (p?.uid || '').startsWith('bot-')).length;
        const nextBotIndex = botCount + 1;
        const botId = `bot-${roomId}-${nextBotIndex}`;
        await setDoc(doc(playersRef, botId), {
          uid: botId,
          name: BOT_NAMES[(nextBotIndex - 1) % BOT_NAMES.length],
          bereit: true,
          isBot: true,
          joinedAt: serverTimestamp(),
        }, { merge: true });
        await setDoc(roomRef, { spielerIds: arrayUnion(botId) }, { merge: true });
      } catch (error) {
        // Ignore bot-fill failures; real players can still join.
      }
    }, 2000);

    return () => clearTimeout(timeout);
  }, [isRoomActive, isCreator, countdownActive, playersCount, players, roomId, playersRef, roomRef, isOfflineRoom]);

  // Live countdown display + finalize game start.
  useEffect(() => {
    if (!countdownActive || !countdownEndsAt) {
      setCountdown(null);
      countdownFinalizedRef.current = false;
      return undefined;
    }

    const tick = () => {
      const endsAtMs = typeof countdownEndsAt?.toDate === 'function'
        ? countdownEndsAt.toDate().getTime()
        : null;
      if (!endsAtMs) return;

      const secondsLeft = Math.max(0, Math.ceil((endsAtMs - Date.now()) / 1000));
      setCountdown(secondsLeft);

      if (secondsLeft <= 0 && isCreator && !countdownFinalizedRef.current) {
        countdownFinalizedRef.current = true;
        startGameForAll();
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [countdownActive, countdownEndsAt, isCreator]);

  useEffect(() => {
    if (countdown === null) return undefined;
    const pulse = Animated.sequence([
      Animated.timing(countPulseAnim, { toValue: 1, duration: T.fast, easing: EASE, useNativeDriver: true }),
      Animated.timing(countPulseAnim, { toValue: 0, duration: T.normal, easing: EASE, useNativeDriver: true }),
    ]);
    pulse.start();
    return () => pulse.stop();
  }, [countdown, countPulseAnim]);

  // Waiting animation
  useEffect(() => {
    if (!isRoomActive) return undefined;

    if (!canStartGame) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(dotAnim, { toValue: 1, duration: 1200, easing: EASE, useNativeDriver: true }),
          Animated.timing(dotAnim, { toValue: 0, duration: 1200, easing: EASE, useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }
    return () => dotAnim.stopAnimation();
  }, [canStartGame, dotAnim, isRoomActive]);

  useEffect(() => {
    if (canStartGame) return undefined;
    const interval = setInterval(() => {
      setWaitingDotCount((prev) => (prev >= 3 ? 1 : prev + 1));
    }, T.slow);
    return () => clearInterval(interval);
  }, [canStartGame]);

  useEffect(() => {
    const canPulse = canStartGame && isCreator;
    if (!canPulse) {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(0);
      return undefined;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: T.verySlow, easing: EASE, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0, duration: T.verySlow, easing: EASE, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [canStartGame, isCreator, pulseAnim]);

  useEffect(() => {
    const slotTransitions = [];
    const nextSlots = Array.from({ length: MAX_PLAYERS }).map((_, i) => players[i] || null);
    nextSlots.forEach((player, i) => {
      const prevId = previousSlotIdsRef.current[i];
      const nextId = player?.id || null;
      if (nextId && prevId !== nextId) {
        slotAnims[i].setValue(0);
        const slotAnim = Animated.timing(slotAnims[i], {
          toValue: 1,
          duration: T.normal,
          easing: EASE,
          useNativeDriver: true,
        });
        slotAnim.start();
        slotTransitions.push(slotAnim);
      } else if (!nextId) {
        slotAnims[i].setValue(0);
      }
      previousSlotIdsRef.current[i] = nextId;
    });
    return () => slotTransitions.forEach((anim) => anim.stop());
  }, [players, slotAnims]);

  useEffect(() => {
    if (!showRulesModal) return undefined;

    if (!modalContentVisibleRef.current) {
      modalSlideAnim.setValue(1);
      const modalIntro = Animated.timing(modalSlideAnim, {
        toValue: 0,
        duration: T.normal,
        easing: EASE,
        useNativeDriver: true,
      });
      modalIntro.start();
      modalContentVisibleRef.current = true;
      sectionBounceAnims.forEach((anim) => anim.setValue(0));
      const sectionBounces = sectionBounceAnims.map((anim, i) => (
        Animated.timing(anim, {
          toValue: 1,
          delay: i * T.stagger,
          duration: T.normal,
          easing: BOUNCE_EASE,
          useNativeDriver: true,
        })
      ));
      const bounceIntro = Animated.stagger(T.stagger, sectionBounces);
      bounceIntro.start();
      return () => {
        modalIntro.stop();
        bounceIntro.stop();
      };
    }
    return undefined;
  }, [showRulesModal, modalSlideAnim, sectionBounceAnims]);

  useEffect(() => {
    if (!showRulesModal) return undefined;
    const loop = Animated.loop(
      Animated.timing(playBtnShimmer, {
        toValue: 1,
        duration: T.verySlow,
        easing: EASE,
        useNativeDriver: true,
      })
    );
    playBtnShimmer.setValue(-1);
    loop.start();
    return () => loop.stop();
  }, [showRulesModal, playBtnShimmer]);

  const sendMessage = async () => {
    if (!inputText.trim()) return;
    await triggerTapHaptic();
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), user: 'Moi', text: inputText.trim() },
    ]);
    setInputText('');
  };

  const leaveRoom = async () => {
    if (!currentUserId) return;
    await triggerTapHaptic();
    if (isOfflineRoom) {
      navigateHome('Du hast den Hobby-Raum verlassen');
      return;
    }
    hasLeftRef.current = true;
    try {
      if (isCreator) {
        await deleteDoc(roomRef);
        navigateHome('Du hast den Raum verlassen');
        return;
      }
      if (myPlayerDocRef.current) {
        await deleteDoc(myPlayerDocRef.current);
      }
      await setDoc(roomRef, { spielerIds: arrayRemove(currentUserId) }, { merge: true });
      navigateHome('Du hast den Raum verlassen');
    } catch (error) {
      hasLeftRef.current = false;
      Alert.alert('Fehler', 'Raum konnte nicht verlassen werden.');
    }
  };

  const kickPlayer = async (targetId) => {
    if (!isCreator || !targetId || targetId === currentUserId) return;
    await triggerTapHaptic();
    if (isOfflineRoom) {
      setPlayers((prev) => prev.filter((p) => p.id !== targetId));
      return;
    }
    try {
      await deleteDoc(doc(playersRef, targetId));
      await setDoc(roomRef, { spielerIds: arrayRemove(targetId) }, { merge: true });
    } catch (error) {
      Alert.alert('Fehler', 'Spieler konnte nicht entfernt werden.');
    }
  };

  const pressStartGame = async () => {
    await triggerTapHaptic();
    startGameForAll();
  };

  const waitingDotsLabel = '.'.repeat(waitingDotCount);
  const slots = Array.from({ length: MAX_PLAYERS }).map((_, i) => players[i] || null);
  const canPressStart = canStartGame && isCreator;
  const startButtonLabel = !canStartGame
    ? `Warten auf Spieler... (${playersCount}/${MAX_PLAYERS})`
    : (isCreator ? 'Spiel starten! ▶' : 'Warten auf Host...');

  return (
    <SafeAreaView style={styles.safe}>
      {bannerVisible && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{bannerText}</Text>
        </View>
      )}
      <View style={styles.header}>
        <TouchableOpacity onPress={leaveRoom} style={styles.backBtn} activeOpacity={0.85}>
          <Text style={styles.backText}>✕ Verlassen</Text>
        </TouchableOpacity>
        <Text style={styles.roomName}>{room?.nameFr || 'Salle'}</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.helpBtn} onPress={openRulesModal} activeOpacity={0.85}>
            <Text style={styles.helpText}>?</Text>
          </TouchableOpacity>
          <View style={styles.potBadge}>
            <Text style={styles.potText}>🏆 {room?.topf}D</Text>
          </View>
        </View>
      </View>

      {/* Countdown Banner */}
      {countdownActive && countdown !== null && (
        <View style={styles.countdownBanner}>
          <Animated.Text
            style={[
              styles.countdownBigNumber,
              {
                transform: [{
                  scale: countPulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.2] }),
                }],
              },
            ]}
          >
            {countdown}
          </Animated.Text>
          <Text style={styles.countdownText}>Spiel startet in...</Text>
          {isCreator && (
            <TouchableOpacity style={styles.cancelCountdownBtn} onPress={cancelCountdown} activeOpacity={0.85}>
              <Text style={styles.cancelCountdownText}>Abbrechen</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Player Slots */}
      <View style={styles.slotsContainer}>
        <View style={styles.slotsGrid}>
          {slots.map((player, i) => (
            <Animated.View
              key={i}
              style={[
                styles.slotWrap,
                {
                  opacity: slotAnims[i].interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] }),
                  transform: [{
                    translateY: slotAnims[i].interpolate({ inputRange: [0, 1], outputRange: [-18, 0] }),
                  }],
                },
              ]}
            >
              <PlayerSlot
                player={player}
                style={styles.slot}
              />
              {isCreator && player && player.id !== currentUserId && (
                <TouchableOpacity style={styles.kickBtn} onPress={() => kickPlayer(player.id)} activeOpacity={0.85}>
                  <Text style={styles.kickBtnText}>✕</Text>
                </TouchableOpacity>
              )}
            </Animated.View>
          ))}
        </View>

        {!canStartGame && (
          <Animated.View style={[styles.waitingRow, {
            opacity: dotAnim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }),
          }]}>
            <Text style={styles.waitingText}>En attente de joueurs</Text>
            <Text style={styles.waitingDots}> {waitingDotsLabel}</Text>
          </Animated.View>
        )}

        {canStartGame && !countdownActive && (
          <Text style={styles.readyText}>✓ Mindestanzahl erreicht</Text>
        )}

        {/* Progress */}
        <View style={styles.progressContainer}>
          {Array.from({ length: MAX_PLAYERS }).map((_, i) => (
            <View
              key={i}
              style={[styles.progressDot, i < players.length && styles.progressDotFilled]}
            />
          ))}
          <Text style={styles.progressText}>{players.length}/4 joueurs</Text>
        </View>
      </View>

      {/* Chat */}
      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
          renderItem={({ item }) => (
            <View style={styles.messageRow}>
              <Text style={[styles.msgUser, item.user === 'Système' && styles.msgSystem]}>
                {item.user}:
              </Text>
              <Text style={styles.msgText}> {item.text}</Text>
            </View>
          )}
          style={styles.messageList}
        />
        <View style={styles.inputRow}>
          <TextInput
            style={styles.chatInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Message..."
            placeholderTextColor={COLORS.textMuted}
            onSubmitEditing={sendMessage}
            returnKeyType="send"
          />
          <TouchableOpacity style={styles.sendBtn} onPress={sendMessage} activeOpacity={0.85}>
            <Text style={styles.sendText}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <View style={styles.startSection}>
        <Animated.View style={[
          styles.startButtonWrapper,
          canPressStart && styles.startButtonWrapperActive,
          canPressStart && { transform: [{ scale: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.03] }) }] },
        ]}>
          <TouchableOpacity
            style={[styles.startBtn, canPressStart ? styles.startBtnActive : styles.startBtnDisabled]}
            disabled={!canPressStart}
            onPress={pressStartGame}
            activeOpacity={0.85}
          >
            <Text style={[styles.startBtnText, canPressStart ? styles.startBtnTextActive : styles.startBtnTextDisabled]}>
              {startButtonLabel}
            </Text>
          </TouchableOpacity>
        </Animated.View>
        <Text style={styles.startHint}>
          {isOfflineRoom ? 'Hobby-Raum: 2 Spieler reichen (du + Bot)' : 'Mindestens 3 Spieler erforderlich'}
        </Text>
      </View>

      <Modal
        transparent
        animationType="none"
        visible={showRulesModal}
        onRequestClose={closeRulesModal}
      >
        <View style={styles.modalBackdrop}>
          <Animated.View
            style={[
              styles.modalCard,
              {
                opacity: modalSlideAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
                transform: [{
                  translateY: modalSlideAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 80] }),
                }],
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🎴 Rami Tounsi - Regeln</Text>
              <TouchableOpacity onPress={closeRulesModal} style={styles.modalCloseBtn} activeOpacity={0.85}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalBody}>
              <Animated.View
                style={[
                  styles.ruleSection,
                  {
                    transform: [{
                      scale: sectionBounceAnims[0].interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }),
                    }],
                  },
                ]}
              >
                <Text style={styles.ruleHeading}>🎯 Ziel</Text>
                <Text style={styles.ruleText}>
                  Leg alle deine Karten ab. Wer zuerst keine Karten mehr hat, gewinnt.
                </Text>
              </Animated.View>

              <Animated.View
                style={[
                  styles.ruleSection,
                  {
                    transform: [{
                      scale: sectionBounceAnims[1].interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }),
                    }],
                  },
                ]}
              >
                <Text style={styles.ruleHeading}>🕹️ Spielablauf</Text>
                <Text style={styles.ruleBullet}>- Jeder Spieler bekommt 14 Karten</Text>
                <Text style={styles.ruleBullet}>
                  - Pro Zug: 1 Karte ziehen (Stapel oder Ablage) - Kombination legen (optional) - 1 Karte abwerfen
                </Text>
              </Animated.View>

              <Animated.View
                style={[
                  styles.ruleSection,
                  {
                    transform: [{
                      scale: sectionBounceAnims[2].interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }),
                    }],
                  },
                ]}
              >
                <Text style={styles.ruleHeading}>🔔 Meldungen</Text>
                <Text style={styles.ruleText}>🔹 Strasse (Sequenz): Mindestens 3 Karten hintereinander, gleiche Farbe</Text>
                <Text style={styles.ruleExample}>Beispiel: 5♠ 6♠ 7♠</Text>
                <Text style={[styles.ruleText, styles.ruleSpacing]}>
                  🔹 Satz (Gruppe): Mindestens 3 gleiche Werte, verschiedene Farben
                </Text>
                <Text style={styles.ruleExample}>Beispiel: 8♠ 8♥ 8♦</Text>
                <Text style={[styles.ruleText, styles.ruleSpacing]}>🔹 Joker ersetzt jede beliebige Karte</Text>
              </Animated.View>

              <Animated.View
                style={[
                  styles.ruleSection,
                  {
                    transform: [{
                      scale: sectionBounceAnims[3].interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }),
                    }],
                  },
                ]}
              >
                <Text style={styles.ruleHeading}>🚀 Erste Meldung</Text>
                <Text style={styles.ruleText}>
                  Du darfst erst auslegen, wenn deine erste Meldung mindestens 30 Punkte ergibt.
                </Text>
                <Text style={styles.ruleText}>Danach darfst du auch bei anderen Spielern anlegen.</Text>
              </Animated.View>

              <Animated.View
                style={[
                  styles.ruleSection,
                  {
                    transform: [{
                      scale: sectionBounceAnims[4].interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }),
                    }],
                  },
                ]}
              >
                <Text style={styles.ruleHeading}>🧮 Punkte</Text>
                <Text style={styles.ruleBullet}>- Zahlenkarten = ihr Wert</Text>
                <Text style={styles.ruleBullet}>- Bube/Dame/Koenig = 10 Punkte</Text>
                <Text style={styles.ruleBullet}>- Ass = 1 oder 11</Text>
                <Text style={styles.ruleBullet}>- Joker = 0 Punkte (gut!)</Text>
                <Text style={styles.ruleBullet}>- Uebrige Karten auf der Hand = Minuspunkte</Text>
              </Animated.View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.rememberBtn} onPress={rememberRules} activeOpacity={0.85}>
                <Text style={styles.rememberBtnText}>Regeln merken</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.playBtn} onPress={closeRulesModal} activeOpacity={0.85}>
                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.playBtnShimmer,
                    {
                      transform: [{
                        translateX: playBtnShimmer.interpolate({
                          inputRange: [-1, 1],
                          outputRange: [-120, 120],
                        }),
                      }],
                    },
                  ]}
                />
                <Text style={styles.playBtnText}>Spielen! ▶</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  errorBanner: {
    backgroundColor: '#8b1f1f',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#b24a4a',
  },
  errorBannerText: {
    color: '#ffe0e0',
    fontWeight: '600',
    fontSize: 12,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e3d20',
  },
  backBtn: { padding: 4 },
  backText: { color: '#e57373', fontWeight: 'bold' },
  roomName: { color: COLORS.gold, fontSize: 16, fontWeight: 'bold' },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  helpBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpText: {
    color: COLORS.gold,
    fontWeight: 'bold',
    fontSize: 16,
  },
  potBadge: {
    backgroundColor: COLORS.greenAccent,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  potText: { color: COLORS.white, fontWeight: 'bold', fontSize: 13 },
  countdownBanner: {
    backgroundColor: COLORS.gold,
    padding: 12,
    alignItems: 'center',
    gap: 8,
  },
  countdownText: { color: COLORS.black, fontWeight: 'bold', fontSize: 18 },
  countdownBigNumber: {
    color: COLORS.black,
    fontSize: 46,
    fontWeight: '900',
    lineHeight: 52,
  },
  cancelCountdownBtn: {
    backgroundColor: '#5a1f1f',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  cancelCountdownText: { color: COLORS.white, fontWeight: 'bold', fontSize: 12 },
  slotsContainer: {
    padding: 20,
    backgroundColor: COLORS.cardBackground,
    margin: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1e3d20',
    shadowColor: '#c9a02a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  slotsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  slotWrap: {
    width: '40%',
    position: 'relative',
  },
  slot: { width: '100%' },
  kickBtn: {
    position: 'absolute',
    top: -3,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#7a1d1d',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#b14b4b',
  },
  kickBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  waitingRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 4,
  },
  waitingText: { color: COLORS.textMuted, fontSize: 14 },
  waitingDots: { color: COLORS.gold, fontSize: 14 },
  readyText: { color: COLORS.greenAccent, textAlign: 'center', fontWeight: 'bold', fontSize: 15 },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
  },
  progressDot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: '#333',
  },
  progressDotFilled: { backgroundColor: COLORS.greenAccent },
  progressText: { color: COLORS.textMuted, fontSize: 12, marginLeft: 6 },
  chatContainer: { flex: 1, margin: 12 },
  messageList: {
    flex: 1,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: '#1e3d20',
    marginBottom: 8,
    shadowColor: '#c9a02a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 7,
    elevation: 4,
  },
  messageRow: { flexDirection: 'row', marginVertical: 3, flexWrap: 'wrap' },
  msgUser: { color: COLORS.gold, fontWeight: 'bold', fontSize: 12 },
  msgSystem: { color: COLORS.textMuted },
  msgText: { color: COLORS.textLight, fontSize: 12 },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chatInput: {
    flex: 1,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: COLORS.textLight,
    borderWidth: 1,
    borderColor: '#2a4a2a',
    fontSize: 14,
  },
  sendBtn: {
    backgroundColor: COLORS.gold,
    borderRadius: 10,
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendText: { color: COLORS.black, fontWeight: 'bold', fontSize: 18 },
  startSection: {
    alignItems: 'center',
    paddingBottom: 12,
    paddingTop: 6,
  },
  startButtonWrapper: {
    width: '80%',
    borderRadius: 14,
  },
  startButtonWrapperActive: {
    shadowColor: '#c9a02a',
    shadowOpacity: 0.45,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  startBtn: {
    width: '100%',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
  },
  startBtnDisabled: {
    backgroundColor: '#444',
  },
  startBtnActive: {
    backgroundColor: '#c9a02a',
  },
  startBtnText: {
    fontWeight: 'bold',
    fontSize: 15,
  },
  startBtnTextDisabled: {
    color: '#9a9a9a',
  },
  startBtnTextActive: {
    color: '#000000',
  },
  startHint: {
    marginTop: 8,
    color: COLORS.textMuted,
    fontSize: 12,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 540,
    maxHeight: '88%',
    backgroundColor: '#0d1f0f',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#c9a02a',
    overflow: 'hidden',
    shadowColor: '#c9a02a',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e3d20',
  },
  modalTitle: {
    color: '#c9a02a',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalCloseBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a2e1a',
  },
  modalCloseText: {
    color: COLORS.textLight,
    fontSize: 15,
    fontWeight: 'bold',
  },
  modalBody: {
    paddingHorizontal: 14,
    paddingTop: 12,
  },
  ruleSection: {
    marginBottom: 12,
  },
  ruleHeading: {
    color: '#c9a02a',
    fontWeight: 'bold',
    fontSize: 15,
    marginBottom: 4,
  },
  ruleText: {
    color: COLORS.textLight,
    fontSize: 13,
    lineHeight: 18,
  },
  ruleBullet: {
    color: COLORS.textLight,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 2,
  },
  ruleExample: {
    color: COLORS.greenAccent,
    fontSize: 13,
    marginTop: 2,
  },
  ruleSpacing: {
    marginTop: 6,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#1e3d20',
  },
  rememberBtn: {
    flex: 1,
    backgroundColor: '#1f3420',
    borderWidth: 1,
    borderColor: '#3a5a3a',
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
  },
  rememberBtnText: {
    color: COLORS.textLight,
    fontWeight: '600',
  },
  playBtn: {
    flex: 1,
    backgroundColor: '#c9a02a',
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
    overflow: 'hidden',
  },
  playBtnShimmer: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 58,
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  playBtnText: {
    color: '#0d1f0f',
    fontWeight: 'bold',
  },
});

export default GameRoomScreen;
