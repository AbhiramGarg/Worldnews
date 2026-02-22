import Link from 'next/link';

interface NavLink {
  href: string;
  label: string;
}

interface PageNavbarProps {
  links: NavLink[];
}

const PageNavbar = ({ links }: PageNavbarProps) => {
  return (
    <nav style={styles.nav}>
      <div style={styles.linksWrap}>
        {links.map((link) => (
          <Link key={link.href} href={link.href} style={styles.link}>
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  );
};

const styles = {
  nav: {
    height: '52px',
    display: 'flex',
    alignItems: 'center',
    borderBottom: '1px solid var(--border-color)',
    background: 'var(--surface)',
    padding: '0 20px',
    position: 'sticky',
    top: '64px',
    zIndex: 110,
  } as React.CSSProperties,
  linksWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  } as React.CSSProperties,
  link: {
    textDecoration: 'none',
    color: 'var(--text-secondary)',
    fontWeight: 700,
    fontSize: '0.92rem',
    border: '1px solid var(--border-color)',
    padding: '7px 12px',
    borderRadius: '999px',
    background: 'var(--surface-muted)',
  } as React.CSSProperties,
};

export default PageNavbar;
