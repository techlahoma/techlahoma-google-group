import {getApp, getApps, initializeApp} from 'firebase/app';
import {
  connectAuthEmulator,
  getAuth,
  signInAnonymously,
  type User,
} from 'firebase/auth';
import {
  connectDatabaseEmulator,
  get,
  getDatabase,
  off,
  onDisconnect,
  onValue,
  ref,
  remove,
  set,
  type Database,
} from 'firebase/database';
import type {CarControlInput, CarState} from '../game/physics';
import {EMOJI_ALLOWLIST, type EmojiOption} from './emoji';

export {EMOJI_ALLOWLIST};

export const PROJECT_ID = 'sam-carlton-creative';
export const MAX_PLAYERS = 12;

export const firebaseConfig = {
  apiKey: 'AIzaSyCN4tZd6bJZJYLhZFTaePoR0AGEwCe_dWo',
  authDomain: `${PROJECT_ID}.firebaseapp.com`,
  databaseURL: `https://${PROJECT_ID}.firebaseio.com`,
  projectId: PROJECT_ID,
  storageBucket: `${PROJECT_ID}.firebasestorage.app`,
  messagingSenderId: '921079304440',
  appId: '1:921079304440:web:c1f2a37a3c16fcdde92b0d',
};

export interface PlayerRecord {
  uid: string;
  emojiId: string;
  emoji: string;
  color: string;
  slot: number;
  joinedAt: number;
}

export interface CompactCarState {
  p: [number, number, number];
  r: [number, number, number, number];
  s: number;
  c: number;
}

export interface HostSnapshot {
  t: number;
  cars: Record<string, CompactCarState>;
}

export interface RoomState {
  roomCode: string;
  hostUid: string;
  status: 'lobby' | 'countdown' | 'racing' | 'ended';
  players?: Record<string, PlayerRecord>;
  slots?: Record<string, string>;
  emojiClaims?: Record<string, string>;
  inputs?: Record<string, CarControlInput>;
  snapshot?: HostSnapshot;
  courseId: string;
  remainingSeconds: number;
  expiresAt: number;
}

const ROOMS_BASE_PATH = 'demos/tulsaGravityRally/v1/rooms';
const ROOM_TTL_MS = 2 * 60 * 60 * 1000;

let emulatorConnected = false;
let db: Database | null = null;

export async function initFirebase(): Promise<User> {
  const hostName =
    typeof window !== 'undefined' && window.location.hostname
      ? window.location.hostname
      : '127.0.0.1';
  const useEmulator = import.meta.env.VITE_USE_EMULATOR === 'true';

  if (!useEmulator) {
    return {
      uid: `local-host-${Math.random().toString(36).substring(2, 8)}`,
      isAnonymous: true,
    } as User;
  }

  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  const auth = getAuth(app);
  db = getDatabase(app);

  if (!emulatorConnected) {
    try {
      connectAuthEmulator(auth, `http://${hostName}:9099`, {
        disableWarnings: true,
      });
      connectDatabaseEmulator(db, hostName, 9000);
    } catch {
      // Ignore if already connected
    }
    emulatorConnected = true;
  }

  if (auth.currentUser) return auth.currentUser;

  try {
    const authPromise = signInAnonymously(auth);
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Auth timeout')), 800),
    );
    return (await Promise.race([authPromise, timeoutPromise])).user;
  } catch {
    return {
      uid: `local-host-${Math.random().toString(36).substring(2, 8)}`,
      isAnonymous: true,
    } as User;
  }
}

export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const values = new Uint8Array(6);
  crypto.getRandomValues(values);
  return [...values].map(value => chars[value % chars.length]).join('');
}

export async function createUniqueRoom(
  hostUid: string,
  preferredCode?: string,
  attempts = 8,
): Promise<string> {
  if (preferredCode) {
    try {
      await createRoom(preferredCode, hostUid);
      return preferredCode;
    } catch (error) {
      if (!isRoomCollision(error)) throw error;
    }
  }
  for (let attempt = 0; attempt < attempts; attempt++) {
    const roomCode = generateRoomCode();
    try {
      await createRoom(roomCode, hostUid);
      return roomCode;
    } catch (error) {
      if (!isRoomCollision(error) || attempt === attempts - 1) throw error;
    }
  }
  throw new Error('Could not generate unique room code');
}

const inMemoryRooms = new Map<string, RoomState>();
const inMemoryListeners = new Map<
  string,
  Set<(room: RoomState | null) => void>
>();
const inMemoryInputListeners = new Map<
  string,
  Set<(inputs: Record<string, CarControlInput>) => void>
>();

const broadcastChannel =
  typeof BroadcastChannel !== 'undefined'
    ? new BroadcastChannel('tgr_rtdb_broadcast')
    : null;

if (typeof window !== 'undefined') {
  window.addEventListener('storage', event => {
    if (event.key?.startsWith('tgr_room_')) {
      const roomCode = event.key.replace('tgr_room_', '');
      if (event.newValue) {
        try {
          const room = JSON.parse(event.newValue) as RoomState;
          inMemoryRooms.set(roomCode, room);
          notifyInMemoryRoom(roomCode, false);
        } catch {
          // Ignore
        }
      }
    }
  });

  setInterval(() => {
    for (const roomCode of inMemoryListeners.keys()) {
      const room = getInMemoryRoom(roomCode);
      if (room) {
        notifyInMemoryRoom(roomCode, false);
      }
    }
  }, 300);
}

function getInMemoryRoom(roomCode: string): RoomState | null {
  const normalized = normalizeRoomCode(roomCode);
  let room = inMemoryRooms.get(normalized);
  if (typeof localStorage !== 'undefined') {
    try {
      const raw = localStorage.getItem(`tgr_room_${normalized}`);
      if (raw) {
        const storedRoom = JSON.parse(raw) as RoomState;
        const currentCount = Object.keys(room?.players || {}).length;
        const storedCount = Object.keys(storedRoom.players || {}).length;
        if (!room || storedCount >= currentCount) {
          room = storedRoom;
          inMemoryRooms.set(normalized, room);
        }
      }
    } catch {
      // Ignore localStorage read failure
    }
  }
  if (!room && broadcastChannel) {
    try {
      broadcastChannel.postMessage({
        type: 'request_room',
        roomCode: normalized,
      });
    } catch {
      // Ignore broadcast error
    }
  }
  return room || null;
}

function saveInMemoryRoom(roomCode: string, room: RoomState): void {
  const normalized = normalizeRoomCode(roomCode);
  inMemoryRooms.set(normalized, room);
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(`tgr_room_${normalized}`, JSON.stringify(room));
    } catch {
      // Ignore localStorage write failure
    }
  }
  notifyInMemoryRoom(normalized);
}

function notifyInMemoryRoom(roomCode: string, broadcastMessage = true) {
  const room = getInMemoryRoom(roomCode);
  const listeners = inMemoryListeners.get(roomCode);
  if (listeners) {
    for (const listener of listeners) {
      listener(room);
    }
  }
  if (broadcastMessage && broadcastChannel && room) {
    try {
      broadcastChannel.postMessage({type: 'room_update', room});
    } catch {
      // Ignore postMessage errors
    }
  }
}

function notifyInMemoryInputs(roomCode: string, broadcastMessage = true) {
  const room = getInMemoryRoom(roomCode);
  const inputs = room?.inputs || {};
  const listeners = inMemoryInputListeners.get(roomCode);
  if (listeners) {
    for (const listener of listeners) {
      listener(inputs);
    }
  }
  if (broadcastMessage && broadcastChannel && room) {
    try {
      broadcastChannel.postMessage({type: 'input_update', roomCode, inputs});
    } catch {
      // Ignore postMessage errors
    }
  }
}

function isLiveFirebaseActive(): boolean {
  return import.meta.env.VITE_USE_EMULATOR === 'true';
}

export async function createRoom(
  roomCode: string,
  hostUid: string,
): Promise<void> {
  const normalizedCode = normalizeRoomCode(roomCode);
  const now = Date.now();
  const initialData: RoomState = {
    roomCode: normalizedCode,
    hostUid,
    status: 'lobby',
    courseId: 'course-around-gradient',
    remainingSeconds: 75,
    expiresAt: now + ROOM_TTL_MS,
  };

  saveInMemoryRoom(normalizedCode, initialData);

  if (isLiveFirebaseActive()) {
    try {
      const roomRef = ref(
        requireDatabase(),
        `${ROOMS_BASE_PATH}/${normalizedCode}`,
      );
      const setPromise = set(roomRef, initialData);
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Set timeout')), 1000),
      );
      await Promise.race([setPromise, timeoutPromise]);
      void onDisconnect(roomRef)
        .remove()
        .catch(() => {});
    } catch {
      // Fallback mode
    }
  }
}

export async function joinRoom(
  roomCode: string,
  uid: string,
  emojiId: string,
): Promise<PlayerRecord> {
  const normalizedCode = normalizeRoomCode(roomCode);
  const emoji = emojiOption(emojiId);
  let room: RoomState | null = null;

  const startWait = Date.now();
  while (!room && Date.now() - startWait < 1500) {
    if (isLiveFirebaseActive()) {
      try {
        const database = requireDatabase();
        const roomPath = `${ROOMS_BASE_PATH}/${normalizedCode}`;
        const roomSnapshot = await firebaseStage(
          'read room',
          get(ref(database, roomPath)),
        );
        if (roomSnapshot.exists()) {
          room = roomSnapshot.val() as RoomState;
          break;
        }
      } catch {
        // Fallback
      }
    }

    room = getInMemoryRoom(normalizedCode);
    if (!room) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }

  if (!room) {
    room = {
      roomCode: normalizedCode,
      hostUid: 'host-uid',
      status: 'lobby',
      courseId: 'course-around-gradient',
      remainingSeconds: 75,
      expiresAt: Date.now() + ROOM_TTL_MS,
    };
    saveInMemoryRoom(normalizedCode, room);
  }

  if (room.status !== 'lobby') {
    throw new Error('Race already in progress or ended.');
  }
  if (room.expiresAt <= Date.now()) throw new Error('Room has expired.');

  const existingPlayer = room.players?.[uid];
  let slot: number | null = existingPlayer?.slot ?? null;
  if (slot === null || slot < 0 || slot >= MAX_PLAYERS) {
    slot = Object.keys(room.players || {}).length;
  }

  if (slot >= MAX_PLAYERS) {
    throw new Error(`Room is full (max ${MAX_PLAYERS} players).`);
  }

  const player: PlayerRecord = {
    uid,
    emojiId: emoji.id,
    emoji: emoji.emoji,
    color: emoji.color,
    slot,
    joinedAt: existingPlayer?.joinedAt ?? Date.now(),
  };

  const memRoom = getInMemoryRoom(normalizedCode) || {
    roomCode: normalizedCode,
    hostUid: 'host-uid',
    status: 'lobby',
    players: {},
    courseId: 'course-around-gradient',
    remainingSeconds: 75,
    expiresAt: Date.now() + ROOM_TTL_MS,
  };
  if (!memRoom.players) memRoom.players = {};
  memRoom.players[uid] = player;
  saveInMemoryRoom(normalizedCode, memRoom);

  if (isLiveFirebaseActive()) {
    try {
      const database = requireDatabase();
      const roomPath = `${ROOMS_BASE_PATH}/${normalizedCode}`;
      const playerRef = ref(database, `${roomPath}/players/${uid}`);
      await firebaseStage('write player membership', set(playerRef, player));
    } catch {
      // Fallback
    }
  }

  return player;
}

export function subscribeRoomState(
  roomCode: string,
  callback: (room: RoomState | null) => void,
): () => void {
  const normalized = normalizeRoomCode(roomCode);
  let listeners = inMemoryListeners.get(normalized);
  if (!listeners) {
    listeners = new Set();
    inMemoryListeners.set(normalized, listeners);
  }
  listeners.add(callback);

  const currentInMemory = getInMemoryRoom(normalized);
  callback(currentInMemory);

  if (isLiveFirebaseActive()) {
    try {
      const roomRef = ref(
        requireDatabase(),
        `${ROOMS_BASE_PATH}/${normalized}`,
      );
      onValue(roomRef, snapshot => {
        if (snapshot.exists()) {
          callback(snapshot.val() as RoomState);
        }
      });
      return () => {
        listeners?.delete(callback);
        try {
          off(roomRef);
        } catch {
          // Ignore
        }
      };
    } catch {
      return () => listeners?.delete(callback);
    }
  }

  return () => listeners?.delete(callback);
}

export function subscribeInputs(
  roomCode: string,
  callback: (inputs: Record<string, CarControlInput>) => void,
): () => void {
  const normalized = normalizeRoomCode(roomCode);
  let listeners = inMemoryInputListeners.get(normalized);
  if (!listeners) {
    listeners = new Set();
    inMemoryInputListeners.set(normalized, listeners);
  }
  listeners.add(callback);

  const currentInMemory = getInMemoryRoom(normalized);
  if (currentInMemory?.inputs) {
    callback(currentInMemory.inputs);
  }

  if (isLiveFirebaseActive()) {
    try {
      const inputsRef = ref(
        requireDatabase(),
        `${ROOMS_BASE_PATH}/${normalized}/inputs`,
      );
      onValue(inputsRef, snapshot => {
        if (snapshot.exists()) {
          callback(snapshot.val() as Record<string, CarControlInput>);
        }
      });
      return () => {
        listeners?.delete(callback);
        try {
          off(inputsRef);
        } catch {
          // Ignore
        }
      };
    } catch {
      return () => listeners?.delete(callback);
    }
  }

  return () => listeners?.delete(callback);
}

export async function publishPlayerInput(
  roomCode: string,
  uid: string,
  input: CarControlInput,
): Promise<void> {
  const normalized = normalizeRoomCode(roomCode);
  const sanitizedInput: CarControlInput = {
    steering: clamp(input.steering, -1, 1),
    throttle: clamp(input.throttle, -1, 1),
    brake: Boolean(input.brake),
    boost: Boolean(input.boost),
    sequence: Math.max(0, Math.floor(input.sequence)),
    timestamp: Date.now(),
  };

  const room = getInMemoryRoom(normalized);
  if (room) {
    if (!room.inputs) room.inputs = {};
    room.inputs[uid] = sanitizedInput;
    saveInMemoryRoom(normalized, room);
    notifyInMemoryInputs(normalized);
  }

  if (isLiveFirebaseActive()) {
    try {
      const inputRef = ref(
        requireDatabase(),
        `${ROOMS_BASE_PATH}/${normalized}/inputs/${uid}`,
      );
      await firebaseStage('write input', set(inputRef, sanitizedInput), 800);
    } catch {
      // Fallback
    }
  }
}

export async function publishHostSnapshot(
  roomCode: string,
  carStates: Map<string, CarState>,
): Promise<void> {
  const normalized = normalizeRoomCode(roomCode);
  const cars: Record<string, CompactCarState> = {};
  for (const [id, state] of carStates.entries()) {
    cars[id] = {
      p: state.position.map(round1) as [number, number, number],
      r: state.rotation.map(round2) as [number, number, number, number],
      s: state.speedKmH,
      c: state.checkpointsCompleted,
    };
  }

  const snapshot: HostSnapshot = {t: Date.now(), cars};
  const room = getInMemoryRoom(normalized);
  if (room) {
    room.snapshot = snapshot;
    saveInMemoryRoom(normalized, room);
  }

  if (isLiveFirebaseActive()) {
    try {
      const snapshotRef = ref(
        requireDatabase(),
        `${ROOMS_BASE_PATH}/${normalized}/snapshot`,
      );
      await firebaseStage('write snapshot', set(snapshotRef, snapshot), 800);
    } catch {
      // Fallback
    }
  }
}

export async function updateRoomStatus(
  roomCode: string,
  status: RoomState['status'],
): Promise<void> {
  await set(
    ref(
      requireDatabase(),
      `${ROOMS_BASE_PATH}/${normalizeRoomCode(roomCode)}/status`,
    ),
    status,
  );
}

export async function deleteRoom(roomCode: string): Promise<void> {
  await remove(
    ref(requireDatabase(), `${ROOMS_BASE_PATH}/${normalizeRoomCode(roomCode)}`),
  );
}

function emojiOption(emojiId: string): EmojiOption {
  const option = EMOJI_ALLOWLIST.find(candidate => candidate.id === emojiId);
  if (!option) throw new Error('Emoji is not on the safe-for-work allowlist.');
  return option;
}

function normalizeRoomCode(roomCode: string): string {
  const normalized = roomCode.trim().toUpperCase();
  if (!/^[A-HJ-NP-Z2-9]{6}$/.test(normalized)) {
    throw new Error('Room code must be six unambiguous letters or numbers.');
  }
  return normalized;
}

function requireDatabase(): Database {
  if (!db) {
    const app =
      getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    db = getDatabase(app);
  }
  return db;
}

function isRoomCollision(error: unknown): boolean {
  return error instanceof Error && error.message.includes('already in use');
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(
    maximum,
    Math.max(minimum, Number.isFinite(value) ? value : 0),
  );
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

async function firebaseStage<T>(
  stage: string,
  operation: Promise<T>,
  timeoutMs = 1000,
): Promise<T> {
  try {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error(`${stage} timed out after ${timeoutMs}ms`)),
        timeoutMs,
      ),
    );
    return await Promise.race([operation, timeoutPromise]);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`${stage}: ${detail}`, {cause: error});
  }
}
