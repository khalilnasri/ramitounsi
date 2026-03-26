import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import PlayingCard from './PlayingCard';
import { COLORS } from '../utils/constants';
import { isValidCombination } from '../game/rules';

const CombinationZone = ({ combinations = [], onAddToCombo, selectedCards = [] }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Combinaisons sur la table</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {combinations.map((combo, idx) => {
          const canAdd =
            selectedCards.length > 0 && isValidCombination([...combo, ...selectedCards]);
          return (
            <TouchableOpacity
              key={idx}
              style={[styles.combo, canAdd && styles.comboHighlight]}
              onPress={() => canAdd && onAddToCombo && onAddToCombo(idx)}
              activeOpacity={canAdd ? 0.7 : 1}
            >
              {combo.map((card) => (
                <PlayingCard key={card.id} card={card} small style={styles.comboCard} />
              ))}
              {canAdd && (
                <View style={styles.addBadge}>
                  <Text style={styles.addText}>+</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
        {combinations.length === 0 && (
          <Text style={styles.empty}>Aucune combinaison posée</Text>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 10,
    padding: 8,
    marginVertical: 4,
  },
  title: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginBottom: 6,
  },
  combo: {
    flexDirection: 'row',
    backgroundColor: 'rgba(46,125,50,0.3)',
    borderRadius: 8,
    padding: 4,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.greenAccent,
  },
  comboHighlight: {
    borderColor: COLORS.gold,
    backgroundColor: 'rgba(201,160,42,0.15)',
  },
  comboCard: {
    marginHorizontal: 2,
  },
  addBadge: {
    backgroundColor: COLORS.gold,
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginLeft: 4,
  },
  addText: {
    color: COLORS.black,
    fontWeight: 'bold',
    fontSize: 14,
  },
  empty: {
    color: COLORS.textMuted,
    fontStyle: 'italic',
    fontSize: 12,
    paddingVertical: 8,
  },
});

export default CombinationZone;
