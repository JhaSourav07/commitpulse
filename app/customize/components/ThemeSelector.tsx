// import type { ReactElement, ReactNode } from 'react';
// import { themes } from '../../../lib/svg/themes';
// import { THEME_KEYS, type ThemeKey } from '../types';
// import { SectionLabel } from './SectionLabel';

// function StyledSelect({
//   id,
//   value,
//   onChange,
//   children,
// }: {
//   id: string;
//   value: string;
//   onChange: (v: string) => void;
//   children: ReactNode;
// }): ReactElement {
//   return (
//     <select
//       id={id}
//       value={value}
//       onChange={(e) => onChange(e.target.value)}
//       className="w-full bg-black border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-emerald-500/50 transition-colors appearance-none cursor-pointer"
//     >
//       {children}
//     </select>
//   );
// }

// export function ThemeSelector({
//   theme,
//   onThemeChange,
// }: {
//   theme: string;
//   onThemeChange: (theme: string) => void;
// }): ReactElement {
//   const isAuto = theme === 'auto';

//   return (
//     <div className="flex flex-col gap-1.5">
//       <SectionLabel>Theme Preset</SectionLabel>
//       <div className="relative">
//         <StyledSelect id="theme-select" value={theme} onChange={onThemeChange}>
//           {THEME_KEYS.map((key) => (
//             <option key={key} value={key}>
//               {key === 'auto' ? 'Auto (System)' : key.charAt(0).toUpperCase() + key.slice(1)}
//             </option>
//           ))}
//         </StyledSelect>

//         <div className="mt-2 flex gap-1.5">
//           {isAuto ? (
//             <>
//               {/* Split swatch: left half = light bg, right half = dark bg */}
//               <span
//                 title="Light → Dark (auto)"
//                 className="w-5 h-5 rounded-md border border-white/10 overflow-hidden flex"
//               >
//                 <span className="w-1/2 h-full" style={{ backgroundColor: `#${themes.light.bg}` }} />
//                 <span className="w-1/2 h-full" style={{ backgroundColor: `#${themes.dark.bg}` }} />
//               </span>
//               <span className="text-[11px] text-white/25 ml-1 self-center">
//                 switches with OS theme
//               </span>
//             </>
//           ) : (
//             <>
//               {(['bg', 'accent', 'text'] as const).map((prop) => {
//                 const color = themes[theme as ThemeKey]?.[prop];
//                 return color ? (
//                   <span
//                     key={prop}
//                     title={`${prop}: #${color}`}
//                     className="w-5 h-5 rounded-md border border-white/10"
//                     style={{ backgroundColor: `#${color}` }}
//                   />
//                 ) : null;
//               })}
//               <span className="text-[11px] text-white/25 ml-1 self-center">bg · accent · text</span>
//             </>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

// export { StyledSelect };
import type { ReactElement, ReactNode } from 'react';
import { Shuffle } from 'lucide-react';

import { themes } from '../../../lib/svg/themes';
import { THEME_KEYS, type ThemeKey } from '../types';
import { SectionLabel } from './SectionLabel';

function StyledSelect({
  id,
  value,
  onChange,
  children,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  children: ReactNode;
}): ReactElement {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-black border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-emerald-500/50 transition-colors appearance-none cursor-pointer"
    >
      {children}
    </select>
  );
}

export function ThemeSelector({
  theme,
  onThemeChange,
}: {
  theme: string;
  onThemeChange: (theme: string) => void;
}): ReactElement {
  const isAuto = theme === 'auto';

 const handleRandomTheme = (): void => {
  const availableThemes = THEME_KEYS.filter(
    (key) => key !== 'auto' && key !== theme
  );

  const randomTheme =
    availableThemes[Math.floor(Math.random() * availableThemes.length)];

  onThemeChange(randomTheme);
};

  return (
    <div className="flex flex-col gap-1.5">
      <SectionLabel>Theme Preset</SectionLabel>

      <div className="relative">
        {/* Select + Shuffle Button */}
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <StyledSelect
              id="theme-select"
              value={theme}
              onChange={onThemeChange}
            >
              {THEME_KEYS.map((key) => (
                <option key={key} value={key}>
                  {key === 'auto'
                    ? 'Auto (System)'
                    : key.charAt(0).toUpperCase() + key.slice(1)}
                </option>
              ))}
            </StyledSelect>
          </div>

          <button
            type="button"
            onClick={handleRandomTheme}
            title="Shuffle Theme"
          className="h-10 w-10 cursor-pointer flex items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/70 transition-all duration-200 hover:bg-white/15 hover:border-white/20 hover:text-white hover:scale-105 active:scale-95"
          >
            <Shuffle className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-2 flex gap-1.5">
          {isAuto ? (
            <>
              {/* Split swatch: left half = light bg, right half = dark bg */}
              <span
                title="Light → Dark (auto)"
                className="w-5 h-5 rounded-md border border-white/10 overflow-hidden flex"
              >
                <span
                  className="w-1/2 h-full"
                  style={{ backgroundColor: `#${themes.light.bg}` }}
                />
                <span
                  className="w-1/2 h-full"
                  style={{ backgroundColor: `#${themes.dark.bg}` }}
                />
              </span>

              <span className="text-[11px] text-white/25 ml-1 self-center">
                switches with OS theme
              </span>
            </>
          ) : (
            <>
              {(['bg', 'accent', 'text'] as const).map((prop) => {
                const color = themes[theme as ThemeKey]?.[prop];

                return color ? (
                  <span
                    key={prop}
                    title={`${prop}: #${color}`}
                    className="w-5 h-5 rounded-md border border-white/10"
                    style={{ backgroundColor: `#${color}` }}
                  />
                ) : null;
              })}

              <span className="text-[11px] text-white/25 ml-1 self-center">
                bg · accent · text
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export { StyledSelect };