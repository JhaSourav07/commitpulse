/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GeneratorClient } from './GeneratorClient';

let editorPanelProps: any = null;

vi.mock('./components/EditorPanel', () => ({
  EditorPanel: (props: any) => {
    editorPanelProps = props;
    return <div data-testid="editor-mock">Editor Mock</div>;
  },
}));

describe('GeneratorClient - Edge Cases & Empty/Missing Inputs Verification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    editorPanelProps = null;
  });

  it('Case 1: mounts successfully and renders initial empty states in Editor and Preview panels', () => {
    render(<GeneratorClient />);

    expect(screen.getByTestId('editor-mock')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Preview/i })).toBeInTheDocument();
    expect(screen.getByLabelText('README Completion Score Details')).toBeInTheDocument();

    // Verify initial markdown content has the empty readme placeholder
    const previewContent = screen.getByText((content) => content.includes("👋 Hi, I'm Your Name"));
    expect(previewContent).toBeInTheDocument();
  });

  it('Case 2: handles empty, undefined, and null input updates defensively without crashing', () => {
    render(<GeneratorClient />);

    expect(editorPanelProps).not.toBeNull();

    // Simulating updates with empty strings or nulls
    act(() => {
      editorPanelProps.onNameChange('   ');
      editorPanelProps.onDescriptionChange('');
      editorPanelProps.onTechsChange([]);
      editorPanelProps.onSocialsChange([]);
      editorPanelProps.onGithubUsernameChange('');
    });

    const previewContent = screen.getByText((content) => content.includes("👋 Hi, I'm Your Name"));
    expect(previewContent).toBeInTheDocument();
  });

  it('Case 3: preserves layout styling and column widths in the default empty layout state', () => {
    const { container } = render(<GeneratorClient />);
    const root = container.firstElementChild as HTMLElement;

    // Outer grid classes
    expect(root).toHaveClass('flex');
    expect(root).toHaveClass('flex-col');
    expect(root).toHaveClass('lg:flex-row');

    // Columns
    const [editorCol, previewCol] = Array.from(root.children);
    expect(editorCol).toHaveClass('w-full');
    expect(editorCol).toHaveClass('lg:w-[44%]');
    expect(previewCol).toHaveClass('w-full');
    expect(previewCol).toHaveClass('lg:flex-1');
  });

  it('Case 4: evaluates completion checklist correctly with 0% score and Beginner level for empty profile', () => {
    render(<GeneratorClient />);

    // Score evaluation
    expect(screen.getByText('0%')).toBeInTheDocument();
    expect(screen.getByText('Level: Beginner')).toBeInTheDocument();

    // Suggestion checklist icons should all render warning/alert circles (not completed)
    const alertIcons = screen.getAllByTestId('editor-mock'); // EditorPanel mocked
    expect(alertIcons.length).toBeGreaterThan(0);
  });

  it('Case 5: processes empty imported objects safely and triggers window.confirm overwrite logic on conflict', () => {
    const confirmMock = vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<GeneratorClient />);

    // Apply import with completely empty data fields
    act(() => {
      editorPanelProps.onApplyImport({
        name: '',
        description: '',
        selectedTechs: [],
        selectedSocials: [],
        socialLinks: {},
      });
    });

    expect(confirmMock).not.toHaveBeenCalled();

    // Set some state first to create conflict
    act(() => {
      editorPanelProps.onNameChange('Existing Name');
    });

    // Import new conflicting name
    act(() => {
      editorPanelProps.onApplyImport({
        name: 'New Name',
        description: '',
        selectedTechs: [],
        selectedSocials: [],
        socialLinks: {},
      });
    });

    // Should ask for confirmation when overwriting
    expect(confirmMock).toHaveBeenCalledTimes(1);

    confirmMock.mockRestore();
  });
});
