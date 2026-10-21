export type TranscriptState = 'not_started' | 'in_progress' | 'processing' | 'available' | 'failed' | 'unavailable'

export interface DailyTranscriptResult {
  state: TranscriptState
  transcriptId?: string
  providerStatus?: string
  content?: string
  message: string
}

interface DailyTranscript {
  transcriptId: string
  status: 't_finished' | 't_in_progress' | 't_error' | 't_deleted'
  isVttAvailable?: boolean
  created_at?: string
  error?: string | null
}

function getApiKey() {
  const apiKey = process.env.DAILY_API_KEY
  if (!apiKey) throw new Error('DAILY_API_KEY is not configured in environment variables')
  return apiKey
}

async function dailyRequest(path: string, init?: RequestInit) {
  const response = await fetch(`https://api.daily.co/v1${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      'Content-Type': 'application/json',
      ...init?.headers,
    },
    cache: 'no-store',
  })

  if (!response.ok) {
    let detail = response.statusText
    try {
      const body = (await response.json()) as { error?: string; info?: string }
      detail = body.info || body.error || detail
    } catch {
      // Keep the HTTP status text when Daily did not return JSON.
    }
    throw new Error(`Daily request failed (${response.status}): ${detail}`)
  }

  return response
}

export function getDailyRoomName(roomUrl?: string | null): string | null {
  if (!roomUrl) return null
  try {
    const pathname = new URL(roomUrl).pathname
    const roomName = pathname.split('/').filter(Boolean).at(-1)
    return roomName || null
  } catch {
    return null
  }
}

export function transcriptStateFor(
  transcript: Pick<DailyTranscript, 'status' | 'isVttAvailable'>,
): TranscriptState {
  if (transcript.status === 't_error' || transcript.status === 't_deleted') return 'failed'
  if (transcript.status === 't_in_progress') return 'in_progress'
  return transcript.isVttAvailable ? 'available' : 'processing'
}

export function vttToPlainText(vtt: string): string {
  return vtt
    .replace(/^WEBVTT.*$/gim, '')
    .replace(/^NOTE[\s\S]*?(?=\n\n|$)/gim, '')
    .replace(/^\d+\s*$/gm, '')
    .replace(/^\d{2}:\d{2}(?::\d{2})?\.\d{3}\s+-->.*$/gm, '')
    .replace(/<[^>]+>/g, '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .join('\n')
}

export async function createDailyRoom(
  roomName?: string,
): Promise<{ id: string; url: string; name: string }> {

  const payload: Record<string, unknown> = {
    privacy: 'public',
    properties: {
      enable_chat: true,
      enable_screenshare: true,
      enable_prejoin_ui: true,
      enable_live_captions_ui: true,
      enable_transcription_storage: true,
      max_participants: 4,
      start_audio_off: false,
      start_video_off: false,
    },
  }

  if (roomName) {
    const sanitized = roomName.toLowerCase().replace(/[^a-z0-9_-]/g, '-').slice(0, 50)
    payload.name = sanitized
  }

  const res = await dailyRequest('/rooms', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  const data = (await res.json()) as { id: string; url: string; name: string }
  return { id: data.id, url: data.url, name: data.name }
}

export async function startDailyTranscription(roomUrl: string) {
  const roomName = getDailyRoomName(roomUrl)
  if (!roomName) throw new Error('This meeting does not have a valid Daily room URL.')

  await dailyRequest(`/rooms/${encodeURIComponent(roomName)}/transcription/start`, {
    method: 'POST',
    body: JSON.stringify({ language: 'en', punctuate: true }),
  })
}

export async function stopDailyTranscription(roomUrl: string) {
  const roomName = getDailyRoomName(roomUrl)
  if (!roomName) throw new Error('This meeting does not have a valid Daily room URL.')

  await dailyRequest(`/rooms/${encodeURIComponent(roomName)}/transcription/stop`, {
    method: 'POST',
    body: JSON.stringify({}),
  })
}

export async function getDailyTranscript(roomUrl?: string | null): Promise<DailyTranscriptResult> {
  const roomName = getDailyRoomName(roomUrl)
  if (!roomName) {
    return { state: 'unavailable', message: 'No Daily room is associated with this meeting.' }
  }

  try {
    const response = await dailyRequest(`/transcript?room_name=${encodeURIComponent(roomName)}&limit=20`)
    const result = (await response.json()) as { data?: DailyTranscript[] }
    const transcript = (result.data || []).sort((a, b) =>
      String(b.created_at || '').localeCompare(String(a.created_at || '')),
    )[0]

    if (!transcript) {
      return { state: 'not_started', message: 'No transcript has been created for this meeting yet.' }
    }

    const state = transcriptStateFor(transcript)
    if (state !== 'available') {
      return {
        state,
        transcriptId: transcript.transcriptId,
        providerStatus: transcript.status,
        message:
          state === 'in_progress'
            ? 'Live transcription is running. Refresh after the meeting to load the saved transcript.'
            : state === 'processing'
              ? 'Daily is finalizing the saved transcript.'
              : transcript.error || 'Daily reported a transcription failure.',
      }
    }

    const linkResponse = await dailyRequest(`/transcript/${encodeURIComponent(transcript.transcriptId)}/access-link`)
    const linkResult = (await linkResponse.json()) as { link?: string; download_link?: string }
    const link = linkResult.link || linkResult.download_link
    if (!link) {
      return {
        state: 'processing',
        transcriptId: transcript.transcriptId,
        providerStatus: transcript.status,
        message: 'The transcript is ready, but its download link is not available yet.',
      }
    }

    const transcriptResponse = await fetch(link, { cache: 'no-store' })
    if (!transcriptResponse.ok) {
      throw new Error(`Transcript download failed (${transcriptResponse.status}).`)
    }
    const content = vttToPlainText(await transcriptResponse.text())

    return {
      state: 'available',
      transcriptId: transcript.transcriptId,
      providerStatus: transcript.status,
      content,
      message: content ? 'Saved transcript is available.' : 'Transcript file is available but contains no speech.',
    }
  } catch (error) {
    return {
      state: 'unavailable',
      message: error instanceof Error ? error.message : 'Transcript status could not be loaded.',
    }
  }
}
