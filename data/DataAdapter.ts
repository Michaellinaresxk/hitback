// 🏗️ TIPOS BACKEND (lo que viene del servidor)
interface BackendTrackData {
  scan: {
    qrCode: string;
    timestamp: string;
    points: number;
    difficulty: string;
    processingTime: number;
  };
  track: {
    id: string;
    title: string;
    artist: string;
    album: string;
    year: number;
    genre: string;
    difficulty: string;
  };
  question: {
    type: string;
    question: string;
    answer: string;
    points: number;
    hints: string[];
  };
  audio: {
    hasAudio: boolean;
    url: string;
    duration: number;
  };
}

// 🎯 TIPOS FRONTEND (lo que espera tu CardDisplay)
interface FrontendCard {
  id: string;
  type: 'SONG' | 'ARTIST' | 'DECADE' | 'LYRICS' | 'CHALLENGE';
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  question: string;
  answer: string;
  points: number;
  hints: string[];
  color: string;
  track: {
    id: string;
    title: string;
    artist: string;
    album: string;
    year: number;
    genre: string;
  };
  audio?: {
    hasAudio: boolean;
    url: string;
    duration: number;
  };
}

// 🔄 DATA ADAPTER CLASS
class DataAdapter {
  // 🎨 COLORES POR TIPO DE PREGUNTA
  private static readonly TYPE_COLORS = {
    song: '#10B981', // Verde
    artist: '#3B82F6', // Azul
    decade: '#F59E0B', // Amarillo
    lyrics: '#8B5CF6', // Púrpura
    challenge: '#EF4444', // Rojo
  };

  // 🔄 CONVERTIR BACKEND DATA A FRONTEND CARD
  static backendToCard(backendData: BackendTrackData): FrontendCard {
    try {
      console.log('🔄 Converting backend data to frontend card...');
      console.log('📦 Input data:', JSON.stringify(backendData, null, 2));

      // Validar datos de entrada
      if (!backendData || !backendData.track || !backendData.question) {
        throw new Error('Invalid backend data structure');
      }

      const { track, question, audio, scan } = backendData;

      // Normalizar tipo de pregunta
      const normalizedType = this.normalizeQuestionType(question.type);

      // Normalizar dificultad
      const normalizedDifficulty = this.normalizeDifficulty(scan.difficulty);

      // Construir card
      const card: FrontendCard = {
        id: `${track.id}_${question.type}_${scan.difficulty}`,
        type: normalizedType,
        difficulty: normalizedDifficulty,
        question: question.question || 'Pregunta no disponible',
        answer: question.answer || 'Respuesta no disponible',
        points: question.points || 1,
        hints: question.hints || [],
        color: this.TYPE_COLORS[question.type] || '#64748B',
        track: {
          id: track.id,
          title: track.title || 'Título desconocido',
          artist: track.artist || 'Artista desconocido',
          album: track.album || 'Álbum desconocido',
          year: track.year || 2024,
          genre: track.genre || 'Género desconocido',
        },
        audio: audio
          ? {
              hasAudio: audio.hasAudio,
              url: audio.url,
              duration: audio.duration,
            }
          : undefined,
      };

      console.log('✅ Card converted successfully:');
      console.log('🎯 Type:', card.type);
      console.log('🎵 Track:', card.track.title);
      console.log('❓ Question:', card.question);
      console.log('🎨 Color:', card.color);

      return card;
    } catch (error) {
      console.error('❌ Data conversion failed:', error);

      // Retornar card por defecto en caso de error
      return this.createDefaultCard(backendData);
    }
  }

  // 🔄 NORMALIZAR TIPO DE PREGUNTA
  private static normalizeQuestionType(
    type: string
  ): 'SONG' | 'ARTIST' | 'DECADE' | 'LYRICS' | 'CHALLENGE' {
    if (!type) return 'SONG';

    const normalizedType = type.toUpperCase();

    switch (normalizedType) {
      case 'SONG':
        return 'SONG';
      case 'ARTIST':
        return 'ARTIST';
      case 'DECADE':
        return 'DECADE';
      case 'LYRICS':
        return 'LYRICS';
      case 'CHALLENGE':
        return 'CHALLENGE';
      default:
        console.warn(`⚠️ Unknown question type: ${type}, defaulting to SONG`);
        return 'SONG';
    }
  }

  // 🔄 NORMALIZAR DIFICULTAD
  private static normalizeDifficulty(
    difficulty: string
  ): 'EASY' | 'MEDIUM' | 'HARD' {
    if (!difficulty) return 'EASY';

    const normalizedDifficulty = difficulty.toUpperCase();

    switch (normalizedDifficulty) {
      case 'EASY':
        return 'EASY';
      case 'MEDIUM':
        return 'MEDIUM';
      case 'HARD':
        return 'HARD';
      default:
        console.warn(
          `⚠️ Unknown difficulty: ${difficulty}, defaulting to EASY`
        );
        return 'EASY';
    }
  }

  // 🆘 CREAR CARD POR DEFECTO
  private static createDefaultCard(backendData?: any): FrontendCard {
    console.log('🆘 Creating default card due to conversion error');

    return {
      id: 'default_001',
      type: 'SONG',
      difficulty: 'EASY',
      question: '¿Cuál es la canción?',
      answer: backendData?.track?.title || 'Canción desconocida',
      points: 1,
      hints: ['Escucha atentamente', 'Piensa en el título'],
      color: '#10B981',
      track: {
        id: backendData?.track?.id || '001',
        title: backendData?.track?.title || 'Canción desconocida',
        artist: backendData?.track?.artist || 'Artista desconocido',
        album: backendData?.track?.album || 'Álbum desconocido',
        year: backendData?.track?.year || 2024,
        genre: backendData?.track?.genre || 'Pop',
      },
      audio: backendData?.audio
        ? {
            hasAudio: backendData.audio.hasAudio,
            url: backendData.audio.url,
            duration: backendData.audio.duration,
          }
        : undefined,
    };
  }

  // 🧪 VALIDAR ESTRUCTURA DE CARD
  static validateCard(card: FrontendCard): boolean {
    try {
      const requiredFields = [
        'id',
        'type',
        'difficulty',
        'question',
        'answer',
        'points',
        'color',
        'track',
      ];

      for (const field of requiredFields) {
        if (card[field] === undefined || card[field] === null) {
          console.error(`❌ Card validation failed: missing field '${field}'`);
          return false;
        }
      }

      // Validar track
      if (!card.track.id || !card.track.title || !card.track.artist) {
        console.error('❌ Card validation failed: incomplete track data');
        return false;
      }

      console.log('✅ Card validation passed');
      return true;
    } catch (error) {
      console.error('❌ Card validation error:', error);
      return false;
    }
  }

  // 🎨 OBTENER COLOR POR TIPO
  static getColorForType(type: string): string {
    return this.TYPE_COLORS[type?.toLowerCase()] || '#64748B';
  }

  // 🔄 BATCH CONVERSION (para múltiples cards)
  static backendToCards(backendDataArray: BackendTrackData[]): FrontendCard[] {
    return backendDataArray.map((data) => this.backendToCard(data));
  }
}

export { DataAdapter, type BackendTrackData, type FrontendCard };
