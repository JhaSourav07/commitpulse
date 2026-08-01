'use client';

import { useState, useMemo } from 'react';
import { Image as ImageIcon, Loader2, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { SectionCard, FieldLabel } from '../SectionCard';
import { useDebounce } from '@/hooks/useDebounce';

export interface HeroImageSectionProps {
  showHeroImage: boolean;
  heroImageUrl: string;
  heroImageWidth: string;
  heroImageAlign: 'left' | 'center' | 'right';
  heroImageAlt: string;
  onShowHeroImageChange: (v: boolean) => void;
  onHeroImageUrlChange: (v: string) => void;
  onHeroImageWidthChange: (v: string) => void;
  onHeroImageAlignChange: (v: 'left' | 'center' | 'right') => void;
  onHeroImageAltChange: (v: string) => void;
  onReset?: () => void;
}

const PRESET_WIDTHS = ['300', '450', '600', '100%'];

function sanitizeImageUrl(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return encodeURI(parsed.href);
    }
  } catch {
    if (/^data:image\/(png|jpeg|webp|gif|svg\+xml);base64,/i.test(trimmed)) {
      return encodeURI(trimmed);
    }
  }
  return null;
}

export function HeroImageSection({
  showHeroImage,
  heroImageUrl,
  heroImageWidth,
  heroImageAlign,
  heroImageAlt,
  onShowHeroImageChange,
  onHeroImageUrlChange,
  onHeroImageWidthChange,
  onHeroImageAlignChange,
  onHeroImageAltChange,
  onReset,
}: HeroImageSectionProps) {
  const safeUrl = heroImageUrl || '';
  const trimmedUrl = safeUrl.trim();
  const debouncedUrl = useDebounce(trimmedUrl, 400);

  const safePreviewUrl = useMemo(() => {
    const sanitized = sanitizeImageUrl(debouncedUrl);
    return sanitized ? encodeURI(sanitized) : null;
  }, [debouncedUrl]);

  const safeAltText = useMemo(() => {
    return (heroImageAlt || 'Hero Preview').replace(/[<>"']/g, '');
  }, [heroImageAlt]);

  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const badgeCount = showHeroImage && trimmedUrl ? 1 : 0;

  return (
    <div id="hero-image-section">
      <SectionCard
        title="Hero Image / GIF"
        description="Add a customizable coding GIF or banner below your introduction"
        defaultOpen={true}
        badge={badgeCount}
        onReset={onReset}
      >
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="text-xs font-semibold text-gray-700 dark:text-white/70">
              Include Hero Image or GIF
            </p>
            <p className="text-[11px] text-gray-400 dark:text-white/30 mt-0.5 max-w-[280px]">
              Display an eye-catching header image, GIF, or banner right below your bio section.
            </p>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={showHeroImage}
            aria-label="Toggle Hero Image"
            onClick={() => onShowHeroImageChange(!showHeroImage)}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 ${
              showHeroImage ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-white/10'
            }`}
          >
            <span
              aria-hidden="true"
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                showHeroImage ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {showHeroImage && (
          <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
            {/* Image URL Input */}
            <div>
              <FieldLabel htmlFor="hero-image-url">Image or GIF URL</FieldLabel>
              <div className="relative flex items-center">
                <input
                  id="hero-image-url"
                  type="url"
                  value={heroImageUrl}
                  onChange={(e) => {
                    onHeroImageUrlChange(e.target.value);
                    setImgLoaded(false);
                    setImgError(false);
                  }}
                  placeholder="https://media.giphy.com/media/v1.Y2lkPT.../giphy.gif"
                  className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition-colors"
                />
              </div>
            </div>

            {/* Alignment and Width Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Alignment */}
              <div>
                <FieldLabel>Alignment</FieldLabel>
                <div className="flex rounded-xl bg-gray-100 dark:bg-white/5 p-1 gap-1 border border-gray-200/60 dark:border-white/5">
                  <button
                    type="button"
                    onClick={() => onHeroImageAlignChange('left')}
                    aria-label="Align Left"
                    title="Left"
                    className={`flex-1 flex items-center justify-center py-1.5 rounded-lg text-xs font-medium transition-all ${
                      heroImageAlign === 'left'
                        ? 'bg-white dark:bg-white/10 text-emerald-600 dark:text-emerald-400 shadow-sm'
                        : 'text-gray-500 dark:text-white/40 hover:text-gray-700 dark:hover:text-white/70'
                    }`}
                  >
                    <AlignLeft size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onHeroImageAlignChange('center')}
                    aria-label="Align Center"
                    title="Center"
                    className={`flex-1 flex items-center justify-center py-1.5 rounded-lg text-xs font-medium transition-all ${
                      heroImageAlign === 'center'
                        ? 'bg-white dark:bg-white/10 text-emerald-600 dark:text-emerald-400 shadow-sm'
                        : 'text-gray-500 dark:text-white/40 hover:text-gray-700 dark:hover:text-white/70'
                    }`}
                  >
                    <AlignCenter size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onHeroImageAlignChange('right')}
                    aria-label="Align Right"
                    title="Right"
                    className={`flex-1 flex items-center justify-center py-1.5 rounded-lg text-xs font-medium transition-all ${
                      heroImageAlign === 'right'
                        ? 'bg-white dark:bg-white/10 text-emerald-600 dark:text-emerald-400 shadow-sm'
                        : 'text-gray-500 dark:text-white/40 hover:text-gray-700 dark:hover:text-white/70'
                    }`}
                  >
                    <AlignRight size={14} />
                  </button>
                </div>
              </div>

              {/* Image Width */}
              <div>
                <FieldLabel htmlFor="hero-image-width">Width (px or %)</FieldLabel>
                <div className="flex gap-2">
                  <input
                    id="hero-image-width"
                    type="text"
                    value={heroImageWidth}
                    onChange={(e) => onHeroImageWidthChange(e.target.value)}
                    placeholder="e.g. 450"
                    className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Quick Width Selector */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-gray-400 dark:text-white/30 mr-1">Presets:</span>
              {PRESET_WIDTHS.map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => onHeroImageWidthChange(w)}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors border ${
                    heroImageWidth === w
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                      : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-white/50 border-gray-200 dark:border-white/5 hover:border-gray-300 dark:hover:border-white/20'
                  }`}
                >
                  {w === '100%' ? '100%' : `${w}px`}
                </button>
              ))}
            </div>

            {/* Alt Text Input */}
            <div>
              <FieldLabel htmlFor="hero-image-alt">Alt Text (Accessibility)</FieldLabel>
              <input
                id="hero-image-alt"
                type="text"
                value={heroImageAlt}
                onChange={(e) => onHeroImageAltChange(e.target.value)}
                placeholder="e.g. Coding GIF / Developer Banner"
                className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition-colors"
              />
            </div>

            {/* Live Preview */}
            {safePreviewUrl && (
              <div className="mt-2">
                <FieldLabel>Live Image Preview</FieldLabel>
                <div className="relative rounded-xl border border-gray-200 dark:border-white/8 bg-[#0d1117] p-4 flex items-center justify-center min-h-[140px] overflow-hidden">
                  {!imgLoaded && !imgError && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Loader2 size={24} className="animate-spin text-zinc-600" />
                    </div>
                  )}
                  {imgError && (
                    <div className="flex flex-col items-center gap-1.5 text-center px-4">
                      <ImageIcon size={20} className="text-red-400" />
                      <p className="text-xs text-red-400">
                        Unable to load image from URL. Please double-check the image link.
                      </p>
                    </div>
                  )}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    key={safePreviewUrl}
                    src={encodeURI(safePreviewUrl)}
                    alt={safeAltText}
                    style={{
                      maxWidth: '100%',
                      width: heroImageWidth
                        ? heroImageWidth.endsWith('%') || heroImageWidth.endsWith('px')
                          ? heroImageWidth
                          : `${heroImageWidth}px`
                        : 'auto',
                    }}
                    className={`transition-opacity duration-300 rounded ${
                      imgLoaded ? 'opacity-100' : 'opacity-0 absolute'
                    }`}
                    onLoad={() => {
                      setImgLoaded(true);
                      setImgError(false);
                    }}
                    onError={() => {
                      setImgError(true);
                      setImgLoaded(false);
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
