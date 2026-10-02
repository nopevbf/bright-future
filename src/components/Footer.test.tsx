import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Footer } from './Footer';

describe('Footer Component', () => {
  it('TC-FT-001: renders the "Daftar Tutor" button in quick navigation when onOpenTutorRegister is provided', () => {
    const handleOpenTutorRegister = vi.fn();
    render(<Footer onOpenTutorRegister={handleOpenTutorRegister} />);

    const tutorButton = screen.getByRole('button', { name: /daftar jadi mitra tutor/i });
    expect(tutorButton).toBeInTheDocument();
  });

  it('TC-FT-002: does not crash when onOpenTutorRegister is not provided', () => {
    const { container } = render(<Footer />);
    expect(container).toBeInTheDocument();
    const tutorButton = screen.queryByRole('button', { name: /daftar jadi mitra tutor/i });
    expect(tutorButton).not.toBeInTheDocument();
  });

  it('TC-FT-003: invokes onOpenTutorRegister when clicking the "Daftar Tutor" button', () => {
    const handleOpenTutorRegister = vi.fn();
    render(<Footer onOpenTutorRegister={handleOpenTutorRegister} />);

    const tutorButton = screen.getByRole('button', { name: /daftar jadi mitra tutor/i });
    fireEvent.click(tutorButton);

    expect(handleOpenTutorRegister).toHaveBeenCalledTimes(1);
  });
});
