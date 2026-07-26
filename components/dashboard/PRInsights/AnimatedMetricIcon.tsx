import { motion } from 'framer-motion';

interface AnimatedMetricIconProps {
  type: string;
  hovered: boolean;
}

export default function AnimatedMetricIcon({ type, hovered }: AnimatedMetricIconProps) {
  const baseTransition = {
    duration: 2.2,
    repeat: Infinity,
    ease: 'linear' as const,
  };

  return (
    <div className="absolute top-0 right-0 p-4 pointer-events-none">
      <svg
        width="80"
        height="80"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`transition-all duration-300 ${
          hovered ? 'text-white/25 opacity-100' : 'text-white/10 opacity-100'
        }`}
      >
        <defs>
          <filter id="metricGlow" x="-200%" y="-200%" width="500%" height="500%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* TOTAL PRs — GitPullRequest icon */}
        {type === 'Total PRs' && (
          <>
            {/* Icon paths */}
            <circle cx="18" cy="18" r="3" />
            <circle cx="6" cy="6" r="3" />
            <path d="M13 6h3a2 2 0 0 1 2 2v7" />
            <line x1="6" x2="6" y1="9" y2="21" />

            {hovered && (
              <>
                <motion.circle
                  r="1.1"
                  fill="#ffffff"
                  filter="url(#metricGlow)"
                  animate={{
                    cx: [6, 6, 6, 6, 6],
                    cy: [9, 13, 17, 21, 21],
                  }}
                  transition={{ ...baseTransition, duration: 2.2 }}
                />
                <motion.circle
                  r="2.4"
                  fill="transparent"
                  stroke="#ffffff"
                  strokeWidth="0.3"
                  filter="url(#metricGlow)"
                  animate={{
                    cx: [6, 6, 6, 6, 6],
                    cy: [9, 13, 17, 21, 21],
                    opacity: [0.9, 0.4, 0.9, 0.2, 0],
                    scale: [1, 1.5, 1, 1.8, 1],
                  }}
                  transition={{ ...baseTransition, duration: 2.2 }}
                />

                <motion.circle
                  r="1.1"
                  fill="#ffffff"
                  filter="url(#metricGlow)"
                  animate={{
                    cx: [13, 15, 18, 18, 18, 18, 18, 18, 18, 18, 16, 13],
                    cy: [6, 6, 6, 9, 12, 15, 18, 15, 12, 9, 6, 6],
                  }}
                  transition={{ ...baseTransition, duration: 3.2 }}
                />
                <motion.circle
                  r="2.4"
                  fill="transparent"
                  stroke="#ffffff"
                  strokeWidth="0.3"
                  filter="url(#metricGlow)"
                  animate={{
                    cx: [13, 15, 18, 18, 18, 18, 18, 18, 18, 18, 16, 13],
                    cy: [6, 6, 6, 9, 12, 15, 18, 15, 12, 9, 6, 6],
                    opacity: [0.9, 0.6, 0.4, 0.6, 0.8, 0.6, 0.2, 0.4, 0.6, 0.8, 0.6, 0.9],
                    scale: [1, 1.3, 1.6, 1.3, 1, 1.3, 2, 1.5, 1, 1.3, 1.5, 1],
                  }}
                  transition={{ ...baseTransition, duration: 3.2 }}
                />
              </>
            )}
          </>
        )}

        {/* MERGE RATE — GitMerge icon */}
        {type === 'Merge Rate' && (
          <>
            <circle cx="18" cy="18" r="3" />
            <circle cx="6" cy="6" r="3" />
            <path d="M6 21V9a9 9 0 0 0 9 9" />

            {hovered &&
              (() => {
                const arcXs = [
                  6, 6.028, 6.111, 6.249, 6.44, 6.685, 6.981, 7.326, 7.719, 8.156, 8.636, 9.155,
                  9.71, 10.298, 10.914, 11.556, 12.219, 12.899, 13.592, 14.294, 15,
                ];
                const arcYs = [
                  9, 9.706, 10.408, 11.101, 11.781, 12.444, 13.086, 13.702, 14.29, 14.845, 15.364,
                  15.844, 16.281, 16.674, 17.019, 17.315, 17.56, 17.751, 17.889, 17.972, 18,
                ];

                const extendedXs = [18, 18, ...arcXs.slice().reverse()];
                const extendedYs = [21, 18, ...arcYs.slice().reverse()];

                const dot2cx = [...extendedXs, ...extendedXs.slice().reverse()];
                const dot2cy = [...extendedYs, ...extendedYs.slice().reverse()];

                return (
                  <>
                    <motion.circle
                      r="1.1"
                      fill="#ffffff"
                      filter="url(#metricGlow)"
                      animate={{
                        cx: [6, 6, 6, 6, 6, 6],
                        cy: [9, 12, 15, 17, 20, 21],
                      }}
                      transition={{ ...baseTransition, duration: 2.4 }}
                    />
                    <motion.circle
                      r="2.4"
                      fill="transparent"
                      stroke="#ffffff"
                      strokeWidth="0.3"
                      filter="url(#metricGlow)"
                      animate={{
                        cx: [6, 6, 6, 6, 6, 6],
                        cy: [9, 12, 15, 17, 20, 21],
                        opacity: [0.9, 0.7, 0.6, 0.5, 0.3, 0.05],
                        scale: [1, 1.3, 1.5, 1.4, 1.6, 2],
                      }}
                      transition={{ ...baseTransition, duration: 2.4 }}
                    />

                    <motion.circle
                      r="1.1"
                      fill="#ffffff"
                      filter="url(#metricGlow)"
                      animate={{
                        cx: dot2cx,
                        cy: dot2cy,
                      }}
                      transition={{ ...baseTransition, duration: 4.8, delay: 1.2 }}
                    />
                    <motion.circle
                      r="2.4"
                      fill="transparent"
                      stroke="#ffffff"
                      strokeWidth="0.3"
                      filter="url(#metricGlow)"
                      animate={{
                        cx: dot2cx,
                        cy: dot2cy,
                        opacity: [
                          0, 0.5, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.15, 0.1, 0.08, 0.06,
                          0.05, 0.04, 0.03, 0.02, 0.02, 0.01, 0.01, 0.01, 0.0, 0.0, 0.01, 0.01,
                          0.01, 0.02, 0.02, 0.03, 0.04, 0.05, 0.06, 0.08, 0.1, 0.15, 0.2, 0.3, 0.4,
                          0.5, 0.6, 0.7, 0.8, 0.9, 0.5, 0,
                        ],
                        scale: [
                          1.8, 1.4, 1, 1.1, 1.2, 1.3, 1.3, 1.4, 1.4, 1.5, 1.5, 1.6, 1.6, 1.7, 1.7,
                          1.8, 1.8, 1.9, 1.9, 2, 2, 2, 2, 2, 2, 2, 1.9, 1.9, 1.8, 1.8, 1.7, 1.7,
                          1.6, 1.6, 1.5, 1.5, 1.4, 1.4, 1.3, 1.3, 1.2, 1.1, 1, 1.4, 1.8,
                        ],
                      }}
                      transition={{ ...baseTransition, duration: 4.8, delay: 1.2 }}
                    />
                  </>
                );
              })()}
          </>
        )}

        {/* AVG CYCLE TIME */}
        {type === 'Avg Cycle Time' && (
          <>
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />

            {hovered && (
              <>
                {(() => {
                  const cx = 12;
                  const cy = 12;
                  const r = 10;
                  const steps = 60;

                  const xs: number[] = [];
                  const ys: number[] = [];

                  for (let i = 0; i <= steps; i++) {
                    const angle = (i / steps) * 2 * Math.PI - Math.PI / 2;

                    xs.push(Number((cx + r * Math.cos(angle)).toFixed(3)));
                    ys.push(Number((cy + r * Math.sin(angle)).toFixed(3)));
                  }

                  return (
                    <>
                      <motion.circle
                        r="1.1"
                        fill="#ffffff"
                        filter="url(#metricGlow)"
                        animate={{
                          cx: xs,
                          cy: ys,
                        }}
                        transition={{
                          duration: 4,
                          repeat: Infinity,
                          ease: 'linear',
                        }}
                      />

                      <motion.circle
                        r="2.2"
                        fill="transparent"
                        stroke="#ffffff"
                        strokeWidth="0.3"
                        filter="url(#metricGlow)"
                        animate={{
                          cx: xs,
                          cy: ys,
                          opacity: [0.8, 0.4, 0.8],
                          scale: [1, 1.8, 1],
                        }}
                        transition={{
                          duration: 4,
                          repeat: Infinity,
                          ease: 'linear',
                        }}
                      />
                    </>
                  );
                })()}
              </>
            )}
          </>
        )}

        {/* FIRST REVIEW */}
        {type === 'First Review' && (
          <>
            <path d="M3 12h3l2-4 4 8 2-4h7" />

            {hovered && (
              <>
                <motion.circle
                  r="1.1"
                  fill="#ffffff"
                  filter="url(#metricGlow)"
                  animate={{
                    cx: [3, 6, 8, 10, 12, 14, 17, 21],
                    cy: [12, 12, 8, 12, 16, 12, 12, 12],
                  }}
                  transition={baseTransition}
                />
                <motion.circle
                  r="2.4"
                  fill="transparent"
                  stroke="#ffffff"
                  strokeWidth="0.3"
                  filter="url(#metricGlow)"
                  animate={{
                    cx: [3, 6, 8, 10, 12, 14, 17, 21],
                    cy: [12, 12, 8, 12, 16, 12, 12, 12],
                    opacity: [0.8, 0, 0.8],
                    scale: [1, 2, 1],
                  }}
                  transition={baseTransition}
                />
              </>
            )}
          </>
        )}
      </svg>
    </div>
  );
}
