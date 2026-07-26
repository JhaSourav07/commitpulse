import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const HTML_COMMENT_OPEN = '<' + '!--';
const HTML_COMMENT_CLOSE = '--' + '>';

const svgSourceFiles = ['lib/svg/constellation.ts', 'lib/svg/doughnut.ts', 'lib/svg/radar.ts'];

describe('generated SVG HTML comment safety', () => {
  it('does not keep raw HTML comment delimiters in generated SVG source templates', () => {
    for (const relativeFilePath of svgSourceFiles) {
      const absoluteFilePath = path.join(process.cwd(), relativeFilePath);
      const source = fs.readFileSync(absoluteFilePath, 'utf8');

      expect(source, `${relativeFilePath} should not emit HTML comments`).not.toContain(
        HTML_COMMENT_OPEN
      );
      expect(source, `${relativeFilePath} should not emit HTML comments`).not.toContain(
        HTML_COMMENT_CLOSE
      );
    }
  });
});
