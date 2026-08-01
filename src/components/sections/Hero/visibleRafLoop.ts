/**
 * A requestAnimationFrame loop that only runs while `el` is on screen.
 *
 * The homepage mounts four of these canvases — ParticlesSmall and
 * ParticlesLarge, once in Hero and again in Contact — and every one of them
 * used to paint for the whole life of the page. The expensive part is not the
 * particle count (7 for Large) but fill rate: each frame is a full-viewport
 * clearRect plus additive `lighter` blending at up to 2x DPR, and Large's
 * sprites are drawn at roughly half the viewport width. Four of those
 * compositing every frame while the visitor reads the Work section is real
 * battery for nothing visible.
 *
 * rAF already stops in a background *tab*; nothing in the platform stops it for
 * a canvas that has merely been scrolled past, which is what this is for.
 *
 * `frame` receives a delta expressed in 60fps frames: 1 on a 60Hz display, ~0.5
 * on a 120Hz one, ~2 if the browser is dropping to 30. Callers multiply their
 * per-frame increments by it. The sims were previously fixed-step — a constant
 * added per frame regardless of how long the frame took — which meant they ran
 * at literally double speed on a 120Hz display and faster still on 144Hz.
 *
 * Two guards keep delta-time from reintroducing the hazard that made fixed-step
 * safe to pause:
 *
 *   MAX_DELTA caps a single step at 3 frames. A tab that stalls, or a machine
 *   that sleeps, otherwise hands the sim one enormous dt and teleports every
 *   particle. Absorbing a dropped frame or two is the legitimate case; anything
 *   beyond that is not animation, it is a gap.
 *
 *   `last` is re-baselined to 0 on every start(), so the very first frame after
 *   an off-screen pause is charged as one nominal frame rather than the entire
 *   time spent scrolled away. This is what preserves the freeze-and-resume
 *   behaviour the IntersectionObserver gating depends on.
 *
 * Returns a teardown that stops the loop and disconnects the observer.
 */
const FRAME_MS = 1000 / 60
const MAX_DELTA = 3

export function visibleRafLoop(el: Element, frame: (delta: number) => void): () => void {
  let raf = 0
  let running = false
  let last = 0

  function tick(now: number) {
    raf = requestAnimationFrame(tick)
    const delta = last === 0 ? 1 : Math.min((now - last) / FRAME_MS, MAX_DELTA)
    last = now
    frame(delta)
  }

  function start() {
    if (running) return
    running = true
    // Not a resume of elapsed time — see the MAX_DELTA / re-baseline note above.
    last = 0
    raf = requestAnimationFrame(tick)
  }

  function stop() {
    if (!running) return
    running = false
    cancelAnimationFrame(raf)
  }

  // Default threshold (0) is what we want: start as soon as any sliver is
  // visible, so the canvas is never caught mid-scroll with a stale frame.
  const observer = new IntersectionObserver(entries => {
    if (entries[entries.length - 1].isIntersecting) start()
    else stop()
  })
  observer.observe(el)

  return () => {
    stop()
    observer.disconnect()
  }
}
