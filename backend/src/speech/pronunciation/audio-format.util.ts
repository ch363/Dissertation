export type DetectedAudioContainer =
  | 'wav'
  | 'caf'
  | 'flac'
  | 'ogg'
  | 'mp3'
  | 'mp4'
  | 'unknown';

function ascii(buf: Buffer, start: number, end: number): string {
  return buf.subarray(start, end).toString('ascii');
}

export function detectAudioContainer(bytes: Buffer): DetectedAudioContainer {
  if (!bytes || bytes.length < 4) return 'unknown';

  // WAV: RIFF .... WAVE
  if (bytes.length >= 12) {
    const riff = ascii(bytes, 0, 4);
    const wave = ascii(bytes, 8, 12);
    if ((riff === 'RIFF' || riff === 'RIFX') && wave === 'WAVE') return 'wav';
  }

  // CAF (Core Audio Format): 'caff'
  if (ascii(bytes, 0, 4) === 'caff') return 'caf';

  // FLAC: 'fLaC'
  if (ascii(bytes, 0, 4) === 'fLaC') return 'flac';

  // OGG: 'OggS'
  if (ascii(bytes, 0, 4) === 'OggS') return 'ogg';

  // MP3: 'ID3' (tagged) or frame sync 0xFF 0xFB/0xF3/0xF2...
  if (ascii(bytes, 0, 3) === 'ID3') return 'mp3';
  if (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0) return 'mp3';

  // MP4/M4A: '....ftyp'
  if (bytes.length >= 8 && ascii(bytes, 4, 8) === 'ftyp') return 'mp4';

  return 'unknown';
}

export function looksLikeRawPcm16le(bytes: Buffer): boolean {
  // Heuristic: if it's not a known container, we assume it's raw PCM.
  // This matches what happens when the client records linear PCM but the
  // container/header is missing or stripped.
  return detectAudioContainer(bytes) === 'unknown';
}

export type ParsedWavPcm = {
  pcmData: Buffer;
  sampleRateHz: number;
  channels: number;
  bitsPerSample: number;
};

function readU32LE(buf: Buffer, offset: number): number {
  return buf.readUInt32LE(offset);
}

function readU16LE(buf: Buffer, offset: number): number {
  return buf.readUInt16LE(offset);
}

/**
 * Minimal WAV parser that tolerates chunk re-ordering (e.g. JUNK/LIST before fmt).
 * Only supports RIFF/WAVE PCM (format=1) and returns the raw PCM data bytes.
 */
export function parseWavPcm(bytes: Buffer): ParsedWavPcm {
  if (!bytes || bytes.length < 12) {
    throw new Error('WAV too small');
  }
  const riff = ascii(bytes, 0, 4);
  const wave = ascii(bytes, 8, 12);
  if (riff !== 'RIFF' || wave !== 'WAVE') {
    throw new Error('Not a RIFF/WAVE WAV');
  }

  let offset = 12;
  let fmt: { audioFormat: number; channels: number; sampleRateHz: number; bitsPerSample: number } | null =
    null;
  let data: Buffer | null = null;

  while (offset + 8 <= bytes.length) {
    const chunkId = ascii(bytes, offset, offset + 4);
    const chunkSize = readU32LE(bytes, offset + 4);
    const chunkDataStart = offset + 8;
    const chunkDataEnd = chunkDataStart + chunkSize;

    if (chunkDataEnd > bytes.length) {
      throw new Error('Invalid WAV chunk size');
    }

    if (chunkId === 'fmt ') {
      if (chunkSize < 16) {
        throw new Error('Invalid fmt chunk');
      }
      const audioFormat = readU16LE(bytes, chunkDataStart);
      const channels = readU16LE(bytes, chunkDataStart + 2);
      const sampleRateHz = readU32LE(bytes, chunkDataStart + 4);
      const bitsPerSample = readU16LE(bytes, chunkDataStart + 14);

      fmt = { audioFormat, channels, sampleRateHz, bitsPerSample };
    } else if (chunkId === 'data') {
      data = bytes.subarray(chunkDataStart, chunkDataEnd);
    }

    // Chunks are padded to even sizes.
    offset = chunkDataEnd + (chunkSize % 2);

    if (fmt && data) break;
  }

  if (!fmt) {
    throw new Error('WAV fmt chunk not found');
  }
  if (!data) {
    throw new Error('WAV data chunk not found');
  }

  // Only support PCM 16-bit for now.
  if (fmt.audioFormat !== 1) {
    throw new Error(`Unsupported WAV audioFormat=${fmt.audioFormat} (expected PCM=1)`);
  }
  if (fmt.bitsPerSample !== 16) {
    throw new Error(`Unsupported WAV bitsPerSample=${fmt.bitsPerSample} (expected 16)`);
  }
  if (fmt.channels < 1 || fmt.channels > 2) {
    throw new Error(`Unsupported WAV channels=${fmt.channels}`);
  }
  if (fmt.sampleRateHz < 8000 || fmt.sampleRateHz > 48000) {
    throw new Error(`Unsupported WAV sampleRateHz=${fmt.sampleRateHz}`);
  }

  return {
    pcmData: data,
    sampleRateHz: fmt.sampleRateHz,
    channels: fmt.channels,
    bitsPerSample: fmt.bitsPerSample,
  };
}

