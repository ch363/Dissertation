import { BadRequestException } from '@nestjs/common';

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

  if (bytes.length >= 12) {
    const riff = ascii(bytes, 0, 4);
    const wave = ascii(bytes, 8, 12);
    if ((riff === 'RIFF' || riff === 'RIFX') && wave === 'WAVE') return 'wav';
  }

  if (ascii(bytes, 0, 4) === 'caff') return 'caf';
  if (ascii(bytes, 0, 4) === 'fLaC') return 'flac';
  if (ascii(bytes, 0, 4) === 'OggS') return 'ogg';
  if (ascii(bytes, 0, 3) === 'ID3') return 'mp3';
  if (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0) return 'mp3';
  if (bytes.length >= 8 && ascii(bytes, 4, 8) === 'ftyp') return 'mp4';

  return 'unknown';
}

export function looksLikeRawPcm16le(bytes: Buffer): boolean {
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

export function parseWavPcm(bytes: Buffer): ParsedWavPcm {
  if (!bytes || bytes.length < 12) {
    throw new BadRequestException('WAV file too small');
  }
  const riff = ascii(bytes, 0, 4);
  const wave = ascii(bytes, 8, 12);
  if (riff !== 'RIFF' || wave !== 'WAVE') {
    throw new BadRequestException('Not a valid RIFF/WAVE WAV file');
  }

  let offset = 12;
  let fmt: {
    audioFormat: number;
    channels: number;
    sampleRateHz: number;
    bitsPerSample: number;
  } | null = null;
  let data: Buffer | null = null;

  while (offset + 8 <= bytes.length) {
    const chunkId = ascii(bytes, offset, offset + 4);
    const chunkSize = readU32LE(bytes, offset + 4);
    const chunkDataStart = offset + 8;
    const chunkDataEnd = chunkDataStart + chunkSize;

    if (chunkDataEnd > bytes.length) {
      throw new BadRequestException('Invalid WAV chunk size');
    }

    if (chunkId === 'fmt ') {
      if (chunkSize < 16) {
        throw new BadRequestException('Invalid WAV fmt chunk');
      }
      const audioFormat = readU16LE(bytes, chunkDataStart);
      const channels = readU16LE(bytes, chunkDataStart + 2);
      const sampleRateHz = readU32LE(bytes, chunkDataStart + 4);
      const bitsPerSample = readU16LE(bytes, chunkDataStart + 14);

      fmt = { audioFormat, channels, sampleRateHz, bitsPerSample };
    } else if (chunkId === 'data') {
      data = bytes.subarray(chunkDataStart, chunkDataEnd);
    }

    offset = chunkDataEnd + (chunkSize % 2);

    if (fmt && data) break;
  }

  if (!fmt) {
    throw new BadRequestException('WAV fmt chunk not found');
  }
  if (!data) {
    throw new BadRequestException('WAV data chunk not found');
  }

  if (fmt.audioFormat !== 1) {
    throw new BadRequestException(
      `Unsupported WAV audioFormat=${fmt.audioFormat} (expected PCM=1)`,
    );
  }
  if (fmt.bitsPerSample !== 16) {
    throw new BadRequestException(
      `Unsupported WAV bitsPerSample=${fmt.bitsPerSample} (expected 16)`,
    );
  }
  if (fmt.channels < 1 || fmt.channels > 2) {
    throw new BadRequestException(`Unsupported WAV channels=${fmt.channels}`);
  }
  if (fmt.sampleRateHz < 8000 || fmt.sampleRateHz > 48000) {
    throw new BadRequestException(
      `Unsupported WAV sampleRateHz=${fmt.sampleRateHz}`,
    );
  }

  return {
    pcmData: data,
    sampleRateHz: fmt.sampleRateHz,
    channels: fmt.channels,
    bitsPerSample: fmt.bitsPerSample,
  };
}
