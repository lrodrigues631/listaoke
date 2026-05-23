import React, { useState, useEffect } from 'react';

// --- ÍCONES SVG NATIVOS PARA EVITAR FALHAS DE CARREGAMENTO ---
const MicIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
    <path d="M19 10v1a7 7 0 0 1-14 0v-1"/>
    <line x1="12" x2="12" y1="19" y2="22"/>
  </svg>
);

const PlayIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2">
    <polygon points="6 3 20 12 6 21 6 3"/>
  </svg>
);

const PauseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2">
    <rect width="4" height="16" x="6" y="4" rx="1"/>
    <rect width="4" height="16" x="14" y="4" rx="1"/>
  </svg>
);

const UsersIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const ClockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
);

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const SkipForwardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="5 4 15 12 5 20 5 4"/>
    <line x1="19" x2="19" y1="5" y2="19"/>
  </svg>
);

const HistoryIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
    <polyline points="3 3 3 8 8 8"/>
    <line x1="12" x2="12" y1="7" y2="12"/>
    <line x1="12" x2="16" y1="12" y2="12"/>
  </svg>
);

const SparklesIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
    <path d="m5 3 1 2.5L8.5 6 6 7 5 9.5 4 7 1.5 6 4 5.5z"/>
    <path d="m19 17 1 2.5 2.5.5-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1z"/>
  </svg>
);

const ChevronUpIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m18 15-6-6-6 6"/>
  </svg>
);

const ChevronDownIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m6 9 6 6 6-6"/>
  </svg>
);

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18"/>
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
  </svg>
);

const UserPlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <line x1="19" x2="19" y1="8" y2="14"/>
    <line x1="16" x2="22" y1="11" y2="11"/>
  </svg>
);


export default function App() {
  // Fila de espera ordenada exatamente com o seu fluxo de rotação original
  const [queue, setQueue] = useState([
    { id: 'ravi', singer: 'Ravi', performancesCount: 0 },
    { id: 'ferreira', singer: 'Ferreira', performancesCount: 0 },
    { id: 'giovanna', singer: 'Giovanna', performancesCount: 0 },
    { id: 'byeu', singer: 'Byeu', performancesCount: 0 },
    { id: 'carol', singer: 'Carol', performancesCount: 0 },
    { id: 'arthur', singer: 'Arthur', performancesCount: 0 },
    { id: 'leandro', singer: 'Leandro', performancesCount: 1 },
    { id: 'israel', singer: 'Israel', performancesCount: 1 }
  ]);

  // Fanny está no palco cantando neste momento
  const [currentSinger, setCurrentSinger] = useState({
    id: 'fanny',
    singer: 'Fanny',
    performancesCount: 0
  });

  // Histórico de apresentações finalizadas
  const [history, setHistory] = useState([
    { id: 'h-israel', singer: 'Israel', finishedAt: 'Rodada Inicial' },
    { id: 'h-leandro', singer: 'Leandro', finishedAt: 'Rodada Inicial' }
  ]);

  // Estados de controle do formulário
  const [newSingerName, setNewSingerName] = useState('');

  // Estados do Cronômetro de Palco (4 minutos padrão)
  const DEFAULT_STAGE_TIME = 240; 
  const [timeLeft, setTimeLeft] = useState(DEFAULT_STAGE_TIME);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  
  const [showNotification, setShowNotification] = useState(null);

  // Efeito do cronômetro decrescente
  useEffect(() => {
    let interval = null;
    if (isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      triggerNotification('Tempo sugerido de palco esgotado!', 'info');
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft]);

  // Notificações flutuantes seguras dentro do painel
  const triggerNotification = (message, type = 'success') => {
    setShowNotification({ message, type });
    setTimeout(() => {
      setShowNotification(null);
    }, 4000);
  };

  // Conversor de segundos para formato de mm:ss
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // ADICIONAR NOVA PESSOA (Entra no fim da fila)
  const handleAddSinger = (e) => {
    e.preventDefault();
    if (!newSingerName.trim()) return;

    const newSinger = {
      id: 'custom-' + Date.now(),
      singer: newSingerName.trim(),
      performancesCount: 0
    };

    setQueue([...queue, newSinger]);
    setNewSingerName('');
    triggerNotification(`➕ ${newSinger.singer} foi adicionado(a) ao fim da fila.`);
  };

  // REMOVER PESSOA DA FILA DE ESPERA
  const handleRemoveSinger = (id, name) => {
    setQueue(queue.filter(item => item.id !== id));
    triggerNotification(`❌ ${name} foi removido(a) da fila de espera.`);
  };

  // Concluir apresentação: vai para o Histórico e AUTOMATICAMENTE regressa ao fim da fila
  const handleFinishCurrent = () => {
    if (!currentSinger) return;

    const now = new Date();
    const finishedAt = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    setHistory(prev => [
      {
        id: 'h-' + Date.now(),
        singer: currentSinger.singer,
        finishedAt
      },
      ...prev
    ]);

    const rotatedSinger = {
      ...currentSinger,
      performancesCount: currentSinger.performancesCount + 1
    };

    const updatedQueue = [...queue, rotatedSinger];
    const nextSinger = updatedQueue[0];

    setCurrentSinger(nextSinger);
    setQueue(updatedQueue.slice(1));
    setTimeLeft(DEFAULT_STAGE_TIME);
    setIsTimerRunning(true);

    triggerNotification(`🎉 ${currentSinger.singer} concluiu! Foi para o fim da fila. Agora no palco: ${nextSinger.singer}`);
  };

  // Passar Vez / Pular Turno: move o cantor para o fim da fila de espera sem registrar no histórico
  const handleSkipCurrent = () => {
    if (!currentSinger) return;

    const updatedQueue = [...queue, currentSinger];
    const nextSinger = updatedQueue[0];

    setCurrentSinger(nextSinger);
    setQueue(updatedQueue.slice(1));
    setTimeLeft(DEFAULT_STAGE_TIME);
    setIsTimerRunning(true);

    triggerNotification(`⏭️ Turno de ${currentSinger.singer} adiado para o final da fila.`);
  };

  // REORDENAR: Mover cantor para CIMA na fila
  const handleMoveUp = (index) => {
    if (index === 0) return;
    const newQueue = [...queue];
    const temp = newQueue[index];
    newQueue[index] = newQueue[index - 1];
    newQueue[index - 1] = temp;
    setQueue(newQueue);
  };

  // REORDENAR: Mover cantor para BAIXO na fila
  const handleMoveDown = (index) => {
    if (index === queue.length - 1) return;
    const newQueue = [...queue];
    const temp = newQueue[index];
    newQueue[index] = newQueue[index + 1];
    newQueue[index + 1] = temp;
    setQueue(newQueue);
  };

  const totalWaitTime = queue.length * 4;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-purple-600 selection:text-white">
      
      {/* Notificação Flutuante */}
      {showNotification && (
        <div className="fixed top-4 right-4 z-50 animate-bounce">
          <div className="px-5 py-3 rounded-xl shadow-2xl bg-purple-950/90 border border-purple-500 text-purple-200 flex items-center gap-3">
            <span className="text-lg font-bold">🎯</span>
            <p className="font-semibold text-sm">{showNotification.message}</p>
          </div>
        </div>
      )}

      {/* Cabeçalho */}
      <header className="border-b border-purple-950 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40 px-4 py-4 md:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-tr from-purple-600 to-pink-500 rounded-xl shadow-lg">
            <MicIcon />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black tracking-wider bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
              KARAOKÊ ROTATIVO
            </h1>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Gerenciamento Total e Circular</p>
          </div>
        </div>

        {/* Status Gerais */}
        <div className="flex flex-wrap items-center justify-center gap-3 text-xs md:text-sm bg-slate-950/80 p-2 rounded-xl border border-slate-800">
          <div className="px-3 py-1.5 rounded-lg bg-slate-900 flex items-center gap-2 border border-slate-800/60">
            <UsersIcon />
            <span>Fila: <strong className="text-pink-400">{queue.length} pessoas</strong></span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-slate-900 flex items-center gap-2 border border-slate-800/60">
            <ClockIcon />
            <span>Rodada: <strong className="text-purple-400">~{totalWaitTime} min</strong></span>
          </div>
        </div>
      </header>

      {/* Grid Principal */}
      <main className="flex-1 p-4 md:p-8 max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Painel do Cantor no Palco (Esquerda) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          <section className="bg-gradient-to-b from-slate-900 to-slate-950 border border-purple-500/20 rounded-2xl p-6 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="mb-6">
              <span className="px-3 py-1 rounded-full text-[10px] md:text-xs font-black tracking-widest bg-pink-500/10 text-pink-400 border border-pink-500/20 flex items-center gap-1.5 w-max">
                <span className="w-2 h-2 rounded-full bg-pink-500 animate-ping"></span>
                NO PALCO AGORA
              </span>
            </div>

            {currentSinger ? (
              <div className="flex flex-col h-full justify-between">
                <div>
                  <h3 className="text-4xl md:text-5xl font-black text-white tracking-tight break-words">
                    {currentSinger.singer}
                  </h3>
                  
                  <div className="flex items-center gap-2 mt-3 text-slate-400 text-xs font-semibold">
                    <SparklesIcon />
                    <span>Já cantou {currentSinger.performancesCount} vezes hoje</span>
                  </div>
                </div>

                {/* Cronômetro */}
                <div className="mt-8 bg-slate-950/90 p-4 rounded-xl border border-slate-850">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Tempo de Palco</span>
                    <span className="text-xl font-mono font-bold text-pink-400">{formatTime(timeLeft)}</span>
                  </div>
                  
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-full transition-all duration-1000 ease-linear"
                      style={{ width: `${(timeLeft / DEFAULT_STAGE_TIME) * 100}%` }}
                    ></div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <button 
                      onClick={() => setIsTimerRunning(!isTimerRunning)}
                      className={`flex-1 py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                        isTimerRunning 
                          ? 'bg-amber-600/10 text-amber-300 hover:bg-amber-600/20 border border-amber-500/20' 
                          : 'bg-green-600/10 text-green-300 hover:bg-green-600/20 border border-green-500/20'
                      }`}
                    >
                      {isTimerRunning ? 'Pausar' : 'Iniciar'}
                    </button>

                    <button 
                      onClick={() => setTimeLeft(DEFAULT_STAGE_TIME)}
                      className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                    >
                      Zerar
                    </button>
                  </div>
                </div>

                {/* Ações */}
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <button 
                    onClick={handleFinishCurrent}
                    className="py-3.5 px-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-black rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-600/20 text-xs md:text-sm"
                  >
                    <CheckIcon /> Concluir & Fim
                  </button>
                  <button 
                    onClick={handleSkipCurrent}
                    className="py-3.5 px-4 bg-slate-850 hover:bg-slate-800 text-slate-300 font-bold rounded-xl flex items-center justify-center gap-2 border border-slate-700 transition-colors text-xs md:text-sm"
                  >
                    Passar Vez <SkipForwardIcon />
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-slate-500 text-sm">Ninguém cantando atualmente.</p>
            )}
          </section>

          {/* ADICIONAR NOVA PESSOA */}
          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <h3 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2 uppercase tracking-wider">
              <UserPlusIcon /> Incluir Pessoa na Festa
            </h3>
            <form onSubmit={handleAddSinger} className="flex gap-2">
              <input 
                type="text" 
                value={newSingerName}
                onChange={(e) => setNewSingerName(e.target.value)}
                placeholder="Nome do convidado..."
                className="flex-1 bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-purple-500 text-sm font-semibold"
              />
              <button 
                type="submit"
                className="px-4 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-sm transition-colors"
              >
                Inserir
              </button>
            </form>
          </section>

        </div>

        {/* Listagem da Fila de Espera (Direita) */}
        <div className="lg:col-span-7 flex flex-col gap-6 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-850">
            <div className="flex-1 py-2.5 rounded-lg font-bold text-sm bg-purple-600 text-white shadow-md flex items-center justify-center gap-2">
              <UsersIcon />
              Fila de Espera Atual ({queue.length})
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-between">
            {/* Lista Ordenada */}
            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {queue.map((item, index) => (
                <div 
                  key={item.id}
                  className="bg-slate-950/60 border border-slate-850 p-3 rounded-xl flex items-center justify-between gap-3 hover:border-purple-900/30 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-850 flex items-center justify-center font-mono font-bold text-xs text-purple-400 shrink-0">
                      {index + 1}º
                    </div>
                    
                    <div className="min-w-0">
                      <h4 className="font-bold text-white text-base truncate">{item.singer}</h4>
                      <p className="text-[10px] text-slate-400">
                        Vezes que cantou: <strong className="text-purple-400">{item.performancesCount}</strong>
                      </p>
                    </div>
                  </div>

                  {/* Controles: Subir, Descer e Remover */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                      className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-purple-400 disabled:opacity-20 border border-slate-800"
                      title="Subir posição"
                    >
                      <ChevronUpIcon />
                    </button>
                    <button
                      onClick={() => handleMoveDown(index)}
                      disabled={index === queue.length - 1}
                      className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-purple-400 disabled:opacity-20 border border-slate-800"
                      title="Descer posição"
                    >
                      <ChevronDownIcon />
                    </button>
                    <button
                      onClick={() => handleRemoveSinger(item.id, item.singer)}
                      className="p-2 rounded-lg bg-slate-900 text-slate-500 hover:text-red-400 border border-slate-800 transition-colors"
                      title="Remover da festa"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Histórico */}
            <div className="mt-6 pt-6 border-t border-slate-800">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <HistoryIcon /> Últimas Apresentações Concluídas
              </h3>

              <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                {history.map((item) => (
                  <div 
                    key={item.id}
                    className="bg-slate-950/30 border border-slate-850 p-2.5 rounded-lg flex items-center justify-between gap-3 text-xs"
                  >
                    <span className="font-bold text-slate-300">{item.singer}</span>
                    <span className="text-slate-500 font-mono">Cantou ({item.finishedAt})</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      </main>

      <footer className="border-t border-slate-900 py-4 mt-8 text-center text-[10px] text-slate-500">
        <p>Karaokê Rotativo - Adicionar, remover e reordenar liberados.</p>
      </footer>
    </div>
  );
}