"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo, useState } from 'react';
import ThemeToggle from './ThemeToggle';

const GlobalNavbar = () => {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const links = useMemo(() => {
    const isHome = pathname === '/';
    const isAbout = pathname.startsWith('/about');
    const isFilter = pathname.startsWith('/filter');

    if (isHome) {
      return [
        { href: '/about', label: 'About' },
        { href: '/filter', label: 'Filters' },
      ];
    }

    if (isAbout) {
      return [
        { href: '/', label: 'Home' },
        { href: '/filter', label: 'Filters' },
      ];
    }

    if (isFilter) {
      return [
        { href: '/', label: 'Home' },
        { href: '/about', label: 'About' },
      ];
    }

    return [
      { href: '/', label: 'Home' },
      { href: '/about', label: 'About' },
      { href: '/filter', label: 'Filters' },
    ];
  }, [pathname]);

  return (
    <header style={styles.header}>
      <div style={styles.inner}>
        <Link href="/" style={styles.brand} onClick={() => setMenuOpen(false)}>
          <span aria-hidden="true" style={styles.logoIcon} />
          <span style={styles.title}>World News</span>
        </Link>

        <div style={styles.rightDesktop} data-nav-desktop>
          <div style={styles.linksWrap}>
            {links.map((link) => (
              <Link key={link.href} href={link.href} style={styles.link}>
                {link.label}
              </Link>
            ))}
          </div>
          <ThemeToggle inline />
        </div>

        <div style={styles.mobileActions} data-nav-mobile>
          <ThemeToggle inline />
          <button
            type="button"
            aria-label="Toggle navigation menu"
            onClick={() => setMenuOpen((prev) => !prev)}
            style={styles.hamburger}
          >
            ☰
          </button>
        </div>
      </div>

      {menuOpen && (
        <div style={styles.mobileMenu} data-nav-mobile>
          {links.map((link) => (
            <Link key={link.href} href={link.href} style={styles.mobileLink} onClick={() => setMenuOpen(false)}>
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
};

const styles = {
  header: {
    minHeight: '64px',
    borderBottom: '1px solid var(--border-color)',
    background: 'var(--surface-2)',
    boxShadow: '0 4px 12px var(--shadow-color)',
    position: 'sticky',
    top: 0,
    zIndex: 120,
  } as React.CSSProperties,
  inner: {
    height: '64px',
    padding: '0 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '14px',
  } as React.CSSProperties,
  brand: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '10px',
    color: 'var(--text-primary)',
    textDecoration: 'none',
    fontWeight: 800,
    letterSpacing: '0.01em',
    fontSize: '1.06rem',
  } as React.CSSProperties,
  title: {
    color: 'var(--text-primary)',
  } as React.CSSProperties,
  logoIcon: {
    width: '34px',
    height: '34px',
    display: 'inline-block',
    backgroundColor: 'currentColor',
    WebkitMaskImage: 'url(/world.svg)',
    WebkitMaskRepeat: 'no-repeat',
    WebkitMaskPosition: 'center',
    WebkitMaskSize: 'contain',
    maskImage: 'url(/world.svg)',
    maskRepeat: 'no-repeat',
    maskPosition: 'center',
    maskSize: 'contain',
  } as React.CSSProperties,
  rightDesktop: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  } as React.CSSProperties,
  linksWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  } as React.CSSProperties,
  link: {
    textDecoration: 'none',
    color: 'var(--text-secondary)',
    fontWeight: 700,
    fontSize: '0.9rem',
    border: '1px solid var(--border-color)',
    padding: '7px 12px',
    borderRadius: '999px',
    background: 'var(--surface-muted)',
  } as React.CSSProperties,
  mobileActions: {
    display: 'none',
    alignItems: 'center',
    gap: '8px',
  } as React.CSSProperties,
  hamburger: {
    border: '1px solid var(--border-color)',
    background: 'var(--surface-muted)',
    color: 'var(--text-primary)',
    borderRadius: '10px',
    width: '42px',
    height: '38px',
    fontSize: '1.1rem',
    cursor: 'pointer',
  } as React.CSSProperties,
  mobileMenu: {
    borderTop: '1px solid var(--border-color)',
    background: 'var(--surface)',
    display: 'flex',
    flexDirection: 'column',
    padding: '10px 16px 14px',
    gap: '8px',
  } as React.CSSProperties,
  mobileLink: {
    textDecoration: 'none',
    color: 'var(--text-secondary)',
    fontWeight: 700,
    fontSize: '0.92rem',
    border: '1px solid var(--border-color)',
    borderRadius: '10px',
    padding: '10px 12px',
    background: 'var(--surface-muted)',
  } as React.CSSProperties,
};

export default GlobalNavbar;
