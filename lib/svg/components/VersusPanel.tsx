import React from 'react';
import { truncateUsername } from '../generator';

export interface VersusPanelProps {
  user1: string;
  user2: string;
  isWinner1: boolean;
  isWinner2: boolean;
  isTied: boolean;
  singleW: number;
  H: number;
  sf: number;
  towers1: string;
  towers2: string;
  labels1: string;
  labels2: string;
  stats1Html: string;
  stats2Html: string;
  accent: string;
  text: string;
  statsFont: string;
  bg: string;
  autoTheme?: boolean;
}

export const VersusPanel: React.FC<VersusPanelProps> = ({
  user1,
  user2,
  isWinner1,
  isWinner2,
  isTied,
  singleW,
  H,
  sf,
  towers1,
  towers2,
  labels1,
  labels2,
  stats1Html,
  stats2Html,
  accent,
  text,
  statsFont,
  bg,
  autoTheme = false,
}) => {
  // React will automatically escape the username when placed in JSX children.
  // We apply uppercase and crown logic here.
  const title1 = `${truncateUsername(user1 || 'User 1').toUpperCase()}${isWinner1 && !isTied ? ' 👑' : ''}`;
  const title2 = `${truncateUsername(user2 || 'User 2').toUpperCase()}${isWinner2 && !isTied ? ' 👑' : ''}`;

  const s = (val: number) => Math.round(val * sf);

  return (
    <React.Fragment>
      <g transform="translate(0, 0)">
        <g
          transform={`translate(0, ${Math.round(20 * sf)})`}
          dangerouslySetInnerHTML={{ __html: towers1 }}
        />
        <g dangerouslySetInnerHTML={{ __html: labels1 }} />
        <g dangerouslySetInnerHTML={{ __html: stats1Html }} />
        <text x={s(300)} y={s(50)} textAnchor="middle" className="title">
          {title1}
        </text>
      </g>

      <g transform={`translate(${singleW}, 0)`}>
        <g
          transform={`translate(0, ${Math.round(20 * sf)})`}
          dangerouslySetInnerHTML={{ __html: towers2 }}
        />
        <g dangerouslySetInnerHTML={{ __html: labels2 }} />
        <g dangerouslySetInnerHTML={{ __html: stats2Html }} />
        <text x={s(300)} y={s(50)} textAnchor="middle" className="title">
          {title2}
        </text>
      </g>

      <line
        x1={singleW}
        y1={s(40)}
        x2={singleW}
        y2={H - s(40)}
        stroke={autoTheme ? 'var(--cp-text)' : text}
        strokeOpacity="0.2"
        strokeWidth="2"
        strokeDasharray="4 4"
      />

      <g transform={`translate(${singleW}, ${H / 2})`}>
        <circle
          cx="0"
          cy="0"
          r={s(24)}
          className={autoTheme ? 'cp-bg-fill' : undefined}
          fill={autoTheme ? undefined : bg}
          stroke={autoTheme ? 'var(--cp-accent)' : accent}
          strokeWidth="2"
        />
        <text
          x="0"
          y={s(6)}
          textAnchor="middle"
          fontFamily={statsFont}
          className={autoTheme ? 'cp-accent-fill' : undefined}
          fill={autoTheme ? undefined : accent}
          fontSize={s(16)}
          fontWeight="bold"
        >
          VS
        </text>
      </g>
    </React.Fragment>
  );
};
