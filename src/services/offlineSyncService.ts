export interface QueuedAction {
  id: string;
  actionType: 'ADD_CROP' | 'UPDATE_PRICE' | 'COUNTER_OFFER' | 'ACCEPT_ENQUIRY';
  payload: any;
  timestamp: string;
  status: 'pending' | 'syncing' | 'failed' | 'synced';
}

const STORAGE_KEY_QUEUED_ACTIONS = 'kisansaathi_queued_offline_actions';
const STORAGE_KEY_OFFLINE_DRAFTS = 'kisansaathi_offline_crop_drafts';

export function getQueuedActions(): QueuedAction[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_QUEUED_ACTIONS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveQueuedAction(actionType: QueuedAction['actionType'], payload: any): QueuedAction {
  const actions = getQueuedActions();
  const newAction: QueuedAction = {
    id: `queue-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    actionType,
    payload,
    timestamp: new Date().toISOString(),
    status: 'pending',
  };
  actions.push(newAction);
  try {
    localStorage.setItem(STORAGE_KEY_QUEUED_ACTIONS, JSON.stringify(actions));
    window.dispatchEvent(new CustomEvent('kisansaathi_queue_changed'));
  } catch (err) {
    console.warn('Could not save to localStorage:', err);
  }
  return newAction;
}

export function removeQueuedAction(id: string): void {
  const actions = getQueuedActions().filter((a) => a.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY_QUEUED_ACTIONS, JSON.stringify(actions));
    window.dispatchEvent(new CustomEvent('kisansaathi_queue_changed'));
  } catch {}
}

export function clearQueuedActions(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_QUEUED_ACTIONS);
    window.dispatchEvent(new CustomEvent('kisansaathi_queue_changed'));
  } catch {}
}

export function saveCropDraftLocally(draft: any): void {
  try {
    localStorage.setItem(STORAGE_KEY_OFFLINE_DRAFTS, JSON.stringify(draft));
  } catch {}
}

export function getCropDraftLocally(): any | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_OFFLINE_DRAFTS);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearCropDraftLocally(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_OFFLINE_DRAFTS);
  } catch {}
}

export async function syncPendingActions(
  onSuccessCallback?: (action: QueuedAction) => void
): Promise<{ syncedCount: number; remainingCount: number }> {
  const actions = getQueuedActions();
  if (actions.length === 0) return { syncedCount: 0, remainingCount: 0 };

  let synced = 0;
  for (const act of actions) {
    try {
      // Simulate remote API push or call real endpoint if applicable
      await new Promise((resolve) => setTimeout(resolve, 300));
      removeQueuedAction(act.id);
      synced++;
      if (onSuccessCallback) onSuccessCallback(act);
    } catch (err) {
      console.warn('Failed to sync action', act.id, err);
    }
  }

  return {
    syncedCount: synced,
    remainingCount: getQueuedActions().length,
  };
}
