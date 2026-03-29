import '../markdown-renderer.css';

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function parseInline(text) {
  let parsed = escapeHtml(text);

  parsed = parsed.replace(/`([^`]+)`/g, '<code>$1</code>');
  parsed = parsed.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  parsed = parsed.replace(/(^|[^\*])\*(?!\s)(.+?)(?<!\s)\*/g, '$1<em>$2</em>');
  parsed = parsed.replace(/(^|[^_])_(?!\s)(.+?)(?<!\s)_/g, '$1<em>$2</em>');

  return parsed;
}

function parseMarkdown(raw = '') {
  const lines = raw.replace(/\r\n/g, '\n').split('\n');
  const blocks = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();

    if (!trimmed) {
      index += 1;
      continue;
    }

    const headingMatch = trimmed.match(/^(#{1,3})\s+(.*)$/);
    if (headingMatch) {
      blocks.push({ type: `h${headingMatch[1].length}`, text: headingMatch[2] });
      index += 1;
      continue;
    }

    const orderedMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (orderedMatch) {
      const items = [];

      while (index < lines.length) {
        const itemMatch = lines[index].trim().match(/^(\d+)\.\s+(.*)$/);
        if (!itemMatch) {
          break;
        }

        const sub = [];
        let nextIndex = index + 1;

        while (nextIndex < lines.length) {
          const subLine = lines[nextIndex];

          if (!subLine.trim()) {
            break;
          }

          if (/^\s{2,}/.test(subLine)) {
            sub.push(subLine.trim().replace(/^[-*]\s+/, ''));
            nextIndex += 1;
            continue;
          }

          break;
        }

        items.push({ text: itemMatch[2], sub });
        index = nextIndex;
      }

      blocks.push({ type: 'ol', items });
      continue;
    }

    const bulletMatch = trimmed.match(/^[-*]\s+(.*)$/);
    if (bulletMatch) {
      const items = [];

      while (index < lines.length) {
        const itemMatch = lines[index].trim().match(/^[-*]\s+(.*)$/);
        if (!itemMatch) {
          break;
        }

        items.push({ text: itemMatch[1] });
        index += 1;
      }

      blocks.push({ type: 'ul', items });
      continue;
    }

    const paragraphLines = [];

    while (index < lines.length) {
      const current = lines[index];
      const currentTrimmed = current.trim();

      if (
        !currentTrimmed ||
        /^(#{1,3})\s+/.test(currentTrimmed) ||
        /^\d+\.\s+/.test(currentTrimmed) ||
        /^[-*]\s+/.test(currentTrimmed)
      ) {
        break;
      }

      paragraphLines.push(currentTrimmed);
      index += 1;
    }

    if (paragraphLines.length) {
      blocks.push({ type: 'p', text: paragraphLines.join(' ') });
    }
  }

  return blocks;
}

export default function MarkdownRenderer({ content = '' }) {
  const blocks = parseMarkdown(content);

  return (
    <div className="md-root">
      {blocks.map((block, idx) => {
        if (block.type === 'h1') {
          return <h1 key={idx} dangerouslySetInnerHTML={{ __html: parseInline(block.text) }} />;
        }

        if (block.type === 'h2') {
          return <h2 key={idx} dangerouslySetInnerHTML={{ __html: parseInline(block.text) }} />;
        }

        if (block.type === 'h3') {
          return <h3 key={idx} dangerouslySetInnerHTML={{ __html: parseInline(block.text) }} />;
        }

        if (block.type === 'p') {
          return <p key={idx} dangerouslySetInnerHTML={{ __html: parseInline(block.text) }} />;
        }

        if (block.type === 'ol') {
          return (
            <ol key={idx}>
              {block.items.map((item, itemIndex) => (
                <li key={`${idx}-${itemIndex}`}>
                  <div className="md-list-item">
                    <span dangerouslySetInnerHTML={{ __html: parseInline(item.text) }} />
                    {item.sub?.length ? (
                      <ul className="sub-list">
                        {item.sub.map((subItem, subIndex) => (
                          <li
                            key={`${idx}-${itemIndex}-${subIndex}`}
                            dangerouslySetInnerHTML={{ __html: parseInline(subItem) }}
                          />
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </li>
              ))}
            </ol>
          );
        }

        if (block.type === 'ul') {
          return (
            <ul key={idx}>
              {block.items.map((item, itemIndex) => (
                <li
                  key={`${idx}-${itemIndex}`}
                  dangerouslySetInnerHTML={{ __html: parseInline(item.text) }}
                />
              ))}
            </ul>
          );
        }

        return null;
      })}
    </div>
  );
}
