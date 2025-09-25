import React, { useEffect, useMemo, useRef, useState } from 'react';
import socket from '@/lib/socket';

// Módulo simple de llamadas (audio/video) con scaffolding para WebRTC.
// Requiere un servidor de señalización (p. ej., Socket.IO) para funcionar en producción.
// Props:
// - open: boolean
// - onClose: () => void
// - caller: { id, name, avatar }
// - callee: { id, name, avatar }
// - type: 'audio' | 'video'
// - signaling?: { send: (payload) => void, on: (event, cb) => unsubscribe }
export default function LlamadasMessenger({ open, onClose, caller, callee, type = 'audio', incomingOffer }) {
  const [status, setStatus] = useState('idle'); // idle | calling | connecting | in_call | ended | error
  const [muted, setMuted] = useState(false);
  const [cameraOn, setCameraOn] = useState(type === 'video');
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);

  const isVideo = useMemo(() => type === 'video', [type]);

  useEffect(() => {
    if (!open) return;
    setStatus('calling');
    // Adquiere medios locales según tipo
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: isVideo,
        });
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        // Crea RTCPeerConnection y conecta señalización
        pcRef.current = new RTCPeerConnection({
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
        });
        stream.getTracks().forEach((track) => pcRef.current.addTrack(track, stream));
        pcRef.current.ontrack = (e) => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = e.streams[0];
          }
        };
        pcRef.current.onicecandidate = (e) => {
          if (e.candidate) {
            socket.emit('call:candidate', {
              to: callee?.id,
              from: caller?.id,
              candidate: e.candidate,
            });
          }
        };
        setStatus('connecting');
        // Caller: crea oferta si no hay incomingOffer
        if (!incomingOffer) {
          const offer = await pcRef.current.createOffer();
          await pcRef.current.setLocalDescription(offer);
          socket.emit('call:offer', {
            to: callee?.id,
            from: caller?.id,
            sdp: offer,
            callType: type,
          });
        } else {
          // Receiver: aplica oferta remota y responde
          await pcRef.current.setRemoteDescription(incomingOffer.sdp);
          const answer = await pcRef.current.createAnswer();
          await pcRef.current.setLocalDescription(answer);
          socket.emit('call:answer', {
            to: incomingOffer.from,
            from: caller?.id,
            sdp: answer,
          });
        }
      } catch (err) {
        console.error('Error al iniciar medios locales', err);
        setStatus('error');
      }
    })();

    return () => {
      cleanup();
    };
  }, [open, isVideo, incomingOffer, callee?.id, caller?.id, type]);

  // Socket listeners
  useEffect(() => {
    if (!open) return;
    const onAnswer = async ({ from, sdp }) => {
      if (!pcRef.current) return;
      try {
        await pcRef.current.setRemoteDescription(sdp);
        setStatus('in_call');
      } catch (e) {
        console.error('Error aplicando answer', e);
      }
    };
    const onCandidate = async ({ from, candidate }) => {
      if (!pcRef.current) return;
      try {
        await pcRef.current.addIceCandidate(candidate);
      } catch (e) {
        console.error('Error agregando ICE', e);
      }
    };
    const onEnd = () => {
      endCall();
    };
    socket.on('call:answer', onAnswer);
    socket.on('call:candidate', onCandidate);
    socket.on('call:end', onEnd);
    return () => {
      socket.off('call:answer', onAnswer);
      socket.off('call:candidate', onCandidate);
      socket.off('call:end', onEnd);
    };
  }, [open]);

  const cleanup = () => {
    try {
      if (pcRef.current) {
        pcRef.current.ontrack = null;
        pcRef.current.close();
        pcRef.current = null;
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
      }
    } catch (e) {
      // noop
    }
  };

  const endCall = () => {
    setStatus('ended');
    if (caller?.id && callee?.id) {
      socket.emit('call:end', { to: callee.id, from: caller.id });
    }
    cleanup();
    onClose && onClose();
  };

  const toggleMute = () => {
    const stream = localStreamRef.current;
    if (!stream) return;
    stream.getAudioTracks().forEach((t) => (t.enabled = !t.enabled));
    setMuted((m) => !m);
  };

  const toggleCamera = () => {
    if (!isVideo) return;
    const stream = localStreamRef.current;
    if (!stream) return;
    stream.getVideoTracks().forEach((t) => (t.enabled = !t.enabled));
    setCameraOn((c) => !c);
  };

  if (!open) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(10, 15, 25, 0.55)', backdropFilter: 'blur(2px)' }}>
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'min(96vw, 880px)',
          height: isVideo ? 'min(82vh, 560px)' : 'min(64vh, 360px)',
          background: '#0b1220',
          borderRadius: 16,
          overflow: 'hidden',
          boxShadow: '0 20px 70px rgba(0,0,0,0.35)',
          border: '1px solid #1e2a44',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#0e1729', borderBottom: '1px solid #1e2a44' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img src={callee?.avatar} alt={callee?.name} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '2px solid #2b77e7' }} />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontWeight: 700, color: '#dce6ff' }}>{callee?.name}</span>
              <span style={{ fontSize: 12, color: '#9fb3d9' }}>
                {status === 'calling' && 'Llamando…'}
                {status === 'connecting' && 'Conectando…'}
                {status === 'in_call' && 'En llamada'}
                {status === 'ended' && 'Finalizada'}
                {status === 'error' && 'Error en la llamada'}
              </span>
            </div>
          </div>
          <button onClick={endCall} style={{ background: 'transparent', border: 'none', color: '#9fb3d9', cursor: 'pointer' }}>
            ✕
          </button>
        </div>

        {/* Cuerpo */}
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: isVideo ? '1fr 1fr' : '1fr', gap: 0, background: '#0b1220' }}>
          {/* Local */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {isVideo ? (
              <video ref={localVideoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', background: '#0b1220' }} />
            ) : (
              <div style={{ color: '#9fb3d9' }}>Audio activado</div>
            )}
            {!isVideo && (
              <img src={caller?.avatar} alt={caller?.name} style={{ position: 'absolute', width: 100, height: 100, borderRadius: '50%', objectFit: 'cover', border: '3px solid #2b77e7' }} />
            )}
          </div>
          {/* Remoto */}
          {isVideo && (
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <video ref={remoteVideoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', background: '#050a14' }} />
            </div>
          )}
        </div>

        {/* Controles */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 14, background: '#0e1729', borderTop: '1px solid #1e2a44' }}>
          <button onClick={toggleMute} style={btnStyle(muted ? '#ef4444' : '#1f2a44')}>{muted ? 'Mic off' : 'Mic on'}</button>
          {isVideo && (
            <button onClick={toggleCamera} style={btnStyle(cameraOn ? '#1f2a44' : '#ef4444')}>{cameraOn ? 'Cam on' : 'Cam off'}</button>
          )}
          <button onClick={endCall} style={btnStyle('#ef4444')}>Finalizar</button>
        </div>
      </div>
    </div>
  );
}

function btnStyle(bg) {
  return {
    background: bg,
    color: '#dce6ff',
    border: '1px solid #2b3b59',
    borderRadius: 12,
    padding: '10px 14px',
    cursor: 'pointer',
    minWidth: 96,
  };
}
