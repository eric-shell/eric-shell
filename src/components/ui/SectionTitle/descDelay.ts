/**
 * When the nth description element enters, in ms. Every section header shares
 * one rhythm: the eyebrow at 0, the heading's letters from 80ms, then the
 * description (copy, stats, controls, actions) from 340ms, 90ms apart.
 * Use it as `delayMs` on the CascadeItems passed as children.
 */
export const descDelay = (n: number) => 340 + n * 90
