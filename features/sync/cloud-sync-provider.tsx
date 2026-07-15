"use client";

import type { User } from "@supabase/supabase-js";
import {
  AlertTriangle,
  CheckCircle2,
  Cloud,
  CloudOff,
  LoaderCircle,
  RefreshCw,
} from "lucide-react";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  getGameSavePayload,
  type GameSavePayload,
  useGameStore,
} from "@/features/game/store";
import { useProviderSettingsStore } from "@/features/providers/store";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Database, Json } from "@/lib/supabase/database.types";

type SaveRow = Database["public"]["Tables"]["game_saves"]["Row"];
type SyncStatus = "idle" | "loading" | "syncing" | "synced" | "offline" | "error" | "conflict";

type Conflict = {
  cloud: SaveRow;
  local: GameSavePayload;
};

type SyncContextValue = {
  user: User | null;
  status: SyncStatus;
  lastSyncedAt: string | null;
  errorMessage: string;
  syncNow: () => Promise<void>;
  signOut: () => Promise<void>;
};

type SyncMetadata = {
  cloudRevision: number;
  localFingerprint: string;
  lastSyncedAt: string;
};

const SyncContext = createContext<SyncContextValue>({
  user: null,
  status: "idle",
  lastSyncedAt: null,
  errorMessage: "",
  syncNow: async () => undefined,
  signOut: async () => undefined,
});

const META_PREFIX = "shiftquest-cloud-sync-v1:";
const SAVE_VERSION = 1;

function metadataKey(userId: string) {
  return `${META_PREFIX}${userId}`;
}

function fingerprint(payload: GameSavePayload) {
  return JSON.stringify(payload);
}

function readMetadata(userId: string): SyncMetadata | null {
  try {
    const raw = window.localStorage.getItem(metadataKey(userId));
    if (!raw) return null;
    const value = JSON.parse(raw) as Partial<SyncMetadata>;
    return typeof value.cloudRevision === "number" &&
      typeof value.localFingerprint === "string" &&
      typeof value.lastSyncedAt === "string"
      ? value as SyncMetadata
      : null;
  } catch {
    return null;
  }
}

function writeMetadata(userId: string, metadata: SyncMetadata) {
  window.localStorage.setItem(metadataKey(userId), JSON.stringify(metadata));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isGameSavePayload(value: unknown): value is GameSavePayload {
  return isRecord(value) &&
    (value.profile === null || isRecord(value.profile)) &&
    isRecord(value.settings) &&
    isRecord(value.progress) &&
    Array.isArray(value.attempts) &&
    Array.isArray(value.activities) &&
    isRecord(value.settings.audio) &&
    isRecord(value.settings.accessibility) &&
    isRecord(value.progress.vocabularyProgress) &&
    isRecord(value.progress.scenarioProgress) &&
    isRecord(value.progress.dailyMinutes);
}

function hasMeaningfulProgress(payload: GameSavePayload) {
  return Boolean(payload.profile) ||
    payload.attempts.length > 0 ||
    payload.activities.length > 0 ||
    payload.progress.totalXp > 0 ||
    payload.progress.completedScenarioIds.length > 0 ||
    Object.keys(payload.progress.vocabularyProgress).length > 0;
}

export function CloudSyncProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<SyncStatus>(isSupabaseConfigured ? "loading" : "idle");
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [conflict, setConflict] = useState<Conflict | null>(null);
  const hydrated = useGameStore((state) => state.hydrated);
  const userRef = useRef<User | null>(null);
  const readyRef = useRef(false);
  const cloudExistsRef = useRef(false);
  const cloudRevisionRef = useRef(0);
  const lastFingerprintRef = useRef("");
  const saveTimerRef = useRef<number | null>(null);
  const unsubscribeStoreRef = useRef<(() => void) | null>(null);
  const bootstrapIdRef = useRef(0);

  const stopWatching = useCallback(() => {
    readyRef.current = false;
    unsubscribeStoreRef.current?.();
    unsubscribeStoreRef.current = null;
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = null;
  }, []);

  const recordSynced = useCallback((userId: string, row: Pick<SaveRow, "revision" | "updated_at">, payload: GameSavePayload) => {
    const localFingerprint = fingerprint(payload);
    cloudExistsRef.current = true;
    cloudRevisionRef.current = row.revision;
    lastFingerprintRef.current = localFingerprint;
    setLastSyncedAt(row.updated_at);
    writeMetadata(userId, {
      cloudRevision: row.revision,
      localFingerprint,
      lastSyncedAt: row.updated_at,
    });
  }, []);

  const fetchCloudRow = useCallback(async (userId: string) => {
    const supabase = createClient();
    return supabase
      .from("game_saves")
      .select("user_id,state,schema_version,revision,created_at,updated_at")
      .eq("user_id", userId)
      .maybeSingle();
  }, []);

  const pushPayload = useCallback(async (payload: GameSavePayload, force = false) => {
    const activeUser = userRef.current;
    if (!activeUser) return false;
    if (!navigator.onLine) {
      setStatus("offline");
      return false;
    }

    setStatus("syncing");
    setErrorMessage("");
    const supabase = createClient();
    const state = payload as unknown as Json;

    try {
      if (!cloudExistsRef.current) {
        const { data, error } = await supabase
          .from("game_saves")
          .insert({ user_id: activeUser.id, state, schema_version: SAVE_VERSION })
          .select("revision,updated_at")
          .single();
        if (error) throw error;
        recordSynced(activeUser.id, data, payload);
      } else {
        let query = supabase
          .from("game_saves")
          .update({ state, schema_version: SAVE_VERSION })
          .eq("user_id", activeUser.id);
        if (!force) query = query.eq("revision", cloudRevisionRef.current);
        const { data, error } = await query
          .select("revision,updated_at")
          .maybeSingle();
        if (error) throw error;

        if (!data) {
          const latest = await fetchCloudRow(activeUser.id);
          if (latest.error) throw latest.error;
          if (latest.data && isGameSavePayload(latest.data.state)) {
            readyRef.current = false;
            setConflict({ cloud: latest.data, local: payload });
            setStatus("conflict");
            return false;
          }
          throw new Error("Bulut kaydı eşzamanlı olarak değişti.");
        }
        recordSynced(activeUser.id, data, payload);
      }
      setStatus("synced");
      return true;
    } catch (error) {
      setStatus(navigator.onLine ? "error" : "offline");
      setErrorMessage(error instanceof Error ? error.message : "Bulut kaydı güncellenemedi.");
      return false;
    }
  }, [fetchCloudRow, recordSynced]);

  const startWatching = useCallback(() => {
    unsubscribeStoreRef.current?.();
    lastFingerprintRef.current = fingerprint(getGameSavePayload());
    readyRef.current = true;
    unsubscribeStoreRef.current = useGameStore.subscribe(() => {
      if (!readyRef.current) return;
      const payload = getGameSavePayload();
      const nextFingerprint = fingerprint(payload);
      if (nextFingerprint === lastFingerprintRef.current) return;
      lastFingerprintRef.current = nextFingerprint;
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = window.setTimeout(() => {
        void pushPayload(getGameSavePayload());
      }, 900);
    });
  }, [pushPayload]);

  const applyCloud = useCallback((row: SaveRow) => {
    if (!isGameSavePayload(row.state) || !userRef.current) return false;
    readyRef.current = false;
    const imported = useGameStore.getState().importData(row.state);
    if (!imported) return false;
    recordSynced(userRef.current.id, row, row.state);
    setConflict(null);
    setStatus("synced");
    startWatching();
    return true;
  }, [recordSynced, startWatching]);

  const bootstrap = useCallback(async (activeUser: User) => {
    const bootstrapId = ++bootstrapIdRef.current;
    stopWatching();
    setStatus("loading");
    setErrorMessage("");
    setConflict(null);

    try {
      const { data: cloud, error } = await fetchCloudRow(activeUser.id);
      if (bootstrapId !== bootstrapIdRef.current) return;
      if (error) throw error;

      const local = getGameSavePayload();
      const localFingerprint = fingerprint(local);
      const metadata = readMetadata(activeUser.id);

      if (!cloud) {
        cloudExistsRef.current = false;
        cloudRevisionRef.current = 0;
        lastFingerprintRef.current = localFingerprint;
        if (hasMeaningfulProgress(local)) await pushPayload(local);
        else setStatus("synced");
        startWatching();
        return;
      }

      if (!isGameSavePayload(cloud.state)) throw new Error("Bulut kaydının biçimi geçersiz.");
      cloudExistsRef.current = true;
      cloudRevisionRef.current = cloud.revision;
      const cloudFingerprint = fingerprint(cloud.state);

      if (cloudFingerprint === localFingerprint) {
        recordSynced(activeUser.id, cloud, local);
        setStatus("synced");
        startWatching();
        return;
      }

      if (!hasMeaningfulProgress(local)) {
        applyCloud(cloud);
        return;
      }

      if (metadata) {
        const localChanged = metadata.localFingerprint !== localFingerprint;
        const cloudChanged = metadata.cloudRevision !== cloud.revision;
        if (localChanged && !cloudChanged) {
          await pushPayload(local);
          startWatching();
          return;
        }
        if (!localChanged && cloudChanged) {
          applyCloud(cloud);
          return;
        }
      }

      setConflict({ cloud, local });
      setStatus("conflict");
    } catch (error) {
      setStatus(navigator.onLine ? "error" : "offline");
      setErrorMessage(error instanceof Error ? error.message : "Bulut kaydı yüklenemedi.");
      startWatching();
    }
  }, [applyCloud, fetchCloudRow, pushPayload, recordSynced, startWatching, stopWatching]);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const supabase = createClient();
    let mounted = true;

    void supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      userRef.current = data.user;
      setUser(data.user);
      if (!data.user) setStatus("idle");
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user ?? null;
      userRef.current = nextUser;
      setUser(nextUser);
      if (!nextUser) {
        stopWatching();
        setStatus("idle");
      }
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
      stopWatching();
    };
  }, [stopWatching]);

  useEffect(() => {
    if (!user || !hydrated) return;
    void bootstrap(user);
  }, [bootstrap, hydrated, user]);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const online = () => {
      if (userRef.current && useGameStore.getState().hydrated) void bootstrap(userRef.current);
    };
    const offline = () => setStatus("offline");
    window.addEventListener("online", online);
    window.addEventListener("offline", offline);
    return () => {
      window.removeEventListener("online", online);
      window.removeEventListener("offline", offline);
    };
  }, [bootstrap]);

  const syncNow = useCallback(async () => {
    if (!userRef.current || !readyRef.current) return;
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = null;
    await pushPayload(getGameSavePayload());
  }, [pushPayload]);

  const signOut = useCallback(async () => {
    if (conflict) {
      window.alert("Çıkış yapmadan önce hangi ilerleme kaydının korunacağını seçmelisin.");
      return;
    }
    const saved = readyRef.current ? await pushPayload(getGameSavePayload()) : true;
    if (!saved) {
      window.alert("İlerlemen buluta kaydedilemedi. Veri kaybını önlemek için bağlantı düzelene kadar çıkış yapılmadı.");
      return;
    }
    stopWatching();
    if (isSupabaseConfigured) await createClient().auth.signOut();
    useGameStore.getState().resetAll();
    useProviderSettingsStore.getState().clearAll();
    window.location.assign("/auth/login");
  }, [conflict, pushPayload, stopWatching]);

  const chooseCloud = () => {
    if (conflict) applyCloud(conflict.cloud);
  };

  const chooseLocal = async () => {
    if (!conflict) return;
    const selected = conflict;
    setConflict(null);
    const saved = await pushPayload(selected.local, true);
    if (saved) startWatching();
    else {
      setConflict(selected);
      setStatus("conflict");
    }
  };

  const value = useMemo<SyncContextValue>(() => ({
    user,
    status,
    lastSyncedAt,
    errorMessage,
    syncNow,
    signOut,
  }), [errorMessage, lastSyncedAt, signOut, status, syncNow, user]);

  return (
    <SyncContext.Provider value={value}>
      {children}
      {conflict ? (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-black/75 p-5 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="save-conflict-title">
          <div className="w-full max-w-lg rounded-3xl border border-amber/30 bg-[#0a1822] p-6 shadow-2xl sm:p-8">
            <div className="grid size-12 place-items-center rounded-2xl border border-amber/30 bg-amber/10 text-amber"><AlertTriangle className="size-5" /></div>
            <p className="mt-6 text-[9px] font-black uppercase tracking-[0.2em] text-amber">CLOUD SAVE / CHOICE REQUIRED</p>
            <h2 id="save-conflict-title" className="mt-3 font-display text-2xl font-black uppercase text-white">İki farklı ilerleme bulundu.</h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">Bu cihazdaki kayıt ile hesabındaki bulut kaydı birbirinden farklı. Kullanmak istediğin kaydı seç; diğerinin üzerine yazılacak.</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button type="button" onClick={chooseCloud} className="rounded-2xl border border-cyan/25 bg-cyan/[0.07] p-4 text-left transition hover:bg-cyan/[0.12]">
                <Cloud className="size-5 text-cyan" /><span className="mt-3 block font-display text-sm font-black uppercase text-white">Bulut kaydı</span><span className="mt-1 block text-[10px] text-slate-500">Güncelleme: {new Date(conflict.cloud.updated_at).toLocaleString("tr-TR")}</span>
              </button>
              <button type="button" onClick={() => void chooseLocal()} className="rounded-2xl border border-lime/25 bg-lime/[0.06] p-4 text-left transition hover:bg-lime/[0.11]">
                <RefreshCw className="size-5 text-lime" /><span className="mt-3 block font-display text-sm font-black uppercase text-white">Bu cihaz</span><span className="mt-1 block text-[10px] text-slate-500">Yerel ilerlemeyi hesaba aktar</span>
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </SyncContext.Provider>
  );
}

export function useCloudSync() {
  return useContext(SyncContext);
}

export function CloudSyncStatus({ compact = false }: { compact?: boolean }) {
  const { status, lastSyncedAt, errorMessage, syncNow } = useCloudSync();
  const config = status === "synced"
    ? { icon: CheckCircle2, label: "Bulut güncel", className: "text-lime" }
    : status === "syncing" || status === "loading"
      ? { icon: LoaderCircle, label: status === "loading" ? "Kayıt yükleniyor" : "Senkronize ediliyor", className: "text-cyan" }
      : status === "offline"
        ? { icon: CloudOff, label: "Çevrimdışı · yerel kayıt", className: "text-amber" }
        : status === "error"
          ? { icon: AlertTriangle, label: "Senkronizasyon hatası", className: "text-coral" }
          : { icon: Cloud, label: "Bulut beklemede", className: "text-slate-400" };
  const Icon = config.icon;

  return (
    <button type="button" onClick={() => void syncNow()} title={errorMessage || (lastSyncedAt ? `Son kayıt: ${new Date(lastSyncedAt).toLocaleString("tr-TR")}` : config.label)} className={`flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.035] px-2.5 py-2 text-[9px] font-black uppercase tracking-[0.1em] ${config.className}`}>
      <Icon className={`size-3.5 ${(status === "syncing" || status === "loading") ? "animate-spin" : ""}`} />
      {compact ? null : <span>{config.label}</span>}
    </button>
  );
}
