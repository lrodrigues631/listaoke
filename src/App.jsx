import { useCallback, useEffect, useState } from 'react';
import { ensureAnonymousSession } from './services/authService';
import { subscribeToRoomChanges } from './services/realtimeService';
import {
  closeRoom,
  createRoom as createRoomOnSupabase,
  joinRoom as joinRoomOnSupabase,
  loadRoomSession,
  transferRoomOwnership,
} from './services/roomService';
import {
  addMemberToQueue,
  finishCurrentPerformance,
  removeQueueItem,
  reorderWaitingQueue,
  skipQueueItem,
} from './services/queueService';

const MESSAGES = {
  createRoomNameRequired: 'Dá um nome para a sala antes de começar o show.',
  userNameRequired: 'Coloca seu nome para a galera saber quem está na fila.',
  roomCodeRequired: 'Coloca o código da sala para eu saber onde é o karaokê.',
  roomCreated: 'Sala criada. Agora é só chamar o povo.',
  joinedRoom: 'Você entrou na sala. Pode aquecer a voz.',
  inviteCopied: 'Convite copiado. Agora manda no grupo.',
  inviteCopyFailed: 'Não consegui copiar o convite. O navegador resolveu cantar fora do tom.',
  codeCopied: 'Código copiado.',
  codeCopyFailed: 'Não consegui copiar o código automaticamente.',
  queueJoined: 'Você entrou na fila.',
  queueLeft: 'saiu da fila.',
  skippedTurn: 'passou a vez.',
  finishedPerformance: 'concluiu a apresentação.',
  queueReordered: 'Ordem da fila ajustada.',
  roomClosed: 'A sala foi encerrada.',
  closedRoomAction: 'Sala encerrada. Ninguém mexe mais nessa fila.',
  transferSuccess: (name) => `Sala transferida. Agora ${name} segura o microfone da organização.`,
  transferConfirm: (name) => `Transferir a sala para ${name}? Você continua aqui, só passa o controle.`,
  closeConfirm: 'Tem certeza? Depois de fechar, ninguém mexe mais nessa fila.',
};

const EVENT_LABELS = {
  member_added_to_queue: 'Alguém entrou na fila.',
  member_left_queue: 'Alguém saiu da fila.',
  member_removed: 'Alguém foi removido da fila.',
  member_skipped_turn: 'Alguém passou a vez.',
  performance_finished: 'Um participante concluiu a apresentação.',
  queue_reordered: 'A ordem da fila foi ajustada.',
  room_closed: 'A sala foi encerrada.',
  room_created: 'A sala foi criada.',
  owner_transferred: 'A sala foi transferida.',
};

function buildInviteLink(code) {
  return `${window.location.origin}/?room=${code}`;
}

function getInitialRoomCode() {
  if (typeof window === 'undefined') return '';
  return new URLSearchParams(window.location.search).get('room')?.trim().toUpperCase() || '';
}

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
            <p className="mt-2 text-sm leading-6 text-slate-400">Crie uma sala online ou entre com um código compartilhado.</p>
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
              <SecondaryButton type="submit">Entrar na sala</SecondaryButton>
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
  const [formError, setFormError] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!roomName.trim()) {
      setFormError(MESSAGES.createRoomNameRequired);
      return;
    }
    if (!userName.trim()) {
      setFormError(MESSAGES.userNameRequired);
      return;
    }
    setFormError('');
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
            <ErrorBanner message={formError || error} />
            <TextInput label="Nome da sala" value={roomName} onChange={setRoomName} placeholder="Karaokê da galera" autoFocus />
            <TextInput label="Seu nome" value={userName} onChange={setUserName} placeholder="Como vão te chamar" />
            <PrimaryButton type="submit" disabled={isBusy}>
              {isBusy ? 'Criando...' : 'Criar sala'}
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
  const [formError, setFormError] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!roomCode.trim()) {
      setFormError(MESSAGES.roomCodeRequired);
      return;
    }
    if (!userName.trim()) {
      setFormError('Coloca seu nome antes de entrar, artista misterioso.');
      return;
    }
    setFormError('');
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
            <ErrorBanner message={formError || error} />
            <PrimaryButton type="submit" disabled={isBusy}>
              {isBusy ? 'Entrando...' : 'Entrar na sala'}
            </PrimaryButton>
          </form>
        </section>
      </main>
    </Shell>
  );
}

export function RoomScreen({ session, onReload, onLeaveRoom }) {
  const [notice, setNotice] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [selectedTransferMember, setSelectedTransferMember] = useState(null);

  const { room, me, members, queueItems, events } = session;
  const isOwner = me.role === 'owner';
  const isClosed = room.status === 'closed';
  const currentItem = queueItems.find((item) => item.status === 'on_stage') || null;
  const waitingItems = queueItems
    .filter((item) => item.status === 'waiting')
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  const activeOwnItem = queueItems.find((item) => (
    item.member_id === me.id && (item.status === 'waiting' || item.status === 'on_stage')
  ));
  const currentName = currentItem?.member?.name || 'Participante';
  const guestCanActOnCurrent = !isOwner && currentItem?.member_id === me.id;
  const transferCandidates = members.filter((member) => member.id !== me.id);

  const runAction = async (action, successMessage) => {
    if (isClosed) {
      setNotice('');
      setActionError(MESSAGES.closedRoomAction);
      return;
    }

    setActionLoading(true);
    setActionError('');
    setNotice('');

    try {
      await action();
      if (successMessage) setNotice(successMessage);
      await onReload();
    } catch (error) {
      setActionError(error.message || 'Algo deu errado. Tenta de novo em alguns segundos.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleJoinQueue = () => {
    runAction(
      () => addMemberToQueue({ roomId: room.id, memberId: me.id }),
      'Você entrou na fila.'
    );
  };

  const handleRemoveItem = (item) => {
    runAction(
      () => removeQueueItem({ roomId: room.id, queueItem: item, actorMemberId: me.id, isOwner }),
      `${item.member?.name || 'Participante'} saiu da fila.`
    );
  };

  const handleSkipItem = (item) => {
    runAction(
      () => skipQueueItem({ roomId: room.id, queueItem: item, actorMemberId: me.id, isOwner }),
      `${item.member?.name || 'Participante'} passou a vez.`
    );
  };

  const handleFinishCurrent = () => {
    if (!currentItem) return;
    runAction(
      () => finishCurrentPerformance({ roomId: room.id, queueItem: currentItem }),
      `${currentName} concluiu a apresentação.`
    );
  };

  const handleMove = (index, direction) => {
    const nextIndex = index + direction;
    if (!isOwner || nextIndex < 0 || nextIndex >= waitingItems.length) return;

    const reordered = [...waitingItems];
    [reordered[index], reordered[nextIndex]] = [reordered[nextIndex], reordered[index]];

    runAction(
      () => reorderWaitingQueue({ roomId: room.id, waitingItems: reordered, actorMemberId: me.id }),
      'Fila reordenada.'
    );
  };

  const handleCloseRoom = () => {
    runAction(
      () => closeRoom({ roomId: room.id, userId: me.user_id }),
      'Sala encerrada.'
    );
  };

  const handleOpenTransfer = () => {
    setActionError('');
    setNotice('');
    setSelectedTransferMember(null);
    setIsTransferOpen(true);
  };

  const handleConfirmTransfer = () => {
    if (!selectedTransferMember) return;

    runAction(
      () => transferRoomOwnership({
        roomId: room.id,
        newOwnerMemberId: selectedTransferMember.id,
      }),
      `Sala transferida para ${selectedTransferMember.name}. Você continua na sala como convidado.`
    ).then(() => {
      setIsTransferOpen(false);
      setSelectedTransferMember(null);
    });
  };

  return (
    <Shell>
      <BrandHeader subtitle="sala em tempo real" />

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
            <ErrorBanner message={actionError} />

            <div className="mb-5 mt-5 rounded-xl border border-slate-800 bg-slate-950/70 p-4">
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

              {currentItem ? (
                <div className="mt-5">
                  <h3 className="break-words text-4xl font-black text-white">{currentName}</h3>
                  <p className="mt-3 flex items-center gap-2 text-xs font-semibold text-slate-400">
                    <SparklesIcon />
                    Participante ativo da sessão
                  </p>
                </div>
              ) : (
                <p className="mt-5 text-sm text-slate-500">Ninguém cantando agora.</p>
              )}

              {(isOwner || guestCanActOnCurrent) && currentItem && (
                <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {isOwner && (
                    <button
                      type="button"
                      onClick={handleFinishCurrent}
                      disabled={actionLoading}
                      className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-3 text-sm font-black text-white transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <CheckIcon /> Concluir
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleSkipItem(currentItem)}
                    disabled={actionLoading}
                    className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-bold text-slate-200 transition hover:border-purple-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Passar vez <SkipForwardIcon />
                  </button>
                </div>
              )}
            </div>

            {isOwner ? (
              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <SecondaryButton onClick={handleOpenTransfer}>Transferir sala</SecondaryButton>
                <button
                  type="button"
                  onClick={handleCloseRoom}
                  className="min-h-12 rounded-xl border border-red-900/60 bg-red-950/30 px-4 py-3 text-sm font-bold text-red-200 transition hover:border-red-700"
                >
                  Fechar sala
                </button>
              </div>
            ) : (
              <div className="mt-5 grid gap-3">
                <PrimaryButton onClick={handleJoinQueue} disabled={actionLoading || Boolean(activeOwnItem)}>Entrar na fila</PrimaryButton>
                {activeOwnItem && (
                  <SecondaryButton onClick={() => handleRemoveItem(activeOwnItem)} disabled={actionLoading}>Sair da minha vez</SecondaryButton>
                )}
              </div>
            )}

            {isOwner && isTransferOpen && (
              <div className="mt-5 rounded-xl border border-purple-500/30 bg-slate-950/80 p-4">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-white">Transferir sala</h3>
                    <p className="mt-1 text-xs leading-5 text-slate-400">Escolha quem será o novo dono desta sala.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsTransferOpen(false);
                      setSelectedTransferMember(null);
                    }}
                    className="rounded-lg border border-slate-800 px-3 py-1 text-xs font-bold text-slate-300 transition hover:border-purple-700 hover:text-white"
                  >
                    Fechar
                  </button>
                </div>

                {transferCandidates.length === 0 ? (
                  <p className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-3 text-sm font-semibold text-slate-300">
                    Não há outro membro para receber a sala.
                  </p>
                ) : (
                  <div className="grid gap-3">
                    <div className="grid gap-2">
                      {transferCandidates.map((member) => {
                        const isSelected = selectedTransferMember?.id === member.id;

                        return (
                          <button
                            key={member.id}
                            type="button"
                            onClick={() => setSelectedTransferMember(member)}
                            className={`min-h-11 rounded-lg border px-3 text-left text-sm font-bold transition ${
                              isSelected
                                ? 'border-purple-500 bg-purple-950/50 text-white'
                                : 'border-slate-800 bg-slate-900 text-slate-300 hover:border-purple-700'
                            }`}
                          >
                            {member.name}
                          </button>
                        );
                      })}
                    </div>

                    {selectedTransferMember && (
                      <div className="rounded-lg border border-slate-800 bg-slate-900 p-3">
                        <p className="text-sm font-semibold leading-6 text-slate-200">
                          Transferir a sala para {selectedTransferMember.name}? Você continuará na sala como convidado.
                        </p>
                        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                          <PrimaryButton onClick={handleConfirmTransfer} disabled={actionLoading}>
                            {actionLoading ? 'Transferindo...' : 'Confirmar'}
                          </PrimaryButton>
                          <SecondaryButton onClick={() => setSelectedTransferMember(null)} disabled={actionLoading}>
                            Cancelar
                          </SecondaryButton>
                        </div>
                      </div>
                    )}
                  </div>
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
              <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-bold text-purple-300">{waitingItems.length} pessoas</span>
            </div>

            <div className="grid gap-2">
              {waitingItems.length === 0 ? (
                <p className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm text-slate-500">A fila está vazia.</p>
              ) : waitingItems.map((item, index) => {
                const isMine = item.member_id === me.id;
                const canManageItem = isOwner || isMine;
                const itemName = item.member?.name || 'Participante';

                return (
                  <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/70 p-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-slate-800 bg-slate-900 font-mono text-xs font-bold text-purple-300">
                        {index + 1}
                      </div>
                      <div className="min-w-0">
                        <h3 className="truncate text-base font-bold text-white">{itemName}</h3>
                        <p className="text-xs text-slate-400">
                          Aguardando {isMine ? '- você' : ''}
                        </p>
                      </div>
                    </div>

                    {!isClosed && canManageItem && (
                      <div className="flex items-center gap-1">
                        {isOwner && (
                          <>
                            <IconButton label="Subir posição" onClick={() => handleMove(index, -1)} disabled={actionLoading || index === 0}>
                              <ChevronUpIcon />
                            </IconButton>
                            <IconButton label="Descer posição" onClick={() => handleMove(index, 1)} disabled={actionLoading || index === waitingItems.length - 1}>
                              <ChevronDownIcon />
                            </IconButton>
                          </>
                        )}
                        <IconButton label="Passar vez" onClick={() => handleSkipItem(item)} disabled={actionLoading}>
                          <SkipForwardIcon />
                        </IconButton>
                        <IconButton label="Remover da fila" onClick={() => handleRemoveItem(item)} disabled={actionLoading} tone="danger">
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
              {events.length === 0 ? (
                <p className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm text-slate-500">Nenhum evento registrado.</p>
              ) : events.map((event) => {
                const member = members.find((item) => item.id === event.member_id);
                const time = event.created_at
                  ? new Date(event.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                  : '';

                return (
                  <div key={event.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-sm">
                    <span className="font-bold text-slate-200">{member?.name || 'Sala'} {EVENT_LABELS[event.type] || event.type}</span>
                    <span className="font-mono text-xs text-slate-500">{time}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>
    </Shell>
  );
}

function RoomScreenV2({ session, initialNotice, onReload, onLeaveRoom }) {
  const [notice, setNotice] = useState(initialNotice || '');
  const [actionError, setActionError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [selectedTransferMember, setSelectedTransferMember] = useState(null);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  const { room, me, members, queueItems, events } = session;
  const isOwner = me.role === 'owner';
  const isClosed = room.status === 'closed';
  const currentItem = queueItems.find((item) => item.status === 'on_stage') || null;
  const waitingItems = queueItems
    .filter((item) => item.status === 'waiting')
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  const activeOwnItem = queueItems.find((item) => (
    item.member_id === me.id && (item.status === 'waiting' || item.status === 'on_stage')
  ));
  const currentName = currentItem?.member?.name || 'Participante';
  const currentIsMe = currentItem?.member_id === me.id;
  const myWaitingIndex = waitingItems.findIndex((item) => item.member_id === me.id);
  const myPosition = myWaitingIndex >= 0 ? myWaitingIndex + 1 : null;
  const myStatus = currentIsMe
    ? 'Você está no palco. Manda ver.'
    : myPosition === 1
      ? 'Você é o próximo. Vai aquecendo a voz.'
      : myPosition
        ? 'Você está na fila. Sua hora vai chegar.'
        : 'Você ainda está fora da fila.';
  const transferCandidates = members.filter((member) => member.id !== me.id);
  const addableMembers = members.filter((member) => (
    !queueItems.some((item) => item.member_id === member.id && (item.status === 'waiting' || item.status === 'on_stage'))
  ));

  const runAction = async (action, successMessage) => {
    if (isClosed) {
      setNotice('');
      setActionError(MESSAGES.closedRoomAction);
      return;
    }

    setActionLoading(true);
    setActionError('');
    setNotice('');

    try {
      await action();
      if (successMessage) setNotice(successMessage);
      await onReload();
    } catch (error) {
      setActionError(error.message || 'Algo deu errado. Tenta de novo em alguns segundos.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleJoinQueue = (memberId = me.id, successName = 'Você') => {
    runAction(
      () => addMemberToQueue({ roomId: room.id, memberId }),
      `${successName} entrou na fila.`
    );
  };

  const handleRemoveItem = (item) => {
    runAction(
      () => removeQueueItem({ roomId: room.id, queueItem: item, actorMemberId: me.id, isOwner }),
      `${item.member?.name || 'Participante'} ${MESSAGES.queueLeft}`
    );
  };

  const handleSkipItem = (item) => {
    runAction(
      () => skipQueueItem({ roomId: room.id, queueItem: item, actorMemberId: me.id, isOwner }),
      `${item.member?.name || 'Participante'} ${MESSAGES.skippedTurn}`
    );
  };

  const handleFinishCurrent = () => {
    if (!currentItem) return;
    runAction(
      () => finishCurrentPerformance({ roomId: room.id, queueItem: currentItem }),
      `${currentName} ${MESSAGES.finishedPerformance}`
    );
  };

  const handleMove = (index, direction) => {
    const nextIndex = index + direction;
    if (!isOwner || nextIndex < 0 || nextIndex >= waitingItems.length) return;

    const reordered = [...waitingItems];
    [reordered[index], reordered[nextIndex]] = [reordered[nextIndex], reordered[index]];

    runAction(
      () => reorderWaitingQueue({ roomId: room.id, waitingItems: reordered, actorMemberId: me.id }),
      MESSAGES.queueReordered
    );
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(room.code);
      setActionError('');
      setNotice(MESSAGES.codeCopied);
    } catch {
      setNotice('');
      setActionError(MESSAGES.codeCopyFailed);
    }
  };

  const handleCopyInvite = async () => {
    try {
      await navigator.clipboard.writeText(buildInviteLink(room.code));
      setActionError('');
      setNotice(MESSAGES.inviteCopied);
    } catch {
      setNotice('');
      setActionError(MESSAGES.inviteCopyFailed);
    }
  };

  const handleCloseRoom = () => {
    runAction(
      () => closeRoom({ roomId: room.id, userId: me.user_id }),
      MESSAGES.roomClosed
    ).then(() => {
      setShowCloseConfirm(false);
    });
  };

  const handleOpenTransfer = () => {
    setActionError('');
    setNotice('');
    setSelectedTransferMember(null);
    setIsTransferOpen(true);
  };

  const handleConfirmTransfer = () => {
    if (!selectedTransferMember) return;

    runAction(
      () => transferRoomOwnership({
        roomId: room.id,
        newOwnerMemberId: selectedTransferMember.id,
      }),
      MESSAGES.transferSuccess(selectedTransferMember.name)
    ).then(() => {
      setIsTransferOpen(false);
      setSelectedTransferMember(null);
    });
  };

  const eventText = (event) => {
    const member = members.find((item) => item.id === event.member_id);
    if (member) return `${member.name} ${EVENT_LABELS[event.type]?.replace(/^Alguém /, '').replace(/^Um participante /, '') || event.type}`;
    return EVENT_LABELS[event.type] || event.type;
  };

  return (
    <Shell>
      <header className="sticky top-0 z-30 -mx-4 border-b border-slate-900 bg-slate-950/95 px-4 pb-3 pt-2 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-widest text-pink-400">{isOwner ? 'Dono' : 'Convidado'}</p>
            <h1 className="truncate text-xl font-black text-white">{room.name}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm font-bold text-purple-300">{room.code}</span>
              <button type="button" onClick={handleCopyCode} className="rounded-lg border border-slate-800 px-2.5 py-1 text-xs font-bold text-slate-300">
                Copiar código
              </button>
              <button type="button" onClick={handleCopyInvite} className="rounded-lg border border-purple-800/70 bg-purple-950/40 px-2.5 py-1 text-xs font-bold text-purple-100">
                Copiar convite
              </button>
            </div>
          </div>
          <button type="button" onClick={onLeaveRoom} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-800 bg-slate-900 text-slate-300" aria-label="Sair da sala">
            <DoorIcon />
          </button>
        </div>
      </header>

      <main className="grid flex-1 gap-4 py-4 lg:grid-cols-[1fr_0.85fr] lg:gap-5">
        <section className="grid gap-4">
          {notice && (
            <div className="rounded-xl border border-purple-500/30 bg-purple-950/40 px-4 py-3 text-sm font-semibold text-purple-100">
              {notice}
            </div>
          )}
          {isClosed && (
            <div className="rounded-2xl border border-red-800/70 bg-red-950/40 p-5">
              <p className="text-xs font-black uppercase tracking-widest text-red-300">Sala encerrada</p>
              <h2 className="mt-2 text-2xl font-black text-white">Essa sala já foi encerrada.</h2>
              <p className="mt-2 text-sm leading-6 text-red-100/80">O karaokê dessa turma acabou por hoje. A fila ficou só para consulta.</p>
            </div>
          )}
          <ErrorBanner message={actionError} />

          <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-b from-slate-900 to-slate-950 p-5 shadow-2xl shadow-slate-950/50">
            <span className="flex w-max items-center gap-2 rounded-full border border-pink-500/20 bg-pink-500/10 px-3 py-1 text-xs font-black uppercase tracking-widest text-pink-400">
              <span className="h-2 w-2 rounded-full bg-pink-500" />
              Cantando agora
            </span>
            {currentItem ? (
              <div className="mt-4">
                <h2 className="break-words text-4xl font-black text-white">{currentName}{currentIsMe ? ' (você)' : ''}</h2>
                {!currentIsMe && myPosition && (
                  <p className="mt-3 text-sm font-semibold text-slate-300">Você está em {myPosition}º na fila.</p>
                )}
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-500">Ninguém está cantando agora.</p>
            )}
            {!isClosed && currentItem && (isOwner || currentIsMe) && (
              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                <PrimaryButton onClick={handleFinishCurrent} disabled={actionLoading || isClosed}>
                  <CheckIcon /> {currentIsMe ? 'Concluir minha vez' : 'Concluir apresentação'}
                </PrimaryButton>
                <SecondaryButton onClick={() => handleSkipItem(currentItem)} disabled={actionLoading || isClosed}>
                  Passar minha vez
                </SecondaryButton>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-xl">
            <h2 className="text-sm font-black uppercase tracking-widest text-white">Minha participação</h2>
            <div className="mt-3 rounded-xl bg-slate-950/70 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-lg font-black text-white">{me.name}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-400">
                    <span className="text-purple-300">{myStatus}</span>{myPosition ? ` • ${myPosition}º na fila` : ''}
                  </p>
                </div>
                <span className="shrink-0 rounded-full border border-slate-700 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  {isOwner ? 'Dono' : 'Convidado'}
                </span>
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {!activeOwnItem && !isClosed && <PrimaryButton onClick={() => handleJoinQueue()} disabled={actionLoading || isClosed}>Entrar na fila</PrimaryButton>}
                {!isClosed && activeOwnItem?.status === 'waiting' && (
                  <>
                    <SecondaryButton onClick={() => handleRemoveItem(activeOwnItem)} disabled={actionLoading || isClosed}>Sair da fila</SecondaryButton>
                    <SecondaryButton onClick={() => handleSkipItem(activeOwnItem)} disabled={actionLoading || isClosed}>Passar minha vez</SecondaryButton>
                  </>
                )}
                {!isClosed && activeOwnItem?.status === 'on_stage' && (
                  <>
                    <PrimaryButton onClick={handleFinishCurrent} disabled={actionLoading || isClosed}>Concluir minha vez</PrimaryButton>
                    <SecondaryButton onClick={() => handleSkipItem(activeOwnItem)} disabled={actionLoading || isClosed}>Passar minha vez</SecondaryButton>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-white">
                <UsersIcon /> Fila
              </h2>
              <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-bold text-purple-300">{waitingItems.length} aguardando</span>
            </div>

            <div className="grid gap-2">
              {currentItem && (
                <div className="rounded-xl border border-pink-500/30 bg-pink-950/20 p-3">
                  <p className="text-xs font-black uppercase tracking-widest text-pink-300">No palco</p>
                  <p className="mt-1 font-bold text-white">{currentName}{currentIsMe ? ' (você)' : ''}</p>
                </div>
              )}
              {waitingItems.length === 0 ? (
                <p className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm text-slate-500">A fila está vazia. Coragem, alguém precisa começar.</p>
              ) : waitingItems.map((item, index) => {
                const isMine = item.member_id === me.id;
                const canManageItem = isOwner || isMine;
                const itemName = item.member?.name || 'Participante';

                return (
                  <div key={item.id} className={`flex items-center justify-between gap-3 rounded-xl border p-3 ${isMine ? 'border-purple-500/50 bg-purple-950/25' : 'border-slate-800 bg-slate-950/70'}`}>
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-slate-800 bg-slate-900 font-mono text-xs font-bold text-purple-300">
                        {index + 1}
                      </div>
                      <div className="min-w-0">
                        <h3 className="truncate text-base font-bold text-white">{itemName}{isMine ? ' (você)' : ''}</h3>
                        <p className="text-xs text-slate-400">Aguardando</p>
                      </div>
                    </div>
                    {canManageItem && (
                      <div className="flex items-center gap-1">
                        {isOwner && (
                          <>
                            <IconButton label="Subir posição" onClick={() => handleMove(index, -1)} disabled={actionLoading || index === 0}>
                              <ChevronUpIcon />
                            </IconButton>
                            <IconButton label="Descer posição" onClick={() => handleMove(index, 1)} disabled={actionLoading || index === waitingItems.length - 1}>
                              <ChevronDownIcon />
                            </IconButton>
                          </>
                        )}
                        <IconButton label="Passar minha vez" onClick={() => handleSkipItem(item)} disabled={actionLoading}>
                          <SkipForwardIcon />
                        </IconButton>
                        <IconButton label="Remover da fila" onClick={() => handleRemoveItem(item)} disabled={actionLoading} tone="danger">
                          <TrashIcon />
                        </IconButton>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <aside className="grid content-start gap-4">
          {isOwner && !isClosed && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-xl">
              <h2 className="text-sm font-black uppercase tracking-widest text-white">Administração da sala</h2>

              <div className="mt-4 grid gap-3">
                <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
                  <p className="mb-2 text-xs font-black uppercase tracking-widest text-slate-400">Adicionar pessoa</p>
                  {addableMembers.length === 0 ? (
                    <p className="text-sm text-slate-500">Todos os membros ativos já estão na fila ou cantando.</p>
                  ) : addableMembers.map((member) => (
                    <button
                      key={member.id}
                      type="button"
                          onClick={() => handleJoinQueue(member.id, member.name)}
                          disabled={actionLoading || isClosed}
                      className="mb-2 min-h-10 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 text-left text-sm font-bold text-slate-200 transition hover:border-purple-700"
                    >
                      {member.name}
                    </button>
                  ))}
                </div>

                <SecondaryButton onClick={handleOpenTransfer}>Transferir sala</SecondaryButton>
                {!showCloseConfirm ? (
                  <button
                    type="button"
                    onClick={() => setShowCloseConfirm(true)}
                    className="min-h-11 rounded-xl border border-red-900/60 bg-red-950/30 px-4 py-2 text-sm font-bold text-red-200 transition hover:border-red-700"
                  >
                    Fechar sala
                  </button>
                ) : (
                  <div className="rounded-xl border border-red-900/60 bg-red-950/30 p-3">
                    <p className="text-sm font-semibold text-red-100">{MESSAGES.closeConfirm}</p>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <button type="button" onClick={handleCloseRoom} disabled={actionLoading} className="min-h-10 rounded-lg bg-red-700 px-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50">
                        {actionLoading ? 'Fechando...' : 'Confirmar'}
                      </button>
                      <SecondaryButton onClick={() => setShowCloseConfirm(false)}>Cancelar</SecondaryButton>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {isOwner && !isClosed && isTransferOpen && (
            <div className="rounded-2xl border border-purple-500/30 bg-slate-900 p-4 shadow-xl">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-white">Transferir sala</h3>
                  <p className="mt-1 text-xs leading-5 text-slate-400">Escolha quem será o novo dono.</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsTransferOpen(false);
                    setSelectedTransferMember(null);
                  }}
                  className="rounded-lg border border-slate-800 px-3 py-1 text-xs font-bold text-slate-300"
                >
                  Fechar
                </button>
              </div>

              {transferCandidates.length === 0 ? (
                <p className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-3 text-sm font-semibold text-slate-300">
                  Não há outro membro para receber a sala.
                </p>
              ) : (
                <div className="grid gap-3">
                  {transferCandidates.map((member) => (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => setSelectedTransferMember(member)}
                      className={`min-h-11 rounded-lg border px-3 text-left text-sm font-bold transition ${
                        selectedTransferMember?.id === member.id
                          ? 'border-purple-500 bg-purple-950/50 text-white'
                          : 'border-slate-800 bg-slate-950 text-slate-300 hover:border-purple-700'
                      }`}
                    >
                      {member.name}
                    </button>
                  ))}

                  {selectedTransferMember && (
                    <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
                      <p className="text-sm font-semibold leading-6 text-slate-200">
                        {MESSAGES.transferConfirm(selectedTransferMember.name)}
                      </p>
                      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <PrimaryButton onClick={handleConfirmTransfer} disabled={actionLoading}>
                          {actionLoading ? 'Transferindo...' : 'Confirmar'}
                        </PrimaryButton>
                        <SecondaryButton onClick={() => setSelectedTransferMember(null)} disabled={actionLoading}>
                          Cancelar
                        </SecondaryButton>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-xl">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-widest text-white">
              <UsersIcon /> Membros
            </h2>
            <div className="grid gap-1.5">
              {members.map((member) => (
                <div key={member.id} className="flex items-center justify-between gap-3 rounded-lg bg-slate-950/70 px-3 py-2 text-sm">
                  <span className="min-w-0 truncate font-bold text-slate-200">
                    {member.name}{member.user_id === me.user_id ? ' (você)' : ''}
                  </span>
                  <span className="shrink-0 rounded-full border border-slate-700 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-slate-500">
                    {member.role === 'owner' ? 'Dono' : 'Convidado'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-xl">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-widest text-white">
              <HistoryIcon /> Histórico
            </h2>
            <div className="grid max-h-56 gap-1.5 overflow-y-auto pr-1">
              {events.length === 0 ? (
                <p className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-sm text-slate-500">Nenhum evento registrado.</p>
              ) : events.map((event) => {
                const time = event.created_at
                  ? new Date(event.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                  : '';

                return (
                  <div key={event.id} className="flex items-center justify-between gap-3 rounded-lg bg-slate-950/70 px-3 py-2 text-xs">
                    <span className="font-semibold text-slate-300">{eventText(event)}</span>
                    <span className="font-mono text-slate-600">{time}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>
      </main>
    </Shell>
  );
}

export default function App() {
  const initialRoomCode = getInitialRoomCode();
  const [screen, setScreen] = useState(initialRoomCode ? 'join' : 'home');
  const [pendingCode, setPendingCode] = useState(initialRoomCode);
  const [session, setSession] = useState(null);
  const [roomNotice, setRoomNotice] = useState('');
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

  const reloadSession = useCallback(async () => {
    if (!session?.room?.id || !user) return;

    const nextSession = await loadRoomSession({ roomId: session.room.id, user });
    setSession(nextSession);
  }, [session, user]);

  useEffect(() => {
    if (!session?.room?.id || !user) return undefined;

    let reloadTimer = null;
    const unsubscribe = subscribeToRoomChanges({
      roomId: session.room.id,
      onChange: () => {
        window.clearTimeout(reloadTimer);
        reloadTimer = window.setTimeout(() => {
          reloadSession().catch((realtimeError) => setError(realtimeError.message));
        }, 120);
      },
    });

    return () => {
      window.clearTimeout(reloadTimer);
      unsubscribe();
    };
  }, [reloadSession, session?.room?.id, user]);

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
      setSession(roomSession);
      setRoomNotice(MESSAGES.roomCreated);
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
      setSession(roomSession);
      setRoomNotice(MESSAGES.joinedRoom);
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
      <RoomScreenV2
        session={session}
        initialNotice={roomNotice}
        onReload={reloadSession}
        onLeaveRoom={() => {
          setSession(null);
          setRoomNotice('');
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
