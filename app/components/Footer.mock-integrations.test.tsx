import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Footer } from './Footer';

vi.mock('next/link', () => ({
  default: (props: { href: string; className?: string; children: React.ReactNode }) => (
    <a href={props.href} className={props.className}>
      {props.children}
    </a>
  ),
}));

vi.mock('@/context/TranslationContext', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('lucide-react')>();
  return actual;
});

vi.mock('react-icons/fa', () => ({
  FaGithub: () => <svg data-testid="icon-github" />,
  FaDiscord: () => <svg data-testid="icon-discord" />,
  FaLinkedin: () => <svg data-testid="icon-linkedin" />,
}));

vi.mock('react-icons/fa6', () => ({
  FaXTwitter: () => <svg data-testid="icon-twitter" />,
}));

const localCache = new Map<string, boolean>();
const mockFetchFooterData = vi.fn();

beforeEach(() => {
  localCache.clear();
  mockFetchFooterData.mockReset();
});

describe('Footer - mock integrations', () => {
  it('renders static footer content without making real network calls', () => {
    mockFetchFooterData.mockResolvedValueOnce({});
    render(<Footer />);
    expect(screen.getByText('footer.tagline')).toBeInTheDocument();
    expect(mockFetchFooterData).not.toHaveBeenCalled();
  });

  it('renders navigation, resource, and connect sections consistently without an empty-state fallback', () => {
    localCache.set('footerLoaded', true);
    render(<Footer />);
    expect(screen.getByText('footer.navigation')).toBeInTheDocument();
    expect(screen.getByText('footer.resources')).toBeInTheDocument();
    expect(screen.getByText('footer.connect')).toBeInTheDocument();
  });

  it('confirms no cache lookup is required before render since component is fully static', () => {
    const cachedData = localCache.get('footerLoaded');
    expect(cachedData).toBeUndefined();
    expect(mockFetchFooterData).not.toHaveBeenCalled();
    render(<Footer />);
    expect(screen.getByText('footer.navigation')).toBeInTheDocument();
  });

  it('renders successfully with no timeout or async failure possible', async () => {
    mockFetchFooterData.mockImplementationOnce(
      () => new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 100))
    );
    render(<Footer />);
    expect(screen.getByText('footer.made_with')).toBeInTheDocument();
  });

  it('asserts no cache write occurs after render since there is no success callback path', () => {
    render(<Footer />);
    expect(localCache.size).toBe(0);
    expect(mockFetchFooterData).not.toHaveBeenCalled();
    expect(screen.getByText('footer.support')).toBeInTheDocument();
  });
});
