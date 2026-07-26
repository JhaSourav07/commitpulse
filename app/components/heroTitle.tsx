import { Fragment, type ReactNode } from 'react';

const HIGHLIGHT_CLASS =
  'contribution-text inline-block bg-[length:300%_300%] bg-gradient-to-r from-emerald-400 via-cyan-500 to-purple-500 bg-clip-text text-transparent drop-shadow-sm';

// Localized hero title: "\n" is a line break and a single-brace {word} is the
// gradient-highlighted word (kept as .contribution-text for the GSAP animation).
export function renderHeroTitle(title: string): ReactNode {
  return title.split('\n').map((line, lineIndex) => (
    <Fragment key={lineIndex}>
      {lineIndex > 0 && <br />}
      {line.split(/(\{[^}]+\})/g).map((part, partIndex) => {
        const highlighted = part.match(/^\{([^}]+)\}$/);
        return highlighted ? (
          <span key={partIndex} className={HIGHLIGHT_CLASS}>
            {highlighted[1]}
          </span>
        ) : (
          <Fragment key={partIndex}>{part}</Fragment>
        );
      })}
    </Fragment>
  ));
}
