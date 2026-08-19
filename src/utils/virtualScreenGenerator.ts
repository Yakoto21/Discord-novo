/**
 * Gerador de stream virtual de alta performance (60 FPS) para compartilhamento de tela
 * Utiliza HTML5 Canvas com renderização de código em tempo real, telemetria WebRTC e efeitos dinâmicos
 */

export function createVirtualScreenStream(width = 1920, height = 1080, fps = 60): {
  stream: MediaStream;
  stop: () => void;
} {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  let animationFrameId: number | null = null;
  let frameCount = 0;

  const codeLines = [
    '// WebRTC Mesh PeerConnection Active',
    'const peerConnection = new RTCPeerConnection({ iceServers: STUN_SERVERS });',
    'const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });',
    'screenStream.getTracks().forEach(track => peerConnection.addTrack(track, screenStream));',
    'console.log("Transmissão 60 FPS em Ultra HD estabelecida com sucesso.");',
    'await peerConnection.setLocalDescription(await peerConnection.createOffer());',
    'socket.emit("voice:signal", { type: "sdp-offer", sdp: peerConnection.localDescription });',
    '// Telemetria de Bitrate: 4500 kbps | Codec: VP9/Opus | Jitter: < 2ms',
    'const spatialAudioProcessor = new AudioWorkletNode(audioCtx, "spatial-audio-vad");',
    'document.dispatchEvent(new CustomEvent("screen:rendered", { detail: { fps: 60 } }));',
  ];

  const drawFrame = () => {
    if (!ctx) return;
    frameCount++;

    // Fundo do editor / tela
    ctx.fillStyle = '#060913';
    ctx.fillRect(0, 0, width, height);

    // Barra superior da janela simulada
    ctx.fillStyle = '#0d1322';
    ctx.fillRect(0, 0, width, 60);

    // Botões estilo macOS / janela
    ctx.fillStyle = '#ff5f56';
    ctx.beginPath();
    ctx.arc(40, 30, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffbd2e';
    ctx.beginPath();
    ctx.arc(70, 30, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#27c93f';
    ctx.beginPath();
    ctx.arc(100, 30, 10, 0, Math.PI * 2);
    ctx.fill();

    // Título da Janela
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 20px monospace';
    ctx.fillText('🔴 DISCORD LIVE STREAM [QUANTUM DEV STUDIO - 60 FPS ULTRA HD]', 140, 37);

    // Efeito de Grid Cósmico de Fundo
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, 60);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 60; y < height; y += 60) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Painel Central: Código animado
    ctx.font = '22px "Fira Code", monospace';
    codeLines.forEach((line, index) => {
      const y = 140 + index * 42;
      const highlight = Math.floor(frameCount / 30) % codeLines.length === index;

      if (highlight) {
        ctx.fillStyle = 'rgba(6, 182, 212, 0.15)';
        ctx.fillRect(40, y - 28, width - 400, 36);
        ctx.fillStyle = '#38bdf8';
      } else {
        ctx.fillStyle = index === 0 || index === 7 ? '#a855f7' : '#e2e8f0';
      }

      ctx.fillText(`${(index + 1).toString().padStart(2, '0')}  ${line}`, 60, y);
    });

    // Painel Lateral de Telemetria
    const sideX = width - 360;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 2;
    ctx.fillRect(sideX, 90, 320, height - 120);
    ctx.strokeRect(sideX, 90, 320, height - 120);

    ctx.fillStyle = '#22d3ee';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('⚡ TELEMETRIA RTC', sideX + 25, 135);

    ctx.font = '16px monospace';
    ctx.fillStyle = '#10b981';
    ctx.fillText(`● FPS REAL: ${fps}`, sideX + 25, 180);
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText(`● Resolução: ${width}x${height}`, sideX + 25, 215);
    ctx.fillText(`● Bitrate: ${(3800 + Math.sin(frameCount * 0.05) * 400).toFixed(0)} kbps`, sideX + 25, 250);
    ctx.fillText(`● Latência P2P: 1.8 ms`, sideX + 25, 285);
    ctx.fillText(`● Pacotes: ${frameCount * 4}`, sideX + 25, 320);

    // Gráfico de Onda Senoidal em Tempo Real
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = 0; i < 270; i++) {
      const graphY = 460 + Math.sin((frameCount + i) * 0.1) * 35;
      if (i === 0) ctx.moveTo(sideX + 25 + i, graphY);
      else ctx.lineTo(sideX + 25 + i, graphY);
    }
    ctx.stroke();

    // Rodapé
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, height - 40, width, 40);
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText(`Transmissão de Tela Ativa • Socket ID Broadcast • Frame #${frameCount}`, 30, height - 15);

    animationFrameId = requestAnimationFrame(drawFrame);
  };

  drawFrame();

  const stream = canvas.captureStream(fps);

  const stop = () => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
    stream.getTracks().forEach((t) => t.stop());
  };

  return { stream, stop };
}
