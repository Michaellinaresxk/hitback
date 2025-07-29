import { IconSymbol } from '@/components/ui/IconSymbol';
import { audioService } from '@/services/audioService';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface ConnectionDiagnosticsProps {
  visible: boolean;
  onClose: () => void;
}

interface DiagnosticResult {
  test: string;
  status: 'pending' | 'success' | 'warning' | 'error';
  message: string;
  details?: string;
  duration?: number;
}

export default function ConnectionDiagnostics({
  visible,
  onClose,
}: ConnectionDiagnosticsProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [connectionInfo, setConnectionInfo] = useState<any>(null);

  const diagnosticTests = [
    {
      name: 'Server Reachability',
      test: 'reachability',
      description: 'Check if server is reachable',
    },
    {
      name: 'Health Endpoint',
      test: 'health',
      description: 'Test /api/health endpoint',
    },
    {
      name: 'QR Validation',
      test: 'qr_validation',
      description: 'Test QR code validation',
    },
    {
      name: 'Track Listing',
      test: 'tracks',
      description: 'Test tracks endpoint',
    },
    {
      name: 'Sample QR Scan',
      test: 'sample_scan',
      description: 'Test QR scanning with sample code',
    },
  ];

  useEffect(() => {
    if (visible) {
      loadConnectionInfo();
    }
  }, [visible]);

  const loadConnectionInfo = async () => {
    try {
      const info = await audioService.getConnectionInfo();
      setConnectionInfo(info);
    } catch (error) {
      console.error('Failed to load connection info:', error);
    }
  };

  const runDiagnostics = async () => {
    setIsRunning(true);
    setResults([]);

    const testResults: DiagnosticResult[] = [];

    // Initialize all tests as pending
    diagnosticTests.forEach((test) => {
      testResults.push({
        test: test.name,
        status: 'pending',
        message: 'Running...',
      });
    });
    setResults([...testResults]);

    // Test 1: Server Reachability
    await runTest(testResults, 0, async () => {
      const startTime = Date.now();
      const serverUrl = audioService.getServerUrl();

      try {
        const response = await fetch(serverUrl, {
          method: 'GET',
          timeout: 5000,
        });
        const duration = Date.now() - startTime;

        if (response.ok) {
          return {
            status: 'success' as const,
            message: `Server is reachable (${duration}ms)`,
            details: `Status: ${response.status} ${response.statusText}`,
          };
        } else {
          return {
            status: 'warning' as const,
            message: `Server responded with status ${response.status}`,
            details: `This might still work for API endpoints`,
          };
        }
      } catch (error) {
        return {
          status: 'error' as const,
          message: 'Cannot reach server',
          details: `URL: ${serverUrl}\nError: ${error.message}`,
        };
      }
    });

    // Test 2: Health Endpoint
    await runTest(testResults, 1, async () => {
      const startTime = Date.now();
      try {
        const isHealthy = await audioService.testConnection();
        const duration = Date.now() - startTime;

        if (isHealthy) {
          return {
            status: 'success' as const,
            message: `Health check passed (${duration}ms)`,
            details: 'Backend is responding correctly',
          };
        } else {
          return {
            status: 'error' as const,
            message: 'Health check failed',
            details: 'Server is not responding with healthy status',
          };
        }
      } catch (error) {
        return {
          status: 'error' as const,
          message: 'Health endpoint error',
          details: error.message,
        };
      }
    });

    // Test 3: QR Validation
    await runTest(testResults, 2, async () => {
      const startTime = Date.now();
      try {
        const testQR = 'HITBACK_001_SONG_EASY';
        const isValid = await audioService.validateQRCode(testQR);
        const duration = Date.now() - startTime;

        return {
          status: isValid ? ('success' as const) : ('warning' as const),
          message: `QR validation ${
            isValid ? 'passed' : 'failed'
          } (${duration}ms)`,
          details: `Test QR: ${testQR}\nResult: ${
            isValid ? 'Valid' : 'Invalid'
          }`,
        };
      } catch (error) {
        return {
          status: 'error' as const,
          message: 'QR validation endpoint error',
          details: error.message,
        };
      }
    });

    // Test 4: Track Listing
    await runTest(testResults, 3, async () => {
      const startTime = Date.now();
      try {
        const tracks = await audioService.getAllTracks();
        const duration = Date.now() - startTime;

        if (Array.isArray(tracks) && tracks.length > 0) {
          return {
            status: 'success' as const,
            message: `Found ${tracks.length} tracks (${duration}ms)`,
            details: `First track: ${tracks[0]?.title || 'Unknown'}`,
          };
        } else {
          return {
            status: 'warning' as const,
            message: 'No tracks found',
            details: 'Endpoint works but no tracks in database',
          };
        }
      } catch (error) {
        return {
          status: 'error' as const,
          message: 'Tracks endpoint error',
          details: error.message,
        };
      }
    });

    // Test 5: Sample QR Scan
    await runTest(testResults, 4, async () => {
      const startTime = Date.now();
      try {
        const testQR = 'HITBACK_001_SONG_EASY';
        const result = await audioService.scanQRAndPlay(testQR);
        const duration = Date.now() - startTime;

        if (result.success) {
          return {
            status: 'success' as const,
            message: `QR scan successful (${duration}ms)`,
            details: `Track: ${result.data?.track?.title || 'Unknown'}\nType: ${
              result.data?.scan?.cardType || 'Unknown'
            }`,
          };
        } else {
          return {
            status: 'warning' as const,
            message: 'QR scan failed',
            details: result.error?.message || 'Unknown error',
          };
        }
      } catch (error) {
        return {
          status: 'error' as const,
          message: 'QR scan endpoint error',
          details: error.message,
        };
      }
    });

    setIsRunning(false);
  };

  const runTest = async (
    testResults: DiagnosticResult[],
    index: number,
    testFunction: () => Promise<Partial<DiagnosticResult>>
  ) => {
    try {
      const result = await testFunction();
      testResults[index] = {
        ...testResults[index],
        ...result,
        duration: result.duration || Date.now(),
      };
    } catch (error) {
      testResults[index] = {
        ...testResults[index],
        status: 'error',
        message: 'Test failed',
        details: error.message,
      };
    }

    setResults([...testResults]);
    // Small delay to show progress
    await new Promise((resolve) => setTimeout(resolve, 200));
  };

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success':
        return (
          <IconSymbol name='checkmark.circle.fill' size={20} color='#10B981' />
        );
      case 'warning':
        return (
          <IconSymbol
            name='exclamationmark.triangle.fill'
            size={20}
            color='#F59E0B'
          />
        );
      case 'error':
        return (
          <IconSymbol name='xmark.circle.fill' size={20} color='#EF4444' />
        );
      case 'pending':
        return <ActivityIndicator size='small' color='#6B7280' />;
    }
  };

  const getStatusColor = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success':
        return '#10B981';
      case 'warning':
        return '#F59E0B';
      case 'error':
        return '#EF4444';
      case 'pending':
        return '#6B7280';
    }
  };

  const generateRecommendations = () => {
    const errors = results.filter((r) => r.status === 'error').length;
    const warnings = results.filter((r) => r.status === 'warning').length;

    if (errors > 0) {
      return [
        '🔧 Check if server is running',
        '📡 Verify both devices are on same WiFi',
        '🔄 Try restarting both Expo and server',
        '📱 Check IP address in audioService.ts',
      ];
    } else if (warnings > 0) {
      return [
        '⚠️ Some features may not work properly',
        '📋 Check backend database content',
        '🎵 Verify audio files are available',
      ];
    } else {
      return [
        '✅ Connection is working well!',
        '🎮 You can start playing the game',
      ];
    }
  };

  return (
    <Modal
      visible={visible}
      animationType='slide'
      presentationStyle='formSheet'
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>🔧 Connection Diagnostics</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <IconSymbol name='xmark' size={24} color='#64748B' />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Connection Info */}
          {connectionInfo && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📱 Connection Information</Text>
              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Server URL:</Text>
                  <Text style={styles.infoValue}>
                    {connectionInfo.serverUrl}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Dev Mode:</Text>
                  <Text style={styles.infoValue}>
                    {connectionInfo.isExpoDevMode ? 'Yes' : 'No'}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Host URI:</Text>
                  <Text style={styles.infoValue}>
                    {connectionInfo.expoHostUri || 'Not available'}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Run Diagnostics Button */}
          <TouchableOpacity
            style={[styles.runButton, isRunning && styles.runButtonDisabled]}
            onPress={runDiagnostics}
            disabled={isRunning}
          >
            {isRunning ? (
              <ActivityIndicator size='small' color='#FFFFFF' />
            ) : (
              <IconSymbol name='play.circle.fill' size={20} color='#FFFFFF' />
            )}
            <Text style={styles.runButtonText}>
              {isRunning ? 'Running Diagnostics...' : 'Run Diagnostics'}
            </Text>
          </TouchableOpacity>

          {/* Results */}
          {results.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🧪 Test Results</Text>
              {results.map((result, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.resultCard}
                  onPress={() => {
                    if (result.details) {
                      Alert.alert(result.test, result.details);
                    }
                  }}
                >
                  <View style={styles.resultHeader}>
                    {getStatusIcon(result.status)}
                    <Text style={styles.resultTitle}>{result.test}</Text>
                  </View>
                  <Text
                    style={[
                      styles.resultMessage,
                      { color: getStatusColor(result.status) },
                    ]}
                  >
                    {result.message}
                  </Text>
                  {result.details && (
                    <Text style={styles.resultDetails} numberOfLines={2}>
                      {result.details}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Recommendations */}
          {results.length > 0 && !isRunning && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>💡 Recommendations</Text>
              <View style={styles.recommendationsCard}>
                {generateRecommendations().map((rec, index) => (
                  <Text key={index} style={styles.recommendation}>
                    {rec}
                  </Text>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '600',
    maxWidth: '60%',
    textAlign: 'right',
  },
  runButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginVertical: 16,
  },
  runButtonDisabled: {
    backgroundColor: '#94A3B8',
  },
  runButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  resultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginLeft: 12,
  },
  resultMessage: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  resultDetails: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
  },
  recommendationsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  recommendation: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
    lineHeight: 20,
  },
});
