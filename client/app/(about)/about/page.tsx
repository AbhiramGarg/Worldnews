import Image from 'next/image';

const AboutPage = () => {
  const highlights = [
    {
      title: 'Why I built this',
      text: 'I wanted to practice full product engineering across ingestion, validation, storage, and UX in one coherent system.',
      icon: (
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <path d="M12 3l2.6 5.2L20 9l-4 3.8.9 5.2L12 15.8 7.1 18l.9-5.2L4 9l5.4-.8L12 3z" fill="currentColor" />
        </svg>
      ),
    },
    {
      title: 'What it solves',
      text: 'It reduces feed overload with a concise global snapshot of important stories across countries and categories.',
      icon: (
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <path d="M4 6h16v2H4V6zm0 5h16v2H4v-2zm0 5h10v2H4v-2z" fill="currentColor" />
        </svg>
      ),
    },
    {
      title: 'Reliability goal',
      text: 'An internal scheduler keeps sync jobs resilient with retries, fallback behavior, and better operational control.',
      icon: (
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 5v5.4l3.6 2.1-1 1.7L11 13V7h2z" fill="currentColor" />
        </svg>
      ),
    },
  ];

  return (
    <main
      style={{
        minHeight: 'calc(100dvh - 64px)',
        width: '100%',
        background: 'var(--page-bg)',
        color: 'var(--text-primary)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        className="aboutFxFloat"
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '-90px',
          right: '-70px',
          width: '260px',
          height: '260px',
          borderRadius: '9999px',
          background: 'radial-gradient(circle at 30% 30%, color-mix(in srgb, var(--accent) 38%, transparent), transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <svg
        className="aboutFxPulse"
        viewBox="0 0 600 220"
        preserveAspectRatio="none"
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: '0 0 auto 0',
          width: '100%',
          height: '220px',
          opacity: 0.35,
          pointerEvents: 'none',
        }}
      >
        <path d="M0,150 C120,120 180,180 300,148 C420,116 510,175 600,140 L600,0 L0,0 Z" fill="var(--surface-muted)" />
        <path d="M0,175 C110,148 210,205 320,165 C440,122 530,182 600,152" fill="none" stroke="var(--accent)" strokeWidth="2" />
      </svg>

      <section
        style={{
          maxWidth: '1050px',
          margin: '0 auto',
          padding: '2rem 1rem 3.5rem',
          display: 'grid',
          gap: '1.1rem',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <header
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
            gap: '1rem',
            background: 'linear-gradient(135deg, var(--surface) 0%, var(--surface-muted) 100%)',
            border: '1px solid var(--border-color)',
            borderRadius: '20px',
            padding: '1.3rem',
            boxShadow: '0 18px 34px var(--shadow-color)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            aria-hidden="true"
            className="aboutFxSpin"
            style={{
              position: 'absolute',
              right: '-70px',
              bottom: '-70px',
              width: '180px',
              height: '180px',
              borderRadius: '9999px',
              border: '1px dashed var(--accent)',
              opacity: 0.35,
              pointerEvents: 'none',
            }}
          />

          <div style={{ display: 'grid', gap: '0.8rem' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                width: 'fit-content',
                padding: '0.35rem 0.7rem',
                borderRadius: '9999px',
                background: 'var(--accent-soft)',
                color: 'var(--accent-text)',
                fontWeight: 700,
                fontSize: '0.85rem',
              }}
            >
              <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
                <path d="M12 2l2.2 4.5L19 7.2l-3.5 3.3.8 4.5L12 13l-4.3 2.2.8-4.5L5 7.2l4.8-.7L12 2z" fill="currentColor" />
              </svg>
              Global News, Built End-to-End
            </div>

            <h1 style={{ fontSize: 'clamp(1.75rem, 3vw, 2.4rem)', margin: 0 }}>About WorldNews</h1>
            <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.72 }}>
              WorldNews is a full-stack news aggregation project that turns large amounts of global coverage into a cleaner,
              easier reading experience. The platform is designed for speed, reliability, and broad country-level visibility.
            </p>
          </div>

          <div
            style={{
              background: 'linear-gradient(180deg, var(--surface-muted) 0%, var(--surface) 100%)',
              border: '1px solid var(--border-color)',
              borderRadius: '14px',
              padding: '0.9rem',
              display: 'grid',
              gap: '0.6rem',
              alignSelf: 'stretch',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 360 180"
              style={{
                position: 'absolute',
                right: '-20px',
                top: '-12px',
                width: '180px',
                height: '90px',
                opacity: 0.35,
              }}
            >
              <circle cx="52" cy="42" r="26" fill="none" stroke="var(--accent)" strokeWidth="2" />
              <circle cx="120" cy="54" r="34" fill="none" stroke="var(--accent-soft)" strokeWidth="2" />
              <path d="M16 78h150" stroke="var(--border-color)" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <h2 style={{ margin: 0, fontSize: '1rem' }}>Project Snapshot</h2>
            <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Multi-country fetch pipeline, schema validation, queue-backed scheduling, and Neon/Postgres persistence with
              Prisma.
            </p>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Built with Next.js App Router + API routes.
            </p>

            <div
              style={{
                marginTop: '0.2rem',
                display: 'grid',
                gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                gap: '0.45rem',
              }}
            >
              {[
                { label: 'Countries', value: '50+' },
                { label: 'Windows', value: '2' },
                { label: 'Pipelines', value: '1' },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '10px',
                    padding: '0.45rem 0.5rem',
                    display: 'grid',
                    gap: '0.1rem',
                  }}
                >
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{item.label}</span>
                  <span style={{ fontWeight: 700 }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </header>

        <section
          style={{
            display: 'grid',
            gap: '0.95rem',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          }}
        >
          {highlights.map((item) => (
            <article
              key={item.title}
              className="aboutFxLift"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border-color)',
                borderRadius: '14px',
                padding: '1rem 1.05rem',
                boxShadow: '0 10px 22px var(--shadow-color)',
                display: 'grid',
                gap: '0.5rem',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  top: '-28px',
                  right: '-20px',
                  width: '90px',
                  height: '90px',
                  borderRadius: '9999px',
                  background: 'radial-gradient(circle, color-mix(in srgb, var(--accent) 28%, transparent), transparent 72%)',
                }}
              />
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '10px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'var(--accent-soft)',
                  color: 'var(--accent-text)',
                  border: '1px solid var(--border-color)',
                }}
              >
                {item.icon}
              </div>
              <h2 style={{ margin: 0, fontSize: '1.04rem' }}>{item.title}</h2>
              <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.65 }}>{item.text}</p>
            </article>
          ))}
        </section>

        <section
          style={{
            display: 'grid',
            gap: '0.85rem',
            background: 'linear-gradient(180deg, var(--surface) 0%, var(--surface-muted) 100%)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            padding: '1.05rem 1.1rem',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 900 160"
            preserveAspectRatio="none"
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: '-2px',
              width: '100%',
              height: '85px',
              opacity: 0.25,
            }}
          >
            <path d="M0,115 C160,72 220,142 370,102 C520,64 650,132 900,86" fill="none" stroke="var(--accent)" strokeWidth="3" />
          </svg>
          <h2 style={{ margin: 0, fontSize: '1.1rem' }}>How WorldNews Works</h2>
          <ul
            style={{
              margin: 0,
              paddingLeft: '1.1rem',
              color: 'var(--text-secondary)',
              display: 'grid',
              gap: '0.45rem',
              lineHeight: 1.65,
            }}
          >
            <li>Fetches curated stories from the World News API by country and category.</li>
            <li>Validates every article against strict schemas before persistence.</li>
            <li>Stores processed records in Neon Postgres with Prisma.</li>
            <li>Schedules and runs sync jobs through an internal scheduler for better resilience.</li>
            <li>Delivers an interactive country-first reading interface in Next.js.</li>
          </ul>
        </section>

        <section
          style={{
            display: 'grid',
            gap: '1rem',
            background: 'linear-gradient(180deg, var(--surface) 0%, var(--surface-muted) 100%)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            padding: '1.1rem 1.1rem',
          }}
        >
          <h2 style={{ margin: 0, fontSize: '1.1rem' }}>About the developer</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <Image
              src="/pic.jpg"
              alt="Developer profile photo"
              width={180}
              height={180}
              quality={100}
              sizes="(max-width: 768px) 140px, 180px"
              style={{
                borderRadius: '9999px',
                objectFit: 'cover',
                objectPosition: 'center',
                border: '3px solid var(--accent-soft)',
                boxShadow: '0 12px 24px var(--shadow-color)',
              }}
              priority
            />
            <div style={{ display: 'grid', gap: '0.55rem', flex: 1, minWidth: '240px' }}>
              <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.68 }}>
                Hi, I am Abhi 👋 <br /> I built WorldNews to make international headlines easier to discover with a faster, cleaner reading flow.
              </p>
              <p style={{ margin: 0, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                This project reflects my interest in backend reliability, scalable scheduling, and thoughtful user interface design.
              </p>
            </div>
          </div>

          <div>
            <a
              href="https://unrivaled-pixie-161c66.netlify.app/"
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.74rem 1.05rem',
                borderRadius: '12px',
                textDecoration: 'none',
                background: 'var(--accent)',
                color: 'var(--foreground)',
                fontWeight: 700,
                border: '1px solid var(--accent-strong)',
                boxShadow: '0 12px 22px var(--shadow-color)',
              }}
            >
              Visit My Portfolio
            </a>
          </div>
        </section>
      </section>
    </main>
  );
};

export default AboutPage;