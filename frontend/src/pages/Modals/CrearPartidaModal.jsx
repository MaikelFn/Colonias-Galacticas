import { useEffect, useRef } from 'react'

export default function StarfieldCanvas() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    let W = canvas.width  = window.innerWidth
    let H = canvas.height = window.innerHeight
    let raf
    let lastFrameAt = Date.now()

    const TEAL_PALETTE = [
      'rgba(20, 184, 166, ',
      'rgba(45, 212, 191, ',
      'rgba(94, 234, 212, ',
      'rgba(153, 246, 228, ',
      'rgba(6,  182, 212, ',
      'rgba(34, 211, 238, ',
      'rgba(103, 232, 249, ',
    ]
    function randColor() {
      return TEAL_PALETTE[Math.floor(Math.random() * TEAL_PALETTE.length)]
    }

    const STAR_COUNT = 220
    const stars = Array.from({ length: STAR_COUNT }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      r: Math.random() * 1.2 + 0.2,
      a: Math.random(),
      da: (Math.random() - 0.5) * 0.008,
      color: randColor(),
    }))

    const STREAK_COUNT = 55
    function makeStreak() {
      const angle = Math.random() * Math.PI * 2
      const speed = Math.random() * 0.6 + 0.15
      return {
        x: Math.random() * W, y: Math.random() * H,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        length: Math.random() * 60 + 20,
        life: 1,
        decay: Math.random() * 0.003 + 0.001,
        width: Math.random() * 1.2 + 0.3,
        color: randColor(),
      }
    }
    const streaks = Array.from({ length: STREAK_COUNT }, makeStreak)

    const ORB_COUNT = 18
    const orbs = Array.from({ length: ORB_COUNT }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      r: Math.random() * 2.5 + 1,
      vx: (Math.random() - 0.5) * 0.12, vy: (Math.random() - 0.5) * 0.12,
      a: Math.random() * 0.5 + 0.1,
      da: (Math.random() - 0.5) * 0.004,
      color: randColor(),
    }))

    function draw() {
      lastFrameAt = Date.now()   // ← el watchdog lo monitorea

      try {
        ctx.clearRect(0, 0, W, H)

        const radials = [
          { x: W * 0.2, y: H * 0.3, r: 280, c: 'rgba(20,184,166,0.028)' },
          { x: W * 0.8, y: H * 0.7, r: 240, c: 'rgba(6,182,212,0.022)'  },
          { x: W * 0.5, y: H * 0.1, r: 180, c: 'rgba(45,212,191,0.018)' },
        ]
        for (const nb of radials) {
          const g = ctx.createRadialGradient(nb.x, nb.y, 0, nb.x, nb.y, nb.r)
          g.addColorStop(0, nb.c)
          g.addColorStop(1, 'transparent')
          ctx.fillStyle = g
          ctx.beginPath()
          ctx.arc(nb.x, nb.y, nb.r, 0, Math.PI * 2)
          ctx.fill()
        }

        for (const s of stars) {
          s.a += s.da
          if (s.a > 0.95 || s.a < 0.05) s.da *= -1
          ctx.beginPath()
          ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
          ctx.fillStyle = s.color + s.a + ')'
          ctx.fill()
        }

        for (let i = 0; i < streaks.length; i++) {
          const s = streaks[i]
          s.x += s.vx; s.y += s.vy; s.life -= s.decay
          const tailX = s.x - s.vx * (s.length / s.width / 4)
          const tailY = s.y - s.vy * (s.length / s.width / 4)
          const grad = ctx.createLinearGradient(tailX, tailY, s.x, s.y)
          grad.addColorStop(0, s.color + '0)')
          grad.addColorStop(1, s.color + (s.life * 0.7).toFixed(3) + ')')
          ctx.beginPath(); ctx.moveTo(tailX, tailY); ctx.lineTo(s.x, s.y)
          ctx.strokeStyle = grad; ctx.lineWidth = s.width * s.life
          ctx.lineCap = 'round'; ctx.stroke()
          ctx.beginPath()
          ctx.arc(s.x, s.y, s.width * 1.5 * s.life, 0, Math.PI * 2)
          ctx.fillStyle = s.color + (s.life * 0.5).toFixed(3) + ')'; ctx.fill()
          if (s.life <= 0 || s.x < -100 || s.x > W+100 || s.y < -100 || s.y > H+100)
            streaks[i] = makeStreak()
        }

        for (const o of orbs) {
          o.x += o.vx; o.y += o.vy; o.a += o.da
          if (o.a > 0.6 || o.a < 0.08) o.da *= -1
          if (o.x < 0) o.x = W; if (o.x > W) o.x = 0
          if (o.y < 0) o.y = H; if (o.y > H) o.y = 0
          const g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r * 3)
          g.addColorStop(0, o.color + o.a + ')'); g.addColorStop(1, 'transparent')
          ctx.beginPath(); ctx.arc(o.x, o.y, o.r * 3, 0, Math.PI * 2)
          ctx.fillStyle = g; ctx.fill()
        }
      } catch (_) { /* frame roto, continúa */ }

      raf = requestAnimationFrame(draw)
    }

    // ── Watchdog: si el loop lleva +600ms sin ejecutarse, lo reinicia ────────
    const watchdog = setInterval(() => {
      if (Date.now() - lastFrameAt > 600) {
        cancelAnimationFrame(raf)
        draw()
      }
    }, 600)

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        cancelAnimationFrame(raf)
        draw()
      }
    }

    const onResize = () => {
      W = canvas.width  = window.innerWidth
      H = canvas.height = window.innerHeight
      for (const s of stars) { s.x = Math.random() * W; s.y = Math.random() * H }
    }

    draw()
    window.addEventListener('resize', onResize)
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      cancelAnimationFrame(raf)
      clearInterval(watchdog)
      window.removeEventListener('resize', onResize)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  )
}