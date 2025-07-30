import { IconSymbol } from '@/components/ui/IconSymbol';
import React, { useState } from 'react';
import {
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
