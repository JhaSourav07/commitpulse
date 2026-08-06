import { describe, it, expect } from 'vitest';
import { GET } from './route';
import { NextRequest } from 'next/server';

describe('[Bug fix] articles route size param default', () => {
  it('the default size (no ?size= param) matches ?size=medium output exactly', async () => {
    const reqDefault = new NextRequest('http://localhost/api/articles?user=octocat');
    const reqMedium = new NextRequest('http://localhost/api/articles?user=octocat&size=medium');

    const svgDefault = await (await GET(reqDefault)).text();
    const svgMedium = await (await GET(reqMedium)).text();

    expect(svgDefault).toBe(svgMedium);
  });

  it('?size=small produces a visibly smaller-width SVG than the default', async () => {
    const reqDefault = new NextRequest('http://localhost/api/articles?user=octocat');
    const reqSmall = new NextRequest('http://localhost/api/articles?user=octocat&size=small');

    const svgDefault = await (await GET(reqDefault)).text();
    const svgSmall = await (await GET(reqSmall)).text();

    const widthOf = (svg: string) => Number(svg.match(/width="(\d+)"/)?.[1] ?? 0);
    expect(widthOf(svgSmall)).toBeLessThan(widthOf(svgDefault));
  });
});
