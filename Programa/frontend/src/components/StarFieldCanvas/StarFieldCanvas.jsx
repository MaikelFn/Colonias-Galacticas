import { useEffect, useRef } from 'react'

/**
 * Componente que renderiza un campo de estrellas animado con efectos visuales.
 * Incluye estrellas parpadeantes, estelas de meteoritos y orbes flotantes.
 * Utiliza Canvas API para renderizado de alto rendimiento.
 * 
 * @returns {JSX.Element} Canvas con el campo de estrellas animado.
 */
export default function StarfieldCanvas() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    let W = (canvas.width = window.innerWidth)
    let H = (canvas.height = window.innerHeight)
    let raf
    let isPageVisible = true

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
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.2 + 0.2,
      a: Math.random(),
      da: (Math.random() - 0.5) * 0.008,
      color: randColor(),
    }))

    const STREAK_COUNT = 55
    function makeStreak(init = false) {
      const angle = Math.random() * Math.PI * 2
      const speed = Math.random() * 0.6 + 0.15
      const length = Math.random() * 60 + 20
      
      return {
        x: Math.random() * W,
        y: Math.random() * H,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        length,
        life: init ? Math.random() : 1,
        decay: Math.random() * 0.003 + 0.001,
        width: Math.random() * 1.2 + 0.3,
        color: randColor(),
      }
    }
    const streaks = Array.from({ length: STREAK_COUNT }, () => makeStreak(true))

    const ORB_COUNT = 18
    const orbs = Array.from({ length: ORB_COUNT }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 2.5 + 1,
      vx: (Math.random() - 0.5) * 0.12,
      vy: (Math.random() - 0.5) * 0.12,
      a: Math.random() * 0.5 + 0.1,
      da: (Math.random() - 0.5) * 0.004,
      color: randColor(),
    }))

    function draw() {
      if (!isPageVisible) return

      ctx.clearRect(0, 0, W, H)

      const radials = [
        { x: W * 0.2, y: H * 0.3, r: 280, c: 'rgba(20,184,166,0.028)' },
        { x: W * 0.8, y: H * 0.7, r: 240, c: 'rgba(6,182,212,0.022)' },
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
        const alpha = Math.max(0.01, Math.min(0.99, s.a)).toFixed(2)
        
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx.fillStyle = s.color + alpha + ')'
        ctx.fill()
      }

      for (let i = 0; i < streaks.length; i++) {
        const s = streaks[i]
        s.x += s.vx
        s.y += s.vy
        s.life -= s.decay

        if (
          s.life <= 0 ||
          s.x < -150 || s.x > W + 150 ||
          s.y < -150 || s.y > H + 150
        ) {
          streaks[i] = makeStreak(false)
          continue 
        }

        const tailX = s.x - s.vx * (s.length / s.width / 4)
        const tailY = s.y - s.vy * (s.length / s.width / 4)

        const currentLife = Math.max(0, s.life)
        const grad = ctx.createLinearGradient(tailX, tailY, s.x, s.y)
        grad.addColorStop(0, s.color + '0)')
        grad.addColorStop(1, s.color + (currentLife * 0.7).toFixed(3) + ')')

        ctx.beginPath()
        ctx.moveTo(tailX, tailY)
        ctx.lineTo(s.x, s.y)
        ctx.strokeStyle = grad
        ctx.lineWidth = Math.max(0.1, s.width * currentLife)
        ctx.lineCap = 'round'
        ctx.stroke()

        ctx.beginPath()
        ctx.arc(s.x, s.y, Math.max(0.1, s.width * 1.5 * currentLife), 0, Math.PI * 2)
        ctx.fillStyle = s.color + (currentLife * 0.5).toFixed(3) + ')'
        ctx.fill()
      }

      for (const o of orbs) {
        o.x += o.vx
        o.y += o.vy
        o.a += o.da
        if (o.a > 0.6 || o.a < 0.08) o.da *= -1

        if (o.x < -50) o.x = W + 50
        if (o.x > W + 50) o.x = -50
        if (o.y < -50) o.y = H + 50
        if (o.y > H + 50) o.y = -50

        const currentAlpha = Math.max(0.01, Math.min(0.99, o.a)).toFixed(2)
        const g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r * 3)
        g.addColorStop(0, o.color + currentAlpha + ')')
        g.addColorStop(1, 'transparent')
        
        ctx.beginPath()
        ctx.arc(o.x, o.y, o.r * 3, 0, Math.PI * 2)
        ctx.fillStyle = g
        ctx.fill()
      }

      raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)

    const onResize = () => {
      W = canvas.width = window.innerWidth
      H = canvas.height = window.innerHeight
      for (const s of stars) {
        s.x = Math.random() * W
        s.y = Math.random() * H
      }
    }
    window.addEventListener('resize', onResize)

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        isPageVisible = true
        cancelAnimationFrame(raf)
        raf = requestAnimationFrame(draw)
      } else {
        isPageVisible = false
        cancelAnimationFrame(raf)
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      cancelAnimationFrame(raf)
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