import { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  PanResponder,
  LayoutChangeEvent,
} from 'react-native';
import { Colors } from '@/constants/colors';

interface CustomSliderProps {
  minimumValue: number;
  maximumValue: number;
  step?: number;
  value: number;
  onValueChange: (value: number) => void;
}

export function CustomSlider({
  minimumValue,
  maximumValue,
  step = 1,
  value,
  onValueChange,
}: CustomSliderProps) {
  const [trackWidth, setTrackWidth] = useState(0);
  const trackWidthRef = useRef(0);
  const valueRef = useRef(value);
  valueRef.current = value;

  const fraction = (value - minimumValue) / (maximumValue - minimumValue);
  const thumbLeft = fraction * trackWidth;

  const snap = (raw: number) => {
    const clamped = Math.min(maximumValue, Math.max(minimumValue, raw));
    if (step <= 0) return clamped;
    return Math.round((clamped - minimumValue) / step) * step + minimumValue;
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const x = evt.nativeEvent.locationX;
        const ratio = x / trackWidthRef.current;
        const raw = minimumValue + ratio * (maximumValue - minimumValue);
        onValueChange(snap(raw));
      },
      onPanResponderMove: (_, gestureState) => {
        const currentFraction =
          (valueRef.current - minimumValue) / (maximumValue - minimumValue);
        const currentX = currentFraction * trackWidthRef.current;
        const newX = currentX + gestureState.dx;
        const ratio = newX / trackWidthRef.current;
        const raw = minimumValue + ratio * (maximumValue - minimumValue);
        const snapped = snap(raw);
        if (snapped !== valueRef.current) {
          onValueChange(snapped);
        }
      },
    }),
  ).current;

  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    setTrackWidth(w);
    trackWidthRef.current = w;
  };

  return (
    <View style={styles.container} onLayout={onLayout} {...panResponder.panHandlers}>
      {/* Background track */}
      <View style={styles.track}>
        {/* Filled track */}
        <View
          style={[
            styles.trackFilled,
            { width: trackWidth > 0 ? thumbLeft : 0 },
          ]}
        />
      </View>
      {/* Thumb */}
      {trackWidth > 0 && (
        <View
          style={[
            styles.thumb,
            { left: thumbLeft - 14 },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 40,
    justifyContent: 'center',
  },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.surfaceLight,
    overflow: 'hidden',
  },
  trackFilled: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  thumb: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    borderWidth: 3,
    borderColor: Colors.background,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
});
