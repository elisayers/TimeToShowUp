import test from 'node:test'
import assert from 'node:assert/strict'
import { getDailyRoomName, transcriptStateFor, vttToPlainText } from '../utils/daily.ts'

test('extracts the Daily room name from an embedded room URL', () => {
  assert.equal(getDailyRoomName('https://example.daily.co/ttft-room-123'), 'ttft-room-123')
  assert.equal(getDailyRoomName('not a url'), null)
})

test('maps Daily provider transcript states to visible application states', () => {
  assert.equal(transcriptStateFor({ status: 't_in_progress' }), 'in_progress')
  assert.equal(transcriptStateFor({ status: 't_finished', isVttAvailable: false }), 'processing')
  assert.equal(transcriptStateFor({ status: 't_finished', isVttAvailable: true }), 'available')
  assert.equal(transcriptStateFor({ status: 't_error' }), 'failed')
})

test('converts stored WebVTT into readable transcript text', () => {
  const input = `WEBVTT\n\n1\n00:00:00.000 --> 00:00:02.000\n<v Eli>Hello Shawn.</v>\n\n2\n00:00:02.000 --> 00:00:04.000\n<v Shawn>Hello Eli.</v>`
  assert.equal(vttToPlainText(input), 'Hello Shawn.\nHello Eli.')
})
