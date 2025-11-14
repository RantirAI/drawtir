/**
 * Extract waveform data from an audio file
 * @param audioUrl URL of the audio file
 * @param samples Number of samples to extract (default: 100)
 * @returns Array of normalized amplitude values (0-1)
 */
export async function extractWaveform(audioUrl: string, samples: number = 100): Promise<number[]> {
  try {
    // Fetch the audio file
    const response = await fetch(audioUrl);
    const arrayBuffer = await response.arrayBuffer();

    // Create audio context
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    // Get the audio data from the first channel
    const rawData = audioBuffer.getChannelData(0);
    const blockSize = Math.floor(rawData.length / samples);
    const waveformData: number[] = [];

    // Extract peak values for each block
    for (let i = 0; i < samples; i++) {
      const start = blockSize * i;
      let sum = 0;
      let max = 0;

      for (let j = 0; j < blockSize; j++) {
        const val = Math.abs(rawData[start + j]);
        sum += val;
        if (val > max) max = val;
      }

      // Use average of max and mean for better visualization
      const avg = sum / blockSize;
      waveformData.push((max + avg) / 2);
    }

    // Normalize the data to 0-1 range
    const maxValue = Math.max(...waveformData);
    if (maxValue > 0) {
      return waveformData.map(val => val / maxValue);
    }

    return waveformData;
  } catch (error) {
    console.error('Error extracting waveform:', error);
    // Return empty waveform on error
    return new Array(samples).fill(0.3);
  }
}

/**
 * Render waveform as SVG path
 * @param waveformData Array of normalized amplitude values
 * @param width Width of the SVG
 * @param height Height of the SVG
 * @returns SVG path string
 */
export function renderWaveformPath(waveformData: number[], width: number, height: number): string {
  if (!waveformData || waveformData.length === 0) {
    return '';
  }

  const step = width / waveformData.length;
  const midHeight = height / 2;

  let path = `M 0 ${midHeight}`;

  // Draw top half of waveform
  waveformData.forEach((value, i) => {
    const x = i * step;
    const y = midHeight - (value * midHeight * 0.8);
    path += ` L ${x} ${y}`;
  });

  // Draw bottom half (mirror)
  for (let i = waveformData.length - 1; i >= 0; i--) {
    const x = i * step;
    const y = midHeight + (waveformData[i] * midHeight * 0.8);
    path += ` L ${x} ${y}`;
  }

  path += ' Z';
  return path;
}
