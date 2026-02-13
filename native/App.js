import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Svg, Rect, Polygon } from 'react-native-svg';
import { useWhiteNoise } from './hooks/useWhiteNoise';

const NOISE_TYPES = [
  { value: 'white', label: 'White', description: 'All frequencies equal' },
  { value: 'pink', label: 'Pink', description: 'Balanced, natural' },
  { value: 'brown', label: 'Brown', description: 'Deep, rumbling' },
  { value: 'blue', label: 'Blue', description: 'Bright, crisp' },
];

function PlayIcon() {
  return (
    <Svg width={50} height={50} viewBox="0 0 24 24" fill="#4a9eff">
      <Polygon points="5,3 19,12 5,21" />
    </Svg>
  );
}

function PauseIcon() {
  return (
    <Svg width={50} height={50} viewBox="0 0 24 24" fill="#ff6b6b">
      <Rect x="6" y="4" width="4" height="16" />
      <Rect x="14" y="4" width="4" height="16" />
    </Svg>
  );
}

export default function App() {
  const { isPlaying, isLoading, toggle, noiseType, changeNoiseType } = useWhiteNoise();

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Text style={styles.title}>Colored Noise</Text>

      <View style={styles.noiseSelector}>
        {NOISE_TYPES.map((type) => (
          <TouchableOpacity
            key={type.value}
            style={[
              styles.noiseButton,
              noiseType === type.value && styles.noiseButtonActive,
            ]}
            onPress={() => changeNoiseType(type.value)}
            disabled={isLoading}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.noiseLabel,
                noiseType === type.value && styles.noiseLabelActive,
              ]}
            >
              {type.label}
            </Text>
            <Text
              style={[
                styles.noiseDescription,
                noiseType === type.value && styles.noiseDescriptionActive,
              ]}
            >
              {type.description}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[
          styles.playButton,
          isPlaying && styles.playButtonPlaying,
          isLoading && styles.playButtonLoading,
        ]}
        onPress={toggle}
        disabled={isLoading}
        activeOpacity={0.8}
      >
        {isLoading ? (
          <ActivityIndicator size="large" color="#4a9eff" />
        ) : isPlaying ? (
          <PauseIcon />
        ) : (
          <PlayIcon />
        )}
      </TouchableOpacity>

      <Text style={styles.status}>
        {isLoading ? 'Generating...' : isPlaying ? 'Playing' : 'Tap to play'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '300',
    letterSpacing: 2,
    color: '#e0e0e0',
    marginBottom: 30,
  },
  noiseSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    maxWidth: 400,
    marginBottom: 40,
    gap: 10,
  },
  noiseButton: {
    width: '47%',
    minHeight: 80,
    borderWidth: 2,
    borderColor: '#444',
    borderRadius: 12,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  noiseButtonActive: {
    borderColor: '#4a9eff',
    backgroundColor: 'rgba(74, 158, 255, 0.15)',
  },
  noiseLabel: {
    fontSize: 18,
    fontWeight: '500',
    color: '#888',
    marginBottom: 4,
    letterSpacing: 1,
  },
  noiseLabelActive: {
    color: '#4a9eff',
  },
  noiseDescription: {
    fontSize: 12,
    color: '#666',
    letterSpacing: 0.5,
  },
  noiseDescriptionActive: {
    color: '#4a9eff',
    opacity: 0.8,
  },
  playButton: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 3,
    borderColor: '#4a9eff',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButtonPlaying: {
    borderColor: '#ff6b6b',
  },
  playButtonLoading: {
    opacity: 0.7,
  },
  status: {
    marginTop: 40,
    fontSize: 16,
    color: '#888',
    letterSpacing: 1,
  },
});
