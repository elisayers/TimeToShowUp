export type OutcomeStatus = 'active' | 'completed' | 'dropped'

export interface SaidDidOutcome {
  commitment_id: string
  user_id: string
  period_id: string
  user_label: string
  said: string
  did: string
  status: OutcomeStatus
  updated_at: string
}

export interface MeetingNotesDocument {
  version: 1
  shared_notes: string
  said_did: SaidDidOutcome[]
}

const EMPTY_DOCUMENT: MeetingNotesDocument = {
  version: 1,
  shared_notes: '',
  said_did: [],
}

export function parseMeetingNotes(value?: string | null): MeetingNotesDocument {
  if (!value) return { ...EMPTY_DOCUMENT, said_did: [] }

  try {
    const parsed = JSON.parse(value) as Partial<MeetingNotesDocument>
    if (parsed.version === 1 && typeof parsed.shared_notes === 'string' && Array.isArray(parsed.said_did)) {
      return {
        version: 1,
        shared_notes: parsed.shared_notes,
        said_did: parsed.said_did.filter(isSaidDidOutcome),
      }
    }
  } catch {
    // Existing notes were stored as plain text before the MVP envelope existed.
  }

  return { version: 1, shared_notes: value, said_did: [] }
}

export function serializeMeetingNotes(document: MeetingNotesDocument): string {
  return JSON.stringify({
    version: 1,
    shared_notes: document.shared_notes,
    said_did: document.said_did,
  })
}

export function upsertSaidDidOutcome(
  document: MeetingNotesDocument,
  outcome: SaidDidOutcome,
): MeetingNotesDocument {
  const existingIndex = document.said_did.findIndex(
    (item) => item.commitment_id === outcome.commitment_id && item.user_id === outcome.user_id,
  )
  const saidDid = [...document.said_did]

  if (existingIndex >= 0) {
    saidDid[existingIndex] = outcome
  } else {
    saidDid.push(outcome)
  }

  return { ...document, said_did: saidDid }
}

function isSaidDidOutcome(value: unknown): value is SaidDidOutcome {
  if (!value || typeof value !== 'object') return false
  const item = value as Record<string, unknown>
  return (
    typeof item.commitment_id === 'string' &&
    typeof item.user_id === 'string' &&
    typeof item.period_id === 'string' &&
    typeof item.user_label === 'string' &&
    typeof item.said === 'string' &&
    typeof item.did === 'string' &&
    (item.status === 'active' || item.status === 'completed' || item.status === 'dropped') &&
    typeof item.updated_at === 'string'
  )
}
