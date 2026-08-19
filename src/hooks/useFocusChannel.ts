import { useState, useEffect, useCallback, useRef } from 'react';
import { getSocket } from '../services/socket';
import { soundManager } from '../utils/soundEffects';
import { FocusSessionState, FocusMode, FocusParticipant, User } from '../types';

export const useFocusChannel = (currentUser: User | null) => {
  const [focusState, setFocusState] = useState<FocusSessionState | null>(null);
  const [activeFocusChannelId, setActiveFocusChannelId] = useState<string | null>(null);
  const [ambientSound, setAmbientSoundState] = useState<string>('none');
  const [ambientVolume, setAmbientVolumeState] = useState<number>(0.3);
  const [userTask, setUserTask] = useState<string>('');

  const socketRef = useRef(getSocket());

  // Inscrição nos eventos de sincronização do Socket.io
  useEffect(() => {
    const socket = socketRef.current;

    const handleFocusState = (state: FocusSessionState) => {
      if (activeFocusChannelId && state.channelId === activeFocusChannelId) {
        setFocusState(state);
      }
    };

    const handleFocusTick = (data: { channelId: string; remainingSeconds: number; mode: FocusMode; isRunning: boolean }) => {
      if (activeFocusChannelId && data.channelId === activeFocusChannelId) {
        setFocusState((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            remainingSeconds: data.remainingSeconds,
            mode: data.mode,
            isRunning: data.isRunning,
          };
        });
      }
    };

    const handleSessionCompleted = (data: {
      channelId: string;
      completedMode: string;
      nextMode: FocusMode;
      sessionRound: number;
      message: string;
    }) => {
      if (activeFocusChannelId && data.channelId === activeFocusChannelId) {
        // Toca sino zen de transição de bloco
        soundManager.playChime(data.nextMode === 'work' ? 'break_complete' : 'work_complete');
      }
    };

    const handleAmbientChanged = (data: { channelId: string; ambientSound: string }) => {
      if (activeFocusChannelId && data.channelId === activeFocusChannelId) {
        setAmbientSoundState(data.ambientSound);
      }
    };

    socket.on('focus:state', handleFocusState);
    socket.on('focus:tick', handleFocusTick);
    socket.on('focus:session-completed', handleSessionCompleted);
    socket.on('focus:ambient-changed', handleAmbientChanged);

    return () => {
      socket.off('focus:state', handleFocusState);
      socket.off('focus:tick', handleFocusTick);
      socket.off('focus:session-completed', handleSessionCompleted);
      socket.off('focus:ambient-changed', handleAmbientChanged);
    };
  }, [activeFocusChannelId]);

  // Controle de reprodução do Áudio Ambiente
  useEffect(() => {
    if (ambientSound !== 'none' && activeFocusChannelId) {
      soundManager.startAmbient(ambientSound as any, ambientVolume);
    } else {
      soundManager.stopAmbient();
    }

    return () => {
      soundManager.stopAmbient();
    };
  }, [ambientSound, activeFocusChannelId]);

  // Ajuste dinâmico de volume do áudio ambiente
  const setVolume = useCallback((vol: number) => {
    setAmbientVolumeState(vol);
    soundManager.setAmbientVolume(vol);
  }, []);

  // Entrar no Canal de Foco
  const joinFocusChannel = useCallback(
    (channelId: string, initialTask?: string) => {
      if (!currentUser) return;
      setActiveFocusChannelId(channelId);
      socketRef.current.emit('focus:join-channel', {
        channelId,
        user: {
          id: currentUser.id,
          username: currentUser.username,
          avatarUrl: currentUser.avatarUrl,
        },
        initialTask: initialTask || userTask || 'Foco em Desenvolvimento',
      });
    },
    [currentUser, userTask]
  );

  // Sair do Canal de Foco
  const leaveFocusChannel = useCallback(() => {
    if (!activeFocusChannelId || !currentUser) return;
    socketRef.current.emit('focus:leave-channel', {
      channelId: activeFocusChannelId,
      userId: currentUser.id,
    });
    setActiveFocusChannelId(null);
    setFocusState(null);
    soundManager.stopAmbient();
  }, [activeFocusChannelId, currentUser]);

  // Iniciar Cronômetro Pomodoro
  const startTimer = useCallback(() => {
    if (!activeFocusChannelId) return;
    socketRef.current.emit('focus:start', { channelId: activeFocusChannelId });
  }, [activeFocusChannelId]);

  // Pausar Cronômetro
  const pauseTimer = useCallback(() => {
    if (!activeFocusChannelId) return;
    socketRef.current.emit('focus:pause', { channelId: activeFocusChannelId });
  }, [activeFocusChannelId]);

  // Definir Modo (Trabalho / Pausa Curta / Pausa Longa)
  const setMode = useCallback(
    (mode: FocusMode, customDurationSeconds?: number) => {
      if (!activeFocusChannelId) return;
      socketRef.current.emit('focus:set-mode', {
        channelId: activeFocusChannelId,
        mode,
        customDurationSeconds,
      });
    },
    [activeFocusChannelId]
  );

  // Reiniciar Bloco
  const resetTimer = useCallback(() => {
    if (!activeFocusChannelId) return;
    socketRef.current.emit('focus:reset', { channelId: activeFocusChannelId });
  }, [activeFocusChannelId]);

  // Atualizar Meta/Tarefa do Participante
  const setTask = useCallback(
    (task: string) => {
      setUserTask(task);
      if (!activeFocusChannelId || !currentUser) return;
      socketRef.current.emit('focus:set-task', {
        channelId: activeFocusChannelId,
        userId: currentUser.id,
        task,
      });
    },
    [activeFocusChannelId, currentUser]
  );

  // Atualizar Áudio Ambiente
  const setAmbient = useCallback(
    (ambient: string) => {
      setAmbientSoundState(ambient);
      if (!activeFocusChannelId) return;
      socketRef.current.emit('focus:set-ambient', {
        channelId: activeFocusChannelId,
        ambientSound: ambient,
      });
    },
    [activeFocusChannelId]
  );

  // Flag indicando se notificações de outros canais devem ser silenciadas
  const isDNDActive = Boolean(
    activeFocusChannelId && focusState && focusState.mode === 'work' && focusState.isRunning
  );

  return {
    focusState,
    activeFocusChannelId,
    ambientSound,
    ambientVolume,
    userTask,
    isDNDActive,
    joinFocusChannel,
    leaveFocusChannel,
    startTimer,
    pauseTimer,
    resetTimer,
    setMode,
    setTask,
    setAmbient,
    setVolume,
  };
};
