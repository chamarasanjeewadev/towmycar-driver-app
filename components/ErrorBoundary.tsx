import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Colors } from '@/constants/colors';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error.message, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container}>
          <View style={styles.card}>
            <Text style={styles.icon}>!</Text>
            <Text style={styles.title}>Something went wrong</Text>
            <ScrollView style={styles.errorScroll} nestedScrollEnabled>
              <Text style={styles.errorText}>
                {this.state.error?.message ?? 'An unexpected error occurred.'}
              </Text>
            </ScrollView>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={this.handleReset}
              activeOpacity={0.7}
            >
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
    borderWidth: 1,
    borderColor: Colors.error + '33',
  },
  icon: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.error,
    width: 52,
    height: 52,
    lineHeight: 52,
    textAlign: 'center',
    backgroundColor: Colors.error + '18',
    borderRadius: 26,
    marginBottom: 16,
    overflow: 'hidden',
  },
  title: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  errorScroll: {
    maxHeight: 80,
    marginBottom: 20,
    width: '100%',
  },
  errorText: {
    color: Colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingHorizontal: 32,
    paddingVertical: 12,
  },
  retryText: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
});
