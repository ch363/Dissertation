import { detectAudioContainer, looksLikeRawPcm16le } from '../audio-format.util';

describe('audio-format.util', () => {
  describe('detectAudioContainer', () => {
    it('detects wav via RIFF/WAVE', () => {
      // Minimal WAV header signature: RIFF....WAVE
      const wav = Buffer.from([
        0x52, 0x49, 0x46, 0x46, // RIFF
        0x24, 0x00, 0x00, 0x00, // size (dummy)
        0x57, 0x41, 0x56, 0x45, // WAVE
        0x66, 0x6d, 0x74, 0x20, // fmt  (dummy)
      ]);
      expect(detectAudioContainer(wav)).toBe('wav');
    });

    it('detects caf', () => {
      const caf = Buffer.from('caff\x00\x01\x00\x00', 'binary');
      expect(detectAudioContainer(caf)).toBe('caf');
    });

    it('detects flac', () => {
      const flac = Buffer.from('fLaC\x00\x00\x00\x22', 'binary');
      expect(detectAudioContainer(flac)).toBe('flac');
    });

    it('detects ogg', () => {
      const ogg = Buffer.from('OggS\x00\x02\x00\x00', 'binary');
      expect(detectAudioContainer(ogg)).toBe('ogg');
    });

    it('detects mp3 via ID3', () => {
      const mp3 = Buffer.from('ID3\x04\x00\x00\x00\x00\x00\x21', 'binary');
      expect(detectAudioContainer(mp3)).toBe('mp3');
    });

    it('detects mp4 via ftyp at offset 4', () => {
      const mp4 = Buffer.from([
        0x00, 0x00, 0x00, 0x18, // box size
        0x66, 0x74, 0x79, 0x70, // ftyp
        0x4d, 0x34, 0x41, 0x20, // M4A (brand)
        0x00, 0x00, 0x00, 0x00,
      ]);
      expect(detectAudioContainer(mp4)).toBe('mp4');
    });

    it('returns unknown for short buffers', () => {
      expect(detectAudioContainer(Buffer.from([0x00, 0x01]))).toBe('unknown');
    });
  });

  describe('looksLikeRawPcm16le', () => {
    it('returns false for known containers', () => {
      const wav = Buffer.from('RIFF\x00\x00\x00\x00WAVE', 'ascii');
      expect(looksLikeRawPcm16le(wav)).toBe(false);
    });

    it('returns true for unknown containers', () => {
      const raw = Buffer.from([0x00, 0x84, 0x00, 0x6c, 0xff, 0xf3, 0x00, 0x10, 0x00, 0x20, 0x00, 0x1c]);
      expect(looksLikeRawPcm16le(raw)).toBe(true);
    });
  });
});
