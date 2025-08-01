import React, { useEffect, useState } from 'react';
import { audioService } from '../services/audioService';

interface DiagnosticResult {
  test: string;
  status: 'pending' | 'success' | 'warning' | 'error';
  message: string;
  details?: string;
  duration?: number;
}

export default function BackendDiagnostic() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [connectionInfo, setConnectionInfo] = useState<any>(null);

  useEffect(() => {
    loadConnectionInfo();
  }, []);

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

    const tests = [
      'Backend Health Check',
      'Tracks API Test',
      'QR Validation Test',
      'Audio Endpoint Test',
      'Full QR Scan Test',
    ];

    // Initialize all tests as pending
    const testResults: DiagnosticResult[] = tests.map((test) => ({
      test,
      status: 'pending',
      message: 'Running...',
    }));
    setResults([...testResults]);

    // Test 1: Backend Health
    await runTest(testResults, 0, async () => {
      const startTime = Date.now();
      try {
        const isHealthy = await audioService.testConnection();
        const duration = Date.now() - startTime;

        return {
          status: isHealthy ? ('success' as const) : ('error' as const),
          message: `Backend ${
            isHealthy ? 'is healthy' : 'is not responding'
          } (${duration}ms)`,
          details: isHealthy
            ? 'Server responded with healthy status'
            : 'Server did not respond or returned error',
        };
      } catch (error) {
        return {
          status: 'error' as const,
          message: 'Backend connection failed',
          details: error.message,
        };
      }
    });

    // Test 2: Tracks API
    await runTest(testResults, 1, async () => {
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
            message: 'No tracks found in backend',
            details: 'API works but database is empty',
          };
        }
      } catch (error) {
        return {
          status: 'error' as const,
          message: 'Tracks API failed',
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
          details: `Test QR: ${testQR} - ${
            isValid ? 'Valid' : 'Invalid or track not found'
          }`,
        };
      } catch (error) {
        return {
          status: 'error' as const,
          message: 'QR validation endpoint failed',
          details: error.message,
        };
      }
    });

    // Test 4: Audio Endpoint
    await runTest(testResults, 3, async () => {
      const startTime = Date.now();
      try {
        // Test if we can reach audio endpoint
        const serverUrl =
          connectionInfo?.serverUrl || 'http://192.168.1.10:3000';
        const testAudioUrl = `${serverUrl}/audio/tracks/001_despacito.mp3`;

        const response = await fetch(testAudioUrl, { method: 'HEAD' });
        const duration = Date.now() - startTime;

        if (response.ok) {
          return {
            status: 'success' as const,
            message: `Audio endpoint working (${duration}ms)`,
            details: `Audio files are being served correctly`,
          };
        } else {
          return {
            status: 'warning' as const,
            message: `Audio endpoint returned ${response.status}`,
            details: 'Audio files may not be available',
          };
        }
      } catch (error) {
        return {
          status: 'error' as const,
          message: 'Audio endpoint failed',
          details: error.message,
        };
      }
    });

    // Test 5: Full QR Scan
    await runTest(testResults, 4, async () => {
      const startTime = Date.now();
      try {
        const testQR = 'HITBACK_001_SONG_EASY';
        const scanResult = await audioService.scanQRAndPlay(testQR);
        const duration = Date.now() - startTime;

        if (scanResult.success && scanResult.data) {
          return {
            status: 'success' as const,
            message: `Full QR scan successful (${duration}ms)`,
            details: `Track: ${scanResult.data.track.title}\nQuestion: ${scanResult.data.question.question}`,
          };
        } else {
          return {
            status: 'warning' as const,
            message: 'QR scan failed',
            details: scanResult.error?.message || 'Unknown scan error',
          };
        }
      } catch (error) {
        return {
          status: 'error' as const,
          message: 'Full QR scan failed',
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
    await new Promise((resolve) => setTimeout(resolve, 300));
  };

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      case 'pending':
        return '⏳';
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
        '🔧 Check if backend server is running on port 3000',
        '📡 Verify both devices are on same WiFi network',
        '🔄 Try restarting both Expo and backend server',
        '📱 Update IP address in audioService.ts',
        '📂 Ensure data/tracks.json exists in backend',
      ];
    } else if (warnings > 0) {
      return [
        '⚠️ Some features may not work properly',
        '📋 Check backend tracks database content',
        '🎵 Add MP3 files to backend/public/audio/tracks/',
        '📄 Verify tracks.json structure in backend',
      ];
    } else {
      return [
        '✅ Connection is working perfectly!',
        '🎮 All game features should work correctly',
        '🎵 Audio streaming is operational',
        '🎯 Ready to start playing HITBACK!',
      ];
    }
  };

  return (
    <div className='max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg'>
      {/* Header */}
      <div className='mb-6'>
        <h1 className='text-3xl font-bold text-gray-900 mb-2'>
          🔧 Backend Connection Diagnostics
        </h1>
        <p className='text-gray-600'>
          Verify that your HITBACK frontend can communicate with the backend
          server
        </p>
      </div>

      {/* Connection Info */}
      {connectionInfo && (
        <div className='mb-6 p-4 bg-gray-50 rounded-lg'>
          <h2 className='text-lg font-semibold mb-3'>
            📱 Connection Information
          </h2>
          <div className='grid grid-cols-2 gap-4 text-sm'>
            <div>
              <span className='font-medium'>Server URL:</span>
              <span className='ml-2 font-mono text-blue-600'>
                {connectionInfo.serverUrl}
              </span>
            </div>
            <div>
              <span className='font-medium'>Dev Mode:</span>
              <span className='ml-2'>
                {connectionInfo.isExpoDevMode ? 'Yes' : 'No'}
              </span>
            </div>
            <div>
              <span className='font-medium'>Backend Connected:</span>
              <span
                className={`ml-2 font-medium ${
                  connectionInfo.backendConnected
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}
              >
                {connectionInfo.backendConnected ? 'Yes' : 'No'}
              </span>
            </div>
            <div>
              <span className='font-medium'>Tracks Available:</span>
              <span className='ml-2'>
                {connectionInfo.tracksAvailable || 0}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Run Diagnostics Button */}
      <div className='mb-6'>
        <button
          onClick={runDiagnostics}
          disabled={isRunning}
          className={`w-full py-3 px-6 rounded-lg font-medium text-white ${
            isRunning
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600'
          }`}
        >
          {isRunning
            ? '⏳ Running Diagnostics...'
            : '🧪 Run Backend Diagnostics'}
        </button>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className='mb-6'>
          <h2 className='text-lg font-semibold mb-4'>🧪 Test Results</h2>
          <div className='space-y-3'>
            {results.map((result, index) => (
              <div
                key={index}
                className='p-4 border rounded-lg hover:shadow-sm transition-shadow'
                style={{ borderColor: getStatusColor(result.status) + '40' }}
              >
                <div className='flex items-center justify-between mb-2'>
                  <div className='flex items-center'>
                    <span className='text-xl mr-3'>
                      {getStatusIcon(result.status)}
                    </span>
                    <span className='font-medium text-gray-900'>
                      {result.test}
                    </span>
                  </div>
                </div>
                <p
                  className='text-sm font-medium mb-1'
                  style={{ color: getStatusColor(result.status) }}
                >
                  {result.message}
                </p>
                {result.details && (
                  <p className='text-xs text-gray-600 bg-gray-50 p-2 rounded mt-2'>
                    {result.details}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {results.length > 0 && !isRunning && (
        <div className='mb-6'>
          <h2 className='text-lg font-semibold mb-4'>💡 Recommendations</h2>
          <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
            {generateRecommendations().map((rec, index) => (
              <div key={index} className='flex items-start mb-2 last:mb-0'>
                <span className='text-blue-600 mr-2'>•</span>
                <span className='text-sm text-blue-800'>{rec}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Backend Architecture Info */}
      <div className='bg-green-50 border border-green-200 rounded-lg p-4'>
        <h3 className='font-semibold text-green-800 mb-2'>
          ✅ Clean Architecture Achieved
        </h3>
        <div className='text-sm text-green-700 space-y-1'>
          <p>• Frontend eliminates all hardcoded data</p>
          <p>• All tracks, questions, and audio come from backend</p>
          <p>• QR scanning processed server-side</p>
          <p>• Audio streamed directly from backend</p>
          <p>• Single source of truth in backend database</p>
        </div>
      </div>
    </div>
  );
}
