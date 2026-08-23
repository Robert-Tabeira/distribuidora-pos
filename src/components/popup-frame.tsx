'use client'

export interface PopupFrameStyle {
  border_style: 'none' | 'solid' | 'dashed' | 'dotted'
  border_width: number
  border_color: string
  border_radius: number
  dash_length: number
  dash_gap: number
  shape: 'rectangular' | 'ticket'
}

// Radio de las muescas laterales del efecto "ticket" (en px)
const NOTCH_RADIUS = 14

export function PopupFrame({
  frame,
  backgroundColor,
  className = '',
  children
}: {
  frame: PopupFrameStyle
  backgroundColor?: string
  className?: string
  children: React.ReactNode
}) {
  const isTicket = frame.shape === 'ticket'

  const showBorder = frame.border_style !== 'none' && frame.border_width > 0
  const dashArray =
    frame.border_style === 'dashed'
      ? `${frame.dash_length} ${frame.dash_gap}`
      : frame.border_style === 'dotted'
        ? `0.1 ${frame.dash_gap}`
        : undefined

  return (
    <div
      className={`relative ${className}`}
      style={{ backgroundColor, borderRadius: frame.border_radius }}
    >
      {/* Muescas laterales tipo ticket/cupón: replican el fondo oscuro
          difuminado detrás del pop-up, "perforando" visualmente el borde */}
      {isTicket && (
        <>
          <div
            className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/60 backdrop-blur-sm rounded-full pointer-events-none z-10"
            style={{ width: NOTCH_RADIUS * 2, height: NOTCH_RADIUS * 2 }}
          />
          <div
            className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 bg-black/60 backdrop-blur-sm rounded-full pointer-events-none z-10"
            style={{ width: NOTCH_RADIUS * 2, height: NOTCH_RADIUS * 2 }}
          />
        </>
      )}

      {showBorder && (
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none z-[5]"
          preserveAspectRatio="none"
        >
          <rect
            x={frame.border_width / 2}
            y={frame.border_width / 2}
            width={`calc(100% - ${frame.border_width}px)`}
            height={`calc(100% - ${frame.border_width}px)`}
            rx={Math.max(0, frame.border_radius - frame.border_width / 2)}
            fill="none"
            stroke={frame.border_color}
            strokeWidth={frame.border_width}
            strokeDasharray={dashArray}
            strokeLinecap={frame.border_style === 'dotted' ? 'round' : 'butt'}
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      )}
      {children}
    </div>
  )
}
