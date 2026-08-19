import React, { useState } from 'react';
import { 
  Play, Pause, RotateCcw, SkipForward, Volume2, VolumeX, 
  Sparkles, CheckCircle2, ShieldCheck, Flame, BellOff, 
  Headphones, ListTodo, Plus, Trash2, Users, Radio, 
  Brain, Coffee, Moon, Zap, Clock
} from 'lucide-react';
import { FocusSessionState, FocusMode, Channel, User } from '../../types';

interface FocusChannelViewProps {
  channel: Channel;
  currentUser: User | null;
  focusState: FocusSessionState | null;
  ambientSound: string;
  ambientVolume: number;
  userTask: string;
  isDNDActive: boolean;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onSetMode: (mode: FocusMode, customSeconds?: number) => void;
  onSetTask: (task: string) => void;
  onSetAmbient: (ambient: string) => void;
  onSetVolume: (vol: number) => void;
}

interface LocalTodo {
  id: string;
  text: string;
  completed: boolean;
}

export const FocusChannelView: React.FC<FocusChannelViewProps> = ({
  channel,
  currentUser,
  focusState,
  ambientSound,
  ambientVolume,
  userTask,
  isDNDActive,
  onStart,
  onPause,
  onReset,
  onSetMode,
  onSetTask,
  onSetAmbient,
  onSetVolume
}) => {
  const [taskInput, setTaskInput] = useState(userTask || '');
  const [todos, setTodos] = useState<LocalTodo[]>([
    { id: '1', text: 'Entregar módulo de autenticação e segurança', completed: true },
    { id: '2', text: 'Refatorar canais de foco sincronizados no Socket.io', completed: false },
    { id: '3', text: 'Testar motor de temas dinâmicos por servidor', completed: false }
  ]);
  const [newTodoText, setNewTodoText] = useState('');

  // Valores padrão se o estado ainda não tiver chegado do backend
  const mode = focusState?.mode || 'work';
  const isRunning = focusState?.isRunning || false;
  const remainingSeconds = focusState?.remainingSeconds ?? (25 * 60);
  const duration = focusState?.duration ?? (25 * 60);
  const sessionRound = focusState?.sessionRound ?? 1;
  const totalRounds = focusState?.totalRounds ?? 4;
  const participants = focusState?.participants || [];

  // Formatação de Tempo MM:SS
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  // Cálculo da porcentagem para o anel SVG
  const progressPercent = duration > 0 ? (1 - remainingSeconds / duration) * 100 : 0;
  const circleRadius = 140;
  const circumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  // Configuração visual por modo
  const modeConfigs = {
    work: {
      label: 'Foco Profundo',
      subtitle: 'Sem distrações, imersão total no código e estudo',
      icon: Brain,
      strokeColor: '#06b6d4',
      gradientId: 'workGradient',
      gradientFrom: '#06b6d4',
      gradientTo: '#3b82f6',
      badgeBg: 'bg-cyan-950/80 border-cyan-500/40 text-cyan-300',
      glow: 'shadow-[0_0_50px_rgba(6,182,212,0.25)]'
    },
    short_break: {
      label: 'Pausa Curta',
      subtitle: 'Alongue-se, beba água e descanse os olhos',
      icon: Coffee,
      strokeColor: '#10b981',
      gradientId: 'shortBreakGradient',
      gradientFrom: '#10b981',
      gradientTo: '#059669',
      badgeBg: 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300',
      glow: 'shadow-[0_0_50px_rgba(16,185,129,0.25)]'
    },
    long_break: {
      label: 'Pausa Longa',
      subtitle: 'Excelente sprint! Descanse a mente antes do próximo ciclo',
      icon: Moon,
      strokeColor: '#a855f7',
      gradientId: 'longBreakGradient',
      gradientFrom: '#a855f7',
      gradientTo: '#ec4899',
      badgeBg: 'bg-purple-950/80 border-purple-500/40 text-purple-300',
      glow: 'shadow-[0_0_50px_rgba(168,85,247,0.25)]'
    }
  };

  const currentConfig = modeConfigs[mode];
  const ModeIcon = currentConfig.icon;

  const handleTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (taskInput.trim()) {
      onSetTask(taskInput.trim());
    }
  };

  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTodoText.trim()) {
      setTodos([...todos, { id: Date.now().toString(), text: newTodoText.trim(), completed: false }]);
      setNewTodoText('');
    }
  };

  const toggleTodo = (id: string) => {
    setTodos(todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const removeTodo = (id: string) => {
    setTodos(todos.filter(t => t.id !== id));
  };

  return (
    <div 
      id="focus-channel-container"
      className="flex-1 flex flex-col h-full bg-[#0b0e14] overflow-y-auto selection:bg-cyan-500/30"
    >
      {/* Top Notification Silencing (DND) Active Banner */}
      {isDNDActive && (
        <div 
          id="dnd-shield-banner"
          className="bg-gradient-to-r from-cyan-950/90 via-slate-900/90 to-blue-950/90 border-b border-cyan-500/30 px-6 py-2.5 flex items-center justify-between backdrop-blur-md animate-in slide-in-from-top duration-300"
        >
          <div className="flex items-center gap-2.5 text-xs text-cyan-300">
            <span className="p-1 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              <BellOff className="w-4 h-4" />
            </span>
            <div>
              <span className="font-bold text-white">Blindagem DND Ativa: </span>
              <span>Notificações e sons de outros canais estão 100% silenciados automaticamente durante o bloco de foco.</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[11px] font-mono font-semibold px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-400/20">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Foco Coletivo Ativo</span>
          </div>
        </div>
      )}

      {/* Main Focus Stage Grid */}
      <div className="p-6 max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-start">
        
        {/* Left Column: Pomodoro Dial & Controls (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* Main Dial Glass Card */}
          <div 
            id="focus-dial-card"
            className={`relative rounded-3xl bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-8 flex flex-col items-center justify-center transition-all ${currentConfig.glow}`}
          >
            {/* Background Glow */}
            <div 
              className="absolute w-72 h-72 rounded-full blur-3xl opacity-20 pointer-events-none -z-0"
              style={{ backgroundColor: currentConfig.strokeColor }}
            />

            {/* Mode Tag & Round */}
            <div className="flex items-center gap-3 mb-6 z-10">
              <div className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 border ${currentConfig.badgeBg}`}>
                <ModeIcon className="w-3.5 h-3.5" />
                <span>{currentConfig.label}</span>
              </div>
              <div className="px-3 py-1 rounded-full text-xs font-mono bg-slate-800/80 text-slate-300 border border-slate-700/60 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>Ciclo {sessionRound} de {totalRounds}</span>
              </div>
            </div>

            {/* SVG Circular Progress Ring */}
            <div className="relative flex items-center justify-center z-10 my-2">
              <svg className="w-72 h-72 sm:w-80 sm:h-80 -rotate-90">
                <defs>
                  <linearGradient id="workGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#06b6d4" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                  <linearGradient id="shortBreakGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#059669" />
                  </linearGradient>
                  <linearGradient id="longBreakGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#a855f7" />
                    <stop offset="100%" stopColor="#ec4899" />
                  </linearGradient>
                </defs>

                {/* Track Base */}
                <circle
                  cx="50%"
                  cy="50%"
                  r={circleRadius}
                  className="stroke-slate-800/80 fill-none"
                  strokeWidth="10"
                />

                {/* Active Progress */}
                <circle
                  cx="50%"
                  cy="50%"
                  r={circleRadius}
                  fill="none"
                  stroke={`url(#${currentConfig.gradientId})`}
                  strokeWidth="12"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-linear"
                />
              </svg>

              {/* Inside Clock Display */}
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="font-mono text-5xl sm:text-6xl font-black tracking-tight text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
                  {formattedTime}
                </span>
                <span className="text-xs text-slate-400 mt-2 font-medium">
                  {isRunning ? 'Sincronizado em tempo real' : 'Pausado • Clique em Iniciar'}
                </span>
              </div>
            </div>

            {/* Main Action Buttons */}
            <div className="flex items-center gap-4 mt-6 z-10">
              <button
                type="button"
                id="btn-focus-reset"
                onClick={onReset}
                title="Reiniciar Bloco Atual"
                className="p-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700/50 transition-all cursor-pointer shadow-lg hover:scale-105 active:scale-95"
              >
                <RotateCcw className="w-5 h-5" />
              </button>

              <button
                type="button"
                id="btn-focus-toggle"
                onClick={isRunning ? onPause : onStart}
                className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-base shadow-xl shadow-cyan-500/25 border border-cyan-300/30 flex items-center gap-2.5 transition-all cursor-pointer hover:scale-105 active:scale-95"
              >
                {isRunning ? (
                  <>
                    <Pause className="w-5 h-5 fill-current" />
                    <span>Pausar Sessão</span>
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 fill-current" />
                    <span>Iniciar Foco</span>
                  </>
                )}
              </button>

              <button
                type="button"
                id="btn-focus-skip"
                onClick={() => {
                  if (mode === 'work') {
                    onSetMode('short_break');
                  } else {
                    onSetMode('work');
                  }
                }}
                title="Avançar para Próxima Etapa"
                className="p-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700/50 transition-all cursor-pointer shadow-lg hover:scale-105 active:scale-95"
              >
                <SkipForward className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Mode Switcher Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full mt-8 pt-6 border-t border-slate-800/80 z-10">
              <button
                type="button"
                id="btn-mode-work-25"
                onClick={() => onSetMode('work', 25 * 60)}
                className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  mode === 'work' && duration === 25 * 60
                    ? 'bg-cyan-950/60 border-cyan-500/60 text-cyan-300 shadow-md shadow-cyan-500/10'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <Brain className="w-4 h-4 text-cyan-400" />
                <span>Foco 25m</span>
              </button>

              <button
                type="button"
                id="btn-mode-break-5"
                onClick={() => onSetMode('short_break', 5 * 60)}
                className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  mode === 'short_break'
                    ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-300 shadow-md shadow-emerald-500/10'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <Coffee className="w-4 h-4 text-emerald-400" />
                <span>Pausa 5m</span>
              </button>

              <button
                type="button"
                id="btn-mode-longbreak-15"
                onClick={() => onSetMode('long_break', 15 * 60)}
                className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  mode === 'long_break'
                    ? 'bg-purple-950/60 border-purple-500/60 text-purple-300 shadow-md shadow-purple-500/10'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <Moon className="w-4 h-4 text-purple-400" />
                <span>Pausa 15m</span>
              </button>

              <button
                type="button"
                id="btn-mode-sprint-50"
                onClick={() => onSetMode('work', 50 * 60)}
                className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  mode === 'work' && duration === 50 * 60
                    ? 'bg-blue-950/60 border-blue-500/60 text-blue-300 shadow-md shadow-blue-500/10'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Sprint 50m</span>
              </button>
            </div>
          </div>

          {/* Ambient Sound Synthesizer Card */}
          <div 
            id="ambient-sound-card"
            className="rounded-3xl bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 p-6 flex flex-col gap-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <Headphones className="w-4 h-4 text-cyan-400" />
                <span>Gerador de Áudio & Ruído Ambiente (Web Audio API)</span>
              </div>
              <div className="flex items-center gap-2">
                {ambientSound !== 'none' ? (
                  <Volume2 className="w-4 h-4 text-cyan-400" />
                ) : (
                  <VolumeX className="w-4 h-4 text-slate-500" />
                )}
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={ambientVolume}
                  onChange={(e) => onSetVolume(parseFloat(e.target.value))}
                  className="w-24 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { id: 'binaural', label: 'Binaural 40Hz', desc: 'Foco Gama' },
                { id: 'rain', label: 'Chuva Suave', desc: 'Ruído Lo-Fi' },
                { id: 'whitenoise', label: 'Ruído Branco', desc: 'Isolamento' },
                { id: 'waves', label: 'Ondas Alpha', desc: 'Calmaria' },
                { id: 'none', label: 'Mudo', desc: 'Desativado' },
              ].map((sound) => (
                <button
                  key={sound.id}
                  type="button"
                  onClick={() => onSetAmbient(sound.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    ambientSound === sound.id
                      ? 'bg-cyan-950/60 border-cyan-500/60 text-cyan-300 shadow-md shadow-cyan-500/10'
                      : 'bg-slate-950/30 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <div className="text-xs font-semibold">{sound.label}</div>
                  <div className="text-[10px] text-slate-500">{sound.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Goal/Tasks & Co-Focusers Live Grid (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* User Active Task / Goal */}
          <div 
            id="focus-goal-card"
            className="rounded-3xl bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-6 flex flex-col gap-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                Sua Meta para Este Bloco
              </span>
              <span className="text-[10px] font-mono text-slate-500">Visível para a sala</span>
            </div>

            <form onSubmit={handleTaskSubmit} className="flex gap-2">
              <input
                id="input-focus-task"
                type="text"
                value={taskInput}
                onChange={(e) => setTaskInput(e.target.value)}
                placeholder="Ex: Implementando hook useFocusChannel..."
                className="flex-1 bg-slate-950/60 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              />
              <button
                type="submit"
                className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all cursor-pointer"
              >
                Definir
              </button>
            </form>

            {/* Block Task Checklist */}
            <div className="mt-2 space-y-2">
              <div className="text-[11px] font-semibold text-slate-400 flex items-center justify-between">
                <span>Checklist do Bloco:</span>
                <span>{todos.filter(t => t.completed).length}/{todos.length} Concluídos</span>
              </div>

              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {todos.map((todo) => (
                  <div
                    key={todo.id}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-950/40 border border-slate-800/80 text-xs text-slate-300 group hover:border-slate-700 transition-all"
                  >
                    <button
                      type="button"
                      onClick={() => toggleTodo(todo.id)}
                      className="flex items-center gap-2 text-left flex-1 cursor-pointer"
                    >
                      <CheckCircle2 className={`w-4 h-4 shrink-0 ${todo.completed ? 'text-emerald-400' : 'text-slate-600'}`} />
                      <span className={todo.completed ? 'line-through text-slate-500' : ''}>
                        {todo.text}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => removeTodo(todo.id)}
                      className="text-slate-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity p-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <form onSubmit={handleAddTodo} className="flex gap-2 pt-2">
                <input
                  type="text"
                  value={newTodoText}
                  onChange={(e) => setNewTodoText(e.target.value)}
                  placeholder="Adicionar sub-tarefa..."
                  className="flex-1 bg-slate-950/40 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
                />
                <button
                  type="submit"
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>

          {/* Co-Focusers / Study Hall Participants Grid */}
          <div 
            id="co-focusers-card"
            className="rounded-3xl bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-6 flex flex-col gap-4 flex-1"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
                <Users className="w-4 h-4 text-cyan-400" />
                <span>Comunidade Focando Agora ({participants.length || 1})</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {participants.map((participant) => (
                <div
                  key={participant.userId}
                  className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${
                    participant.userId === currentUser?.id
                      ? 'bg-cyan-950/30 border-cyan-500/40 shadow-sm'
                      : 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img
                        src={participant.avatarUrl}
                        alt={participant.username}
                        className="w-9 h-9 rounded-xl object-cover border border-slate-700"
                        referrerPolicy="no-referrer"
                      />
                      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-900" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-white">{participant.username}</span>
                        {participant.userId === currentUser?.id && (
                          <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/50">Você</span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[180px]">
                        🎯 {participant.currentTask || 'Foco Produtivo'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-xs font-mono font-bold text-amber-400 bg-amber-950/40 px-2 py-1 rounded-lg border border-amber-800/30">
                    <Flame className="w-3.5 h-3.5 fill-current" />
                    <span>{participant.streak || 1}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
