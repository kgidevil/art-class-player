export type Clock = { index: number; count: number; duration: number; remaining: number; deadline: number | null; finished: boolean; durations?:number[] }
export function start(count: number, duration: number, now: number): Clock {
  if (!Number.isInteger(count) || count < 1 || !Number.isFinite(duration) || duration <= 0) throw new Error('Invalid session')
  return { index: 0, count, duration, remaining: duration, deadline: now + duration, finished: false }
}
export function startSequence(durations:number[],now:number):Clock {
 if(!durations.length||durations.some(d=>!Number.isFinite(d)||d<=0))throw Error('Invalid durations')
 return {...start(durations.length,durations[0],now),durations:[...durations]}
}
export function left(c: Clock, now: number) { return c.deadline === null ? c.remaining : Math.max(0, c.deadline - now) }
export function move(c: Clock, step: number, now: number): Clock {
  const index = Math.max(0, c.index + step)
  if (index >= c.count) return { ...c, deadline: null, remaining: 0, finished: true }
  const duration=c.durations?.[index]??c.duration
  return { ...c, index, duration, remaining: duration, deadline: c.deadline === null ? null : now + duration, finished: false }
}
export function tick(c: Clock, now: number): Clock {
  return c.deadline !== null && now >= c.deadline ? move(c, 1, now) : c
}
export function toggle(c: Clock, now: number): Clock {
  if (c.finished) return c
  if (c.deadline !== null) return { ...c, remaining: left(c, now), deadline: null }
  return { ...c, deadline: now + c.remaining }
}
export function extend(c: Clock, ms: number, now: number): Clock {
  if (c.finished) return c
  const remaining = left(c, now) + ms
  return { ...c, remaining, deadline: c.deadline === null ? null : now + remaining }
}
export function restart(c: Clock, now: number): Clock { return move(c, 0, now) }
export function formatTime(ms: number) {
  const seconds = Math.ceil(Math.max(0, ms) / 1000)
  return String(Math.floor(seconds / 60)).padStart(2,'0') + ':' + String(seconds % 60).padStart(2,'0')
}
export function shuffle<T>(items: T[], random = Math.random): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1)); [result[i], result[j]] = [result[j], result[i]]
  }
  return result
}
