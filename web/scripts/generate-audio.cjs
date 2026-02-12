#!/usr/bin/env node

/**
 * Generate an 8-hour white noise WAV file for web deployment
 * This eliminates the need to generate audio in the browser
 * and provides better looping performance
 */

const fs = require('fs');
const path = require('path');

function generateWhiteNoiseWav(durationSeconds, sampleRate = 22050) {
  console.log(`Generating ${durationSeconds / 3600} hour white noise file...`);
  console.log(`Sample rate: ${sampleRate} Hz`);

  const numSamples = durationSeconds * sampleRate;
  const fileSize = 44 + numSamples * 2;

  console.log(`Total samples: ${numSamples.toLocaleString()}`);
  console.log(`File size: ${(fileSize / 1024 / 1024).toFixed(2)} MB`);

  const buffer = Buffer.alloc(fileSize);

  // WAV header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + numSamples * 2, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(1, 22); // Mono
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(numSamples * 2, 40);

  // Generate white noise samples
  console.log('Generating samples...');
  for (let i = 0; i < numSamples; i++) {
    const sample = Math.floor((Math.random() * 2 - 1) * 0.5 * 32767);
    buffer.writeInt16LE(sample, 44 + i * 2);

    // Progress indicator
    if (i % (sampleRate * 60) === 0) {
      const minutes = i / sampleRate / 60;
      console.log(`  Progress: ${minutes.toFixed(0)} minutes`);
    }
  }

  return buffer;
}

// Generate 8-hour white noise file
const DURATION_HOURS = 8;
const DURATION_SECONDS = DURATION_HOURS * 3600;

const audioBuffer = generateWhiteNoiseWav(DURATION_SECONDS);
const outputPath = path.join(__dirname, '../public/white-noise-8h.wav');

console.log(`Writing to: ${outputPath}`);
fs.writeFileSync(outputPath, audioBuffer);
console.log('✓ Done!');
console.log(`\nFile saved: ${outputPath}`);
console.log(`Size: ${(fs.statSync(outputPath).size / 1024 / 1024).toFixed(2)} MB`);
