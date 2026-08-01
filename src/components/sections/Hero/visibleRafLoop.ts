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
 * Pausing is safe to do bluntly here because both simulations are fixed-step —
 * they advance by a constant per frame (`t += 0.003`) rather than by elapsed
 * time. A paused loop therefore freezes and resumes exactly where it stopped,
 * with no jump and no catch-up burst. Do not convert these sims to delta-time
 * without revisiting this: under delta-time, resuming after a long scroll-away
 * would integrate one enormous step.
 *
 * Returns a teardown that stops the loop and disconnects the observer.
 */
export function visibleRafLoop(el: Element, frame: () => void): () => void {
  let raf = 0
  let running = false

  function tick() {
    raf = requestAnimationFrame(tick)
    frame()
  }

  function start() {
    if (running) return
    running = true
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
