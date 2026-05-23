import React, { useEffect, useState } from 'react';
import { ensureAnonymousSession } from './services/authService';
import { createRoom as createRoomOnSupabase, joinRoom as joinRoomOnSupabase } from './services/roomService';

const MicIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
    <path d="M19 10v1a7 7 0 0 1-14 0v-1" />
    <line x1="12" x2="12" y1="19" y2="22" />
  </svg>
);

const UsersIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const SkipForwardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="5 4 15 12 5 20 5 4" />
    <line x1="19" x2="19" y1="5" y2="19" />
  </svg>
);

const HistoryIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <polyline points="3 3 3 8 8 8" />
    <line x1="12" x2="12" y1="7" y2="12" />
    <line x1="12" x2="16" y1="12" y2="12" />
  </svg>
);

const SparklesIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
  </svg>
);

const ChevronUpIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m18 15-6-6-6 6" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m6 9 6 6 6-6" />
  </svg>
);

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18" />
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
  </svg>
);

const UserPlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <line x1="19" x2="19" y1="8" y2="14" />
    <line x1="16" x2="22" y1="11" y2="11" />
  </svg>
);

const ArrowLeftIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 19-7-7 7-7" />
    <path d="M19 12H5" />
  </svg>
);

const DoorIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 4h3a2 2 0 0 1 2 2v14" />
    <path d="M2 20h20" />
    <path d="M13 20V2L6 4v16" />
    <path d="M10 12h.01" />
  </svg>
);

const withLocalRoomState = (roomSession) => {
  const initialSinger = roomSession.members.find((member) => member.role === 'owner') || roomSession.members[0];

  return {
    ...roomSession,
    currentSinger: initialSinger
      ? { id: `current-${initialSinger.id}`, memberId: initialSinger.id, singer: initialSinger.name, performancesCount: 0 }
      : null,
    queue: [],
    history: [],
  };
};

function Shell({ children }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-purple-600 selection:text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-4 sm:px-6 lg:px-8">
        {children}
      </div>
    </div>
  );
}

function BrandHeader({ subtitle }) {
  return (
    <header className="flex items-center gap-3 py-3">
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-tr from-purple-600 to-pink-500 shadow-lg shadow-purple-900/30">
        <MicIcon />
      </div>
      <div className="min-w-0">
        <h1 className="text-xl font-black tracking-wide text-white">Listaokê</h1>
        <p className="truncate text-xs font-bold uppercase tracking-widest text-slate-400">{subtitle}</p>
      </div>
    </header>
  );
}

function TextInput({ label, value, onChange, placeholder, autoFocus }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-400">{label}</span>
      <input
        autoFocus={autoFocus}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-12 w-full rounded-xl border border-slate-800 bg-slate-950 px-4 text-base font-semibold text-slate-100 outline-none transition focus:border-purple-500"
      />
    </label>
  );
}

function PrimaryButton({ children, type = 'button', onClick, disabled }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="min-h-12 rounded-xl bg-purple-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-purple-950/30 transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {children}
    </button>
  );
}

function SecondaryButton({ children, type = 'button', onClick, disabled }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="min-h-12 rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm font-bold text-slate-200 transition hover:border-purple-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
    >
      {children}
    </button>
  );
}

function ErrorBanner({ message }) {
  if (!message) return null;

  return (
    <div className="rounded-xl border border-red-800/70 bg-red-950/40 px-4 py-3 text-sm font-semibold text-red-100">
      {message}
    </div>
  );
}

function LoadingScreen({ message }) {
  return (
    <Shell>
      <BrandHeader subtitle="preparando sua sessão" />
      <main className="flex flex-1 items-center justify-center py-8">
        <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 text-center shadow-2xl shadow-slate-950/50">
          <div className="mx-auto mb-4 h-10 w-10 animate-pulse rounded-xl bg-purple-600" />
          <p className="text-sm font-bold text-slate-300">{message}</p>
        </div>
      </main>
    </Shell>
  );
}

function IconButton({ children, label, onClick, disabled, tone = 'default' }) {
  const toneClass = tone === 'danger'
    ? 'hover:border-red-700 hover:text-red-300'
    : 'hover:border-purple-700 hover:text-purple-300';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-slate-800 bg-slate-900 text-slate-400 transition disabled:cursor-not-allowed disabled:opacity-25 ${toneClass}`}
    >
      {children}
    </button>
  );
}

function HomeScreen({ onCreate, onJoin }) {
  const [roomCode, setRoomCode] = useState('');

  const submitJoin = (event) => {
    event.preventDefault();
    onJoin(roomCode);
  };

  return (
    <Shell>
      <BrandHeader subtitle="salas compartilhadas de karaokê" />
      <main className="flex flex-1 items-center justify-center py-8">
        <section className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-2xl shadow-slate-950/50 sm:p-6">
          <div className="mb-6">
            <h2 className="text-3xl font-black tracking-tight text-white">Organize a fila da festa</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">Crie uma sala local mockada ou entre com um código para testar o fluxo inicial.</p>
          </div>

          <div className="grid gap-3">
            <PrimaryButton onClick={onCreate}>Criar sala</PrimaryButton>

            <form onSubmit={submitJoin} className="grid gap-3 border-t border-slate-800 pt-4">
              <TextInput
                label="Entrar com código"
                value={roomCode}
                onChange={setRoomCode}
                placeholder="Ex: ABC123"
              />
              <SecondaryButton type="submit">Continuar</SecondaryButton>
            </form>
          </div>
        </section>
      </main>
    </Shell>
  );
}

function CreateRoomScreen({ onBack, onCreateRoom, isBusy, error }) {
  const [roomName, setRoomName] = useState('');
  const [userName, setUserName] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!roomName.trim() || !userName.trim()) return;
    onCreateRoom({ roomName, userName });
  };

  return (
    <Shell>
      <BrandHeader subtitle="criar sala" />
      <main className="flex flex-1 items-center justify-center py-8">
        <section className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-2xl shadow-slate-950/50 sm:p-6">
          <button type="button" onClick={onBack} className="mb-5 flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-white">
            <ArrowLeftIcon /> Voltar
          </button>
          <h2 className="mb-5 text-2xl font-black text-white">Criar sala</h2>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <ErrorBanner message={error} />
            <TextInput label="Nome da sala" value={roomName} onChange={setRoomName} placeholder="Karaokê da galera" autoFocus />
            <TextInput label="Seu nome" value={userName} onChange={setUserName} placeholder="Como vão te chamar" />
            <PrimaryButton type="submit" disabled={isBusy || !roomName.trim() || !userName.trim()}>
              {isBusy ? 'Criando...' : 'Criar'}
            </PrimaryButton>
          </form>
        </section>
      </main>
    </Shell>
  );
}

function JoinRoomScreen({ initialCode, onBack, onJoinRoom, isBusy, error }) {
  const [roomCode, setRoomCode] = useState(initialCode);
  const [userName, setUserName] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!roomCode.trim() || !userName.trim()) return;
    onJoinRoom({ roomCode, userName });
  };

  return (
    <Shell>
      <BrandHeader subtitle="entrar na sala" />
      <main className="flex flex-1 items-center justify-center py-8">
        <section className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-2xl shadow-slate-950/50 sm:p-6">
          <button type="button" onClick={onBack} className="mb-5 flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-white">
            <ArrowLeftIcon /> Voltar
          </button>
          <h2 className="mb-5 text-2xl font-black text-white">Entrar na sala</h2>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <TextInput label="Código da sala" value={roomCode} onChange={(value) => setRoomCode(value.toUpperCase())} placeholder="Ex: ABC123" autoFocus />
            <TextInput label="Seu nome" value={userName} onChange={setUserName} placeholder="Como vão te chamar" />
            <ErrorBanner message={error} />
            <PrimaryButton type="submit" disabled={isBusy || !roomCode.trim() || !userName.trim()}>
              {isBusy ? 'Entrando...' : 'Entrar'}
            </PrimaryButton>
          </form>
        </section>
      </main>
    </Shell>
  );
}

function RoomScreen({ session, onUpdateSession, onLeaveRoom }) {
  const [newSingerName, setNewSingerName] = useState('');
  const [notice, setNotice] = useState('');

  const { room, me, members, currentSinger, queue, history } = session;
  const isOwner = me.role === 'owner';
  const isMyTurn = currentSinger?.memberId === me.id;
  const myQueuedItem = queue.find((item) => item.memberId === me.id);

  const updateRoom = (changes, message) => {
    onUpdateSession((current) => ({
      ...current,
      ...changes,
    }));
    if (message) setNotice(message);
  };

  const addQueueItem = ({ name, memberId }) => {
    const singerName = name.trim();
    if (!singerName) return;

    updateRoom({
      queue: [
        ...queue,
        {
          id: `queue-${Date.now()}`,
          memberId,
          singer: singerName,
          performancesCount: 0,
        },
      ],
    }, `${singerName} entrou no fim da fila.`);
  };

  const handleOwnerAddSinger = (event) => {
    event.preventDefault();
    addQueueItem({ name: newSingerName, memberId: `manual-${Date.now()}` });
    setNewSingerName('');
  };

  const handleJoinQueue = () => {
    if (isMyTurn || myQueuedItem) return;
    addQueueItem({ name: me.name, memberId: me.id });
  };

  const handleRemoveSinger = (id, name) => {
    updateRoom({ queue: queue.filter((item) => item.id !== id) }, `${name} saiu da fila.`);
  };

  const handleMove = (index, direction) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= queue.length) return;

    const newQueue = [...queue];
    [newQueue[index], newQueue[nextIndex]] = [newQueue[nextIndex], newQueue[index]];
    updateRoom({ queue: newQueue });
  };

  const rotateCurrentToQueue = ({ addToHistory }) => {
    if (!currentSinger || queue.length === 0) return;

    const now = new Date();
    const finishedAt = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const rotatedSinger = {
      ...currentSinger,
      performancesCount: currentSinger.performancesCount + (addToHistory ? 1 : 0),
    };
    const nextQueue = [...queue, rotatedSinger];
    const nextSinger = nextQueue[0];
    const nextHistory = addToHistory
      ? [{ id: `h-${Date.now()}`, singer: currentSinger.singer, finishedAt }, ...history]
      : history;

    updateRoom({
      currentSinger: nextSinger,
      queue: nextQueue.slice(1),
      history: nextHistory,
    }, addToHistory ? `${currentSinger.singer} concluiu a apresentação.` : `${currentSinger.singer} passou a vez.`);
  };

  const handleCloseRoom = () => {
    setNotice('Fechar sala ainda não foi conectado ao Supabase nesta etapa.');
  };

  const handleTransferOwner = () => {
    setNotice('Transferir dono ainda não foi conectado ao Supabase nesta etapa.');
  };

  const guestCanActOnCurrent = !isOwner && isMyTurn;

  return (
    <Shell>
      <BrandHeader subtitle="sala conectada ao Supabase" />

      <main className="grid flex-1 gap-5 py-4 lg:grid-cols-12 lg:gap-6">
        <section className="lg:col-span-5">
          <div className="rounded-2xl border border-purple-500/20 bg-gradient-to-b from-slate-900 to-slate-950 p-5 shadow-2xl shadow-slate-950/50">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-widest text-pink-400">Sala</p>
                <h2 className="mt-1 break-words text-3xl font-black text-white">{room.name}</h2>
                <p className="mt-2 font-mono text-sm font-bold text-purple-300">Código: {room.code}</p>
              </div>
              <span className="w-max rounded-full border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs font-black uppercase tracking-widest text-slate-300">
                {isOwner ? 'Dono' : 'Convidado'}
              </span>
            </div>

            {notice && (
              <div className="mb-5 rounded-xl border border-purple-500/30 bg-purple-950/40 px-4 py-3 text-sm font-semibold text-purple-100">
                {notice}
              </div>
            )}

            <div className="mb-5 rounded-xl border border-slate-800 bg-slate-950/70 p-4">
              <h3 className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-300">
                <UsersIcon /> Membros
              </h3>
              <div className="grid gap-2">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between gap-3 rounded-lg bg-slate-900 px-3 py-2 text-sm">
                    <span className="min-w-0 truncate font-bold text-slate-100">
                      {member.name}{member.user_id === me.user_id ? ' (você)' : ''}
                    </span>
                    <span className="shrink-0 rounded-full border border-slate-700 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      {member.role === 'owner' ? 'Dono' : 'Convidado'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
              <span className="flex w-max items-center gap-2 rounded-full border border-pink-500/20 bg-pink-500/10 px-3 py-1 text-xs font-black uppercase tracking-widest text-pink-400">
                <span className="h-2 w-2 rounded-full bg-pink-500" />
                Cantando agora
              </span>

              {currentSinger ? (
                <div className="mt-5">
                  <h3 className="break-words text-4xl font-black text-white">{currentSinger.singer}</h3>
                  <p className="mt-3 flex items-center gap-2 text-xs font-semibold text-slate-400">
                    <SparklesIcon />
                    Já cantou {currentSinger.performancesCount} vezes hoje
                  </p>
                </div>
              ) : (
                <p className="mt-5 text-sm text-slate-500">Ninguém cantando agora.</p>
              )}

              {(isOwner || guestCanActOnCurrent) && currentSinger && (
                <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {isOwner && (
                    <button
                      type="button"
                      onClick={() => rotateCurrentToQueue({ addToHistory: true })}
                      disabled={queue.length === 0}
                      className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-3 text-sm font-black text-white transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <CheckIcon /> Concluir
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => rotateCurrentToQueue({ addToHistory: false })}
                    disabled={queue.length === 0}
                    className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-bold text-slate-200 transition hover:border-purple-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Passar vez <SkipForwardIcon />
                  </button>
                </div>
              )}
            </div>

            {isOwner ? (
              <div className="mt-5 grid gap-3">
                <form onSubmit={handleOwnerAddSinger} className="grid gap-3">
                  <TextInput label="Adicionar pessoa" value={newSingerName} onChange={setNewSingerName} placeholder="Nome do convidado" />
                  <PrimaryButton type="submit" disabled={!newSingerName.trim()}>Inserir na fila</PrimaryButton>
                </form>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <SecondaryButton onClick={handleTransferOwner}>Transferir dono</SecondaryButton>
                  <button
                    type="button"
                    onClick={handleCloseRoom}
                    className="min-h-12 rounded-xl border border-red-900/60 bg-red-950/30 px-4 py-3 text-sm font-bold text-red-200 transition hover:border-red-700"
                  >
                    Fechar sala
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-5 grid gap-3">
                <PrimaryButton onClick={handleJoinQueue} disabled={Boolean(isMyTurn || myQueuedItem)}>Entrar na fila</PrimaryButton>
                {myQueuedItem && (
                  <SecondaryButton onClick={() => handleRemoveSinger(myQueuedItem.id, myQueuedItem.singer)}>Sair da minha vez</SecondaryButton>
                )}
              </div>
            )}

            <button type="button" onClick={onLeaveRoom} className="mt-5 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-950 px-4 text-sm font-bold text-slate-300 transition hover:border-purple-700 hover:text-white">
              <DoorIcon /> Sair da tela da sala
            </button>
          </div>
        </section>

        <section className="grid gap-5 lg:col-span-7">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-white">
                <UsersIcon /> Fila
              </h2>
              <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-bold text-purple-300">{queue.length} pessoas</span>
            </div>

            <div className="grid gap-2">
              {queue.length === 0 ? (
                <p className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm text-slate-500">A fila está vazia.</p>
              ) : queue.map((item, index) => {
                const isMine = item.memberId === me.id;
                const canManageItem = isOwner || isMine;

                return (
                  <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/70 p-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-slate-800 bg-slate-900 font-mono text-xs font-bold text-purple-300">
                        {index + 1}
                      </div>
                      <div className="min-w-0">
                        <h3 className="truncate text-base font-bold text-white">{item.singer}</h3>
                        <p className="text-xs text-slate-400">
                          Cantou {item.performancesCount} vezes {isMine ? '- você' : ''}
                        </p>
                      </div>
                    </div>

                    {canManageItem && (
                      <div className="flex items-center gap-1">
                        {isOwner && (
                          <>
                            <IconButton label="Subir posição" onClick={() => handleMove(index, -1)} disabled={index === 0}>
                              <ChevronUpIcon />
                            </IconButton>
                            <IconButton label="Descer posição" onClick={() => handleMove(index, 1)} disabled={index === queue.length - 1}>
                              <ChevronDownIcon />
                            </IconButton>
                          </>
                        )}
                        <IconButton label="Remover da fila" onClick={() => handleRemoveSinger(item.id, item.singer)} tone="danger">
                          <TrashIcon />
                        </IconButton>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-widest text-white">
              <HistoryIcon /> Histórico
            </h2>
            <div className="grid max-h-56 gap-2 overflow-y-auto pr-1">
              {history.length === 0 ? (
                <p className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm text-slate-500">Nenhuma apresentação concluída.</p>
              ) : history.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-sm">
                  <span className="font-bold text-slate-200">{item.singer}</span>
                  <span className="font-mono text-xs text-slate-500">{item.finishedAt}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </Shell>
  );
}

export default function App() {
  const [screen, setScreen] = useState('home');
  const [pendingCode, setPendingCode] = useState('');
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    ensureAnonymousSession()
      .then((currentUser) => {
        if (isMounted) setUser(currentUser);
      })
      .catch((authError) => {
        if (isMounted) setError(authError.message);
      })
      .finally(() => {
        if (isMounted) setAuthLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const openJoin = (code = '') => {
    setError('');
    setPendingCode(code.trim().toUpperCase());
    setScreen('join');
  };

  const createRoom = async ({ roomName, userName }) => {
    if (!user) {
      setError('Sessão anônima ainda não está pronta. Tente novamente em alguns segundos.');
      return;
    }

    setIsBusy(true);
    setError('');

    try {
      const roomSession = await createRoomOnSupabase({ name: roomName, userName, user });
      setSession(withLocalRoomState(roomSession));
      setScreen('room');
    } catch (createError) {
      setError(createError.message);
    } finally {
      setIsBusy(false);
    }
  };

  const joinRoom = async ({ roomCode, userName }) => {
    if (!user) {
      setError('Sessão anônima ainda não está pronta. Tente novamente em alguns segundos.');
      return;
    }

    setIsBusy(true);
    setError('');

    try {
      const roomSession = await joinRoomOnSupabase({ code: roomCode, userName, user });
      setSession(withLocalRoomState(roomSession));
      setScreen('room');
    } catch (joinError) {
      setError(joinError.message);
    } finally {
      setIsBusy(false);
    }
  };

  if (authLoading) {
    return <LoadingScreen message="Entrando anonimamente..." />;
  }

  if (screen === 'create') {
    return (
      <CreateRoomScreen
        onBack={() => {
          setError('');
          setScreen('home');
        }}
        onCreateRoom={createRoom}
        isBusy={isBusy}
        error={error}
      />
    );
  }

  if (screen === 'join') {
    return (
      <JoinRoomScreen
        initialCode={pendingCode}
        onBack={() => {
          setError('');
          setScreen('home');
        }}
        onJoinRoom={joinRoom}
        isBusy={isBusy}
        error={error}
      />
    );
  }

  if (screen === 'room' && session) {
    return (
      <RoomScreen
        session={session}
        onUpdateSession={setSession}
        onLeaveRoom={() => {
          setSession(null);
          setError('');
          setScreen('home');
        }}
      />
    );
  }

  return (
    <>
      {error && (
        <Shell>
          <BrandHeader subtitle="erro de autenticação" />
          <main className="flex flex-1 items-center justify-center py-8">
            <section className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <ErrorBanner message={error} />
            </section>
          </main>
        </Shell>
      )}
      {!error && <HomeScreen onCreate={() => setScreen('create')} onJoin={openJoin} />}
    </>
  );
}
