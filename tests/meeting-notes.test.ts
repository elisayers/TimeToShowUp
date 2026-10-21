import test from 'node:test'
import assert from 'node:assert/strict'
import { parseMeetingNotes, serializeMeetingNotes, upsertSaidDidOutcome } from '../lib/meeting-notes.ts'

test('preserves legacy plain meeting notes', () => {
  assert.deepEqual(parseMeetingNotes('Existing shared note'), {
    version: 1,
    shared_notes: 'Existing shared note',
    said_did: [],
  })
})

test('round trips structured Said/Did records with identity associations', () => {
  const original = parseMeetingNotes('Shared note')
  const updated = upsertSaidDidOutcome(original, {
    commitment_id: 'commitment-1',
    user_id: 'user-1',
    period_id: 'period-1',
    user_label: 'Eli',
    said: 'Ship the testable slice',
    did: 'Built and verified the slice',
    status: 'completed',
    updated_at: '2026-10-08T12:00:00.000Z',
  })

  assert.deepEqual(parseMeetingNotes(serializeMeetingNotes(updated)), updated)
})

test('updates one user commitment without removing other outcomes', () => {
  const first = upsertSaidDidOutcome(parseMeetingNotes(null), {
    commitment_id: 'commitment-1',
    user_id: 'user-1',
    period_id: 'period-1',
    user_label: 'Eli',
    said: 'First declaration',
    did: 'First result',
    status: 'active',
    updated_at: '2026-10-08T12:00:00.000Z',
  })
  const withPartner = upsertSaidDidOutcome(first, {
    commitment_id: 'commitment-2',
    user_id: 'user-2',
    period_id: 'period-1',
    user_label: 'Shawn',
    said: 'Second declaration',
    did: 'Second result',
    status: 'completed',
    updated_at: '2026-10-08T12:01:00.000Z',
  })
  const revised = upsertSaidDidOutcome(withPartner, {
    ...withPartner.said_did[0],
    did: 'Revised first result',
    status: 'completed',
  })

  assert.equal(revised.said_did.length, 2)
  assert.equal(revised.said_did.find((item) => item.user_id === 'user-1')?.did, 'Revised first result')
  assert.equal(revised.said_did.find((item) => item.user_id === 'user-2')?.did, 'Second result')
})
