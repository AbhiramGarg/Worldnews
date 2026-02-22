'use client';
import React from 'react';
 // Ensure this path is correct based on your project structure
interface Article {
  apiId: string;
  title: string;
  summary?: string | null;
  text: string;
  image?: string | null;
  url?: string | null;
  publishDate: Date | string;
}

interface ArticleCardProps {
  article: Article;
  isExpanded: boolean;
  onToggle: (articleId: string) => void;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ article, isExpanded, onToggle }) => {
  // Format date
  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Placeholder image if none available
  const imageUrl =
    article.image && article.image.trim() !== ''
      ? article.image
      : '/news_placeholder.png'; // Local placeholder image

  // Truncate text for preview
  const truncateText = (text: string, limit: number) => {
    if (text.length > limit) {
      return text.substring(0, limit) + '...';
    }
    return text;
  };

  return (
    <div
      style={{
        ...styles.cardContainer,
        ...(isExpanded ? styles.cardExpanded : styles.cardHover),
      }}
    >
      {/* Collapsed State */}
      {!isExpanded && (
        <div
          style={styles.cardCollapsed}
          onClick={() => onToggle(article.apiId)}
        >
          {/* Image */}
          <div style={styles.imageContainer}>
            <img
              src={imageUrl}
              alt={article.title}
              style={styles.image}
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  '/news_placeholder.png';
              }}
            />
            <div style={styles.imageOverlay} />
          </div>

          {/* Content */}
          <div style={styles.collapsedContentWrapper}>
            <h3 style={styles.title}>{article.title}</h3>
            <div style={styles.metaRow}>
              <span style={styles.date}>📅 {formatDate(article.publishDate)}</span>
              <span style={styles.expandBadge}>Tap to read →</span>
            </div>
          </div>
        </div>
      )}

      {/* Expanded State */}
      {isExpanded && (
        <div style={styles.expandedCard}>
          {/* Close Button */}
          <button
            onClick={() => onToggle(article.apiId)}
            style={styles.closeButton}
            aria-label="Close article"
          >
            ✕
          </button>

          {/* Image - Full width at top */}
          <img
            src={imageUrl}
            alt={article.title}
            style={styles.expandedImage}
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                '/news_placeholder.png';
            }}
          />

          {/* Expanded Content */}
          <div style={styles.expandedContent}>
            <h2 style={styles.expandedTitle}>{article.title}</h2>

            <div style={styles.expandedMeta}>
              <span style={styles.expandedDate}>📅 {formatDate(article.publishDate)}</span>
            </div>

            {article.summary && (
              <div style={styles.summaryBox}>
                <h4 style={styles.summaryTitle}>Summary</h4>
                <p style={styles.summaryText}>{article.summary}</p>
              </div>
            )}

            <div style={styles.textBox}>
              <h4 style={styles.textTitle}>Full Story</h4>
              <p style={styles.bodyText}>{truncateText(article.text, 1000)}</p>
            </div>

            {article.url && (
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                style={styles.readButton}
              >
                📖 Read Full Article on Source
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ArticleCard;

// Comprehensive Styles
const styles = {
  cardContainer: {
    borderRadius: '12px',
    overflow: 'hidden',
    backgroundColor: 'var(--surface)',
    border: '1px solid var(--border-color)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    position: 'relative',
  } as React.CSSProperties,

  cardHover: {
    boxShadow: '0 6px 18px var(--shadow-color)',
    cursor: 'pointer',
  } as React.CSSProperties,

  cardExpanded: {
    boxShadow: '0 12px 36px var(--shadow-color)',
  } as React.CSSProperties,

  cardCollapsed: {
    cursor: 'pointer',
    transition: 'transform 0.2s ease',
    display: 'flex',
    gap: '16px',
  } as React.CSSProperties,

  imageContainer: {
    position: 'relative',
    width: '180px',
    minWidth: '180px',
    height: '180px',
    overflow: 'hidden',
    backgroundColor: 'var(--surface-muted)',
  } as React.CSSProperties,

  image: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'transform 0.3s ease',
  } as React.CSSProperties,

  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(15, 23, 42, 0.18)',
    transition: 'background-color 0.3s ease',
  } as React.CSSProperties,

  collapsedContentWrapper: {
    padding: '16px 18px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    flex: 1,
  } as React.CSSProperties,

  title: {
    fontSize: '1.15em',
    fontWeight: '700',
    color: 'var(--text-primary)',
    margin: 0,
    lineHeight: '1.4',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  } as React.CSSProperties,

  metaRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  } as React.CSSProperties,

  date: {
    fontSize: '0.85em',
    color: 'var(--text-muted)',
    fontWeight: '500',
  } as React.CSSProperties,

  expandBadge: {
    fontSize: '0.8em',
    color: 'var(--accent-text)',
    fontWeight: '600',
    padding: '4px 10px',
    backgroundColor: 'var(--accent-soft)',
    borderRadius: '12px',
  } as React.CSSProperties,

  expandedCard: {
    display: 'flex',
    flexDirection: 'column',
    maxHeight: '88vh',
    overflowY: 'auto',
  } as React.CSSProperties,

  closeButton: {
    position: 'sticky',
    top: '12px',
    right: '12px',
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    border: 'none',
    backgroundColor: '#007bff',
    color: '#fff',
    fontSize: '1.4em',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 16px rgba(0, 123, 255, 0.35)',
    transition: 'all 0.2s ease',
    fontWeight: 'bold',
    zIndex: 100,
    alignSelf: 'flex-end',
    margin: '12px 16px 0 0',
  } as React.CSSProperties,

  expandedImage: {
    width: '100%',
    height: 'auto',
    maxWidth: '350px',
    maxHeight: '300px',
    objectFit: 'cover',
    backgroundColor: 'var(--surface-muted)',
    margin: '20px auto',
    borderRadius: '8px',
    display: 'block',
  } as React.CSSProperties,

  expandedContent: {
    padding: '28px',
    flex: 1,
  } as React.CSSProperties,

  expandedTitle: {
    fontSize: '1.8em',
    fontWeight: '800',
    color: 'var(--text-primary)',
    margin: '0 0 12px 0',
    lineHeight: '1.3',
  } as React.CSSProperties,

  expandedMeta: {
    display: 'flex',
    gap: '16px',
    marginBottom: '24px',
    paddingBottom: '12px',
    borderBottom: '1px solid var(--border-color)',
  } as React.CSSProperties,

  expandedDate: {
    fontSize: '0.95em',
    color: 'var(--text-muted)',
    fontWeight: '500',
  } as React.CSSProperties,

  summaryBox: {
    marginBottom: '24px',
    padding: '18px',
    backgroundColor: 'var(--surface-muted)',
    borderRadius: '8px',
    borderLeft: '5px solid var(--accent)',
  } as React.CSSProperties,

  summaryTitle: {
    fontSize: '1em',
    fontWeight: '700',
    color: 'var(--text-primary)',
    margin: '0 0 10px 0',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  } as React.CSSProperties,

  summaryText: {
    fontSize: '0.98em',
    color: 'var(--text-secondary)',
    lineHeight: '1.7',
    margin: 0,
  } as React.CSSProperties,

  textBox: {
    marginBottom: '24px',
  } as React.CSSProperties,

  textTitle: {
    fontSize: '1em',
    fontWeight: '700',
    color: 'var(--text-primary)',
    margin: '0 0 12px 0',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  } as React.CSSProperties,

  bodyText: {
    fontSize: '0.98em',
    color: 'var(--text-secondary)',
    lineHeight: '1.8',
    margin: 0,
  } as React.CSSProperties,

  readButton: {
    display: 'inline-block',
    marginTop: '12px',
    padding: '14px 24px',
    backgroundColor: '#28a745',
    color: '#fff',
    textDecoration: 'none',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '0.98em',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 12px rgba(40, 167, 69, 0.3)',
    border: 'none',
    cursor: 'pointer',
  } as React.CSSProperties,
};
