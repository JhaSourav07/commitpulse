import { describe, it, expect } from 'vitest';
import { optimizeSVG, optimizePathData, minifyCSS, stripComments } from './optimizer';

describe('optimizePathData', () => {
  it('should remove commas and multiple spaces', () => {
    const input = 'M 10, 20 L 30   40';
    const expected = 'M10 20L30 40';
    expect(optimizePathData(input)).toBe(expected);
  });

  it('should shorten floats to at most 2 decimal places', () => {
    const input = 'M 0.1234,20.5678 L 30.0000 40.500';
    const expected = 'M.12 20.57L30 40.5';
    expect(optimizePathData(input)).toBe(expected);
  });

  it('should remove spaces before negative numbers', () => {
    const input = 'M 10 -20 L 30.5 -40.5 L 50 -.5';
    const expected = 'M10-20L30.5-40.5L50-.5';
    expect(optimizePathData(input)).toBe(expected);
  });

  it('should handle complex paths', () => {
    const input = 'M 10,10 C 20,20 30,30 40,40 S 50,50 60,60 Z';
    const expected = 'M10 10C20 20 30 30 40 40S50 50 60 60Z';
    expect(optimizePathData(input)).toBe(expected);
  });
});

describe('stripComments', () => {
  it('should remove XML/HTML comments from a string', () => {
    const input = 'foo <!-- comment --> bar <!-- comment2 -->baz';
    const expected = 'foo  bar baz';
    expect(stripComments(input)).toBe(expected);
  });

  it('should leave strings without comments untouched', () => {
    const input = '<svg width="100"><rect/></svg>';
    expect(stripComments(input)).toBe(input);
  });
});

describe('minifyCSS', () => {
  it('should remove comments and extra spacing', () => {
    const input = `
      /* This is a comment */
      .scan-line {
        animation: scan-sweep var(--scan-speed, 8s) linear infinite;
        transform-box: fill-box;
      }
    `;
    const expected =
      '.scan-line{animation: scan-sweep var(--scan-speed, 8s) linear infinite;transform-box: fill-box;}';
    expect(minifyCSS(input)).toBe(expected);
  });

  it('should preserve spaces in operator calculations', () => {
    const input = '.subtitle { opacity: calc(var(--cp-label-opacity) - 0.1); }';
    const expected = '.subtitle{opacity: calc(var(--cp-label-opacity) - 0.1);}';
    expect(minifyCSS(input)).toBe(expected);
  });
});

describe('optimizeSVG', () => {
  it('should remove XML comments', () => {
    const input = '<svg><!-- Comment --><rect/></svg>';
    const expected = '<svg><rect/></svg>';
    expect(optimizeSVG(input)).toBe(expected);
  });

  it('should preserve text contents exactly with all whitespace', () => {
    const input = '<svg><text x="10" y="20">Hello   World</text></svg>';
    const expected = '<svg><text x="10" y="20">Hello   World</text></svg>';
    expect(optimizeSVG(input)).toBe(expected);
  });

  it('should preserve nested tags inside text blocks', () => {
    const input =
      '<svg><text x="10" y="20">Hello <tspan font-weight="bold">World</tspan></text></svg>';
    const expected =
      '<svg><text x="10" y="20">Hello <tspan font-weight="bold">World</tspan></text></svg>';
    expect(optimizeSVG(input)).toBe(expected);
  });

  it('should round floats outside of paths and styles', () => {
    const input = '<svg width="100.1234" height="200.5678"><rect x="10.999"/></svg>';
    const expected = '<svg width="100.12" height="200.57"><rect x="11"/></svg>';
    expect(optimizeSVG(input)).toBe(expected);
  });

  it('should minify paths in svg', () => {
    const input = '<svg><path d="M 10, 20 L 30 40" /></svg>';
    const expected = '<svg><path d="M10 20L30 40"/></svg>';
    expect(optimizeSVG(input)).toBe(expected);
  });

  it('should minify style blocks and replace placeholders correctly', () => {
    const input = `
      <svg>
        <style>
          .rect {
            fill: red;
          }
        </style>
        <rect class="rect" />
        <text>Keep spaces here</text>
      </svg>
    `;
    const expected =
      '<svg><style>.rect{fill: red;}</style><rect class="rect"/><text>Keep spaces here</text></svg>';
    expect(optimizeSVG(input)).toBe(expected);
  });

  it('should achieve significant size reduction on a larger sample SVG', () => {
    const input = `
      <svg width="400" height="150" viewBox="0 0 400 150">
        <!-- Background Gradient and Elements -->
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:rgb(255,255,0);stop-opacity:1" />
            <stop offset="100%" style="stop-color:rgb(255,0,0);stop-opacity:1" />
          </linearGradient>
        </defs>
        <style>
          .glow-text {
            font-family: sans-serif;
            fill: #ffffff;
            font-size: 24.3456px;
            animation: pulse-glow 2.5s infinite;
          }
          @keyframes pulse-glow {
            0% { opacity: 0.345; }
            50% { opacity: 0.987; }
            100% { opacity: 0.345; }
          }
        </style>
        <rect width="400.1234" height="150.5678" rx="8.000" fill="url(#grad)" />
        <path d="M 10.1234, 20.5678 L 30.9876, 40.1234 C 50.3456, 60.7890, 70.0102, 80.9999" />
        <text class="glow-text" x="200" y="75" text-anchor="middle">CommitPulse Badge</text>
      </svg>
    `;
    const minified = optimizeSVG(input);
    expect(minified).toContain(
      '<style>.glow-text{font-family: sans-serif;fill: #ffffff;font-size: 24.3456px;animation: pulse-glow 2.5s infinite;}@keyframes pulse-glow{0%{opacity: 0.345;}50%{opacity: 0.987;}100%{opacity: 0.345;}}</style>'
    );
    expect(minified).toContain('d="M10.12 20.57L30.99 40.12C50.35 60.79 70.01 81"');
    expect(minified).toContain('width="400.12" height="150.57" rx="8"');
    expect(minified).not.toContain('<!-- Background Gradient and Elements -->');

    const originalSize = Buffer.byteLength(input, 'utf8');
    const minifiedSize = Buffer.byteLength(minified, 'utf8');
    const reductionPercent = ((originalSize - minifiedSize) / originalSize) * 100;

    console.log(
      `Original: ${originalSize} bytes, Minified: ${minifiedSize} bytes, Reduction: ${reductionPercent.toFixed(2)}%`
    );
    expect(reductionPercent).toBeGreaterThan(15);
  });
});
