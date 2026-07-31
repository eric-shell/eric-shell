import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Minimal shape of the Web Speech API surface this hook touches.
 *
 * Hand-rolled rather than taken from `lib.dom`: the spec is a draft, the
 * constructor is still vendor-prefixed in Chrome and Safari, and the ambient
 * types are absent in some TS DOM lib versions. Typing only what we call keeps
 * the hook compiling regardless.
 */
interface SpeechAlternative { transcript: string }
interface SpeechResult { 0: SpeechAlternative; isFinal: boolean }
interface SpeechResultList { length: number; [i: number]: SpeechResult }
interface SpeechResultEvent { resultIndex: number; results: SpeechResultList }
interface SpeechErrorEvent { error: string }

interface SpeechRecognitionLike {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  abort(): void
  onresult: ((e: SpeechResultEvent) => void) | null
  onerror: ((e: SpeechErrorEvent) => void) | null
  onend: (() => void) | null
}

type SpeechCtor = new () => SpeechRecognitionLike

function getCtor(): SpeechCtor | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as {
    SpeechRecognition?: SpeechCtor
    webkitSpeechRecognition?: SpeechCtor
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

interface UseSpeechInputOptions {
  /**
   * Called on every result with the full composed field value — the text that
   * was present when dictation started, plus everything transcribed since.
   * It replaces rather than appends, so interim results can be revised in
   * place as the recognizer firms them up.
   */
  onTranscript: (value: string) => void
  /** Reads the field's current value at the moment dictation starts. */
  getValue: () => string
  /** Fires once per dictation session, when the mic actually opens. */
  onStart?: () => void
  /**
   * Recognition failed. `code` is the raw Web Speech error — `not-allowed` and
   * `service-not-allowed` mean the visitor (or their policy) denied the mic;
   * `no-speech` and `aborted` are routine and worth staying quiet about.
   */
  onError?: (code: string) => void
}

/**
 * Browser-native dictation for a text field. No audio ever reaches this site —
 * recognition happens in the browser, which on Chrome means the audio goes to
 * Google's speech service under their privacy policy, and on Safari to
 * Apple's. Firefox ships no implementation at all, which is why `supported`
 * exists: callers must not render a mic control when it is false.
 */
export function useSpeechInput({ onTranscript, getValue, onStart, onError }: UseSpeechInputOptions) {
  const [supported] = useState(() => getCtor() !== null)
  const [listening, setListening] = useState(false)
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  /** Field value at the moment the mic opened; dictation is composed onto it. */
  const baseRef = useRef('')
  /** Finalized text so far this session — interim results are appended after it. */
  const finalRef = useRef('')

  // Callbacks live in a ref so the recognizer's handlers always see the current
  // ones without tearing down and rebuilding an in-flight recognition session.
  // Synced in an effect rather than during render: nothing reads this while
  // rendering — only the recognizer's own async callbacks do.
  const handlers = useRef({ onTranscript, getValue, onStart, onError })
  useEffect(() => {
    handlers.current = { onTranscript, getValue, onStart, onError }
  }, [onTranscript, getValue, onStart, onError])

  const stop = useCallback(() => {
    recognitionRef.current?.stop()
  }, [])

  const start = useCallback(() => {
    const Ctor = getCtor()
    if (!Ctor || recognitionRef.current) return

    const recognition = new Ctor()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = navigator.language || 'en-US'

    const base = handlers.current.getValue()
    // Dictating onto existing text should read as continuing a sentence, not
    // as jamming a word onto the end of one.
    baseRef.current = base && !/\s$/.test(base) ? base + ' ' : base
    finalRef.current = ''

    recognition.onresult = e => {
      let interim = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const result = e.results[i]
        if (result.isFinal) finalRef.current += result[0].transcript
        else interim += result[0].transcript
      }
      handlers.current.onTranscript(baseRef.current + finalRef.current + interim)
    }

    recognition.onerror = e => {
      handlers.current.onError?.(e.error)
    }

    // `onend` fires for every exit — an explicit stop, an error, and the
    // recognizer timing out on its own — so it is the single place the
    // listening state is cleared.
    recognition.onend = () => {
      recognitionRef.current = null
      setListening(false)
    }

    try {
      recognition.start()
    } catch {
      // Already-started races: the object is unusable, so drop it.
      return
    }
    recognitionRef.current = recognition
    setListening(true)
    handlers.current.onStart?.()
  }, [])

  const toggle = useCallback(() => {
    if (recognitionRef.current) stop()
    else start()
  }, [start, stop])

  // An open mic must not outlive the component. `abort` rather than `stop`:
  // there is no longer anything to deliver a final result to.
  useEffect(() => () => recognitionRef.current?.abort(), [])

  return { supported, listening, start, stop, toggle }
}
