const PCM_TAP_PROCESSOR = `
class PcmTap extends AudioWorkletProcessor {
  process(inputs) {
    const channel = inputs[0] && inputs[0][0];
    if (channel) this.port.postMessage(channel.slice(0));
    return true;
  }
}
registerProcessor("pcm-tap", PcmTap);
`;

export type PcmCapture = {
  sampleRate: number;
  stop: () => Promise<void>;
};

export async function startPcmCapture(
  onSamples: (samples: Float32Array, sampleRate: number) => void,
): Promise<PcmCapture> {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true },
  });
  const context = new AudioContext();

  const moduleUrl = URL.createObjectURL(
    new Blob([PCM_TAP_PROCESSOR], { type: "application/javascript" }),
  );
  try {
    await context.audioWorklet.addModule(moduleUrl);
  } catch (error) {
    stream.getTracks().forEach((track) => track.stop());
    await context.close();
    throw error;
  } finally {
    URL.revokeObjectURL(moduleUrl);
  }

  const source = context.createMediaStreamSource(stream);
  const tap = new AudioWorkletNode(context, "pcm-tap", { numberOfOutputs: 0 });
  tap.port.onmessage = (event: MessageEvent<Float32Array>) =>
    onSamples(event.data, context.sampleRate);
  source.connect(tap);

  return {
    sampleRate: context.sampleRate,
    stop: async () => {
      tap.port.onmessage = null;
      source.disconnect();
      tap.disconnect();
      stream.getTracks().forEach((track) => track.stop());
      await context.close();
    },
  };
}
