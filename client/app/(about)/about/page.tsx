import Image from 'next/image';

const AboutPage = () => {
  return (
    <main
      style={{
        minHeight: 'calc(100dvh - 64px)',
        width: '100%',
        background: 'var(--page-bg)',
        color: 'var(--text-primary)',
      }}
    >
      <section
        style={{
          maxWidth: '1050px',
          margin: '0 auto',
          padding: '2rem 1rem 3.5rem',
          display: 'grid',
          gap: '1.25rem',
        }}
      >
        <header
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1rem',
            background: 'linear-gradient(135deg, var(--surface) 0%, var(--surface-muted) 100%)',
            border: '1px solid var(--border-color)',
            borderRadius: '20px',
            padding: '1.35rem',
            boxShadow: '0 18px 34px var(--shadow-color)',
          }}
        >
          <div style={{ display: 'grid', gap: '0.8rem' }}>
            <div
              style={{
                display: 'inline-flex',
                width: 'fit-content',
                padding: '0.35rem 0.7rem',
                borderRadius: '9999px',
                background: 'var(--accent-soft)',
                color: 'var(--accent-text)',
                fontWeight: 700,
                fontSize: '0.85rem',
              }}
            >
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
              background: 'var(--surface-muted)',
              border: '1px solid var(--border-color)',
              borderRadius: '14px',
              padding: '0.9rem',
              display: 'grid',
              gap: '0.6rem',
              alignSelf: 'stretch',
            }}
          >
            <h2 style={{ margin: 0, fontSize: '1rem' }}>Project Snapshot</h2>
            <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Multi-country fetch pipeline, schema validation, queue-backed scheduling, and Neon/Postgres persistence with
              Prisma.
            </p>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Built with Next.js App Router + API routes.
            </p>
          </div>
        </header>

        <section
          style={{
            display: 'grid',
            gap: '0.95rem',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          }}
        >
          {[
            {
              title: 'Why I built this',
              text: 'I wanted to practice full product engineering across data ingestion, validation, storage, and user-facing UX in one coherent system.',
            },
            {
              title: 'What it solves',
              text: 'It reduces feed overload by giving a concise, global snapshot of important stories across countries and categories.',
            },
            {
              title: 'Reliability goal',
              text: 'Queue-based scheduling via QStash keeps long-running sync tasks resilient with retries and better operational control.',
            },
          ].map((item) => (
            <article
              key={item.title}
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border-color)',
                borderRadius: '14px',
                padding: '1rem 1.05rem',
                boxShadow: '0 10px 22px var(--shadow-color)',
                display: 'grid',
                gap: '0.5rem',
              }}
            >
              <h2 style={{ margin: 0, fontSize: '1.04rem' }}>{item.title}</h2>
              <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.65 }}>{item.text}</p>
            </article>
          ))}
        </section>

        <section
          style={{
            display: 'grid',
            gap: '0.85rem',
            background: 'var(--surface)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            padding: '1.05rem 1.1rem',
          }}
        >
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
            <li>Schedules and fans out sync jobs using QStash for better resilience.</li>
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
                Hi, I am Abhi 👋 <br/> I built WorldNews to make international headlines easier to discover with a faster, cleaner reading flow.
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