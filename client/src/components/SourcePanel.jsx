import { useMemo, useState } from 'react';

function getScoreTone(score) {
  if (score >= 0.85) {
    return {
      label: 'High',
      className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    };
  }

  if (score >= 0.65) {
    return {
      label: 'Medium',
      className: 'border-amber-200 bg-amber-50 text-amber-700',
    };
  }

  return {
    label: 'Low',
    className: 'border-stone-200 bg-stone-100 text-stone-600',
  };
}

export default function SourcePanel({ sources }) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedSources, setExpandedSources] = useState({});
  const safeSources = useMemo(() => {
    if (!Array.isArray(sources)) {
      return [];
    }

    const seen = new Set();

    return sources.filter((source) => {
      if (!source?.chunkText) {
        return false;
      }

      const dedupeKey = [
        source.documentName || 'Unknown document',
        source.chunkIndex ?? 0,
        source.pageNumber ?? 'na',
        source.chunkText,
      ].join('::');

      if (seen.has(dedupeKey)) {
        return false;
      }

      seen.add(dedupeKey);
      return true;
    });
  }, [sources]);

  if (safeSources.length === 0) {
    return null;
  }

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-stone-300 hover:bg-white"
      >
        <span>{`📎 ${safeSources.length} ${safeSources.length === 1 ? 'source' : 'sources'} used`}</span>
        <span className="text-[10px] uppercase tracking-[0.2em] text-slate-400">
          {isOpen ? 'Hide' : 'Show'}
        </span>
      </button>

      {isOpen ? (
        <div className="mt-3 space-y-3">
          {safeSources.map((source, index) => {
            const tone = getScoreTone(source.score || 0);
            const isExpanded = Boolean(expandedSources[index]);

            return (
              <article
                key={`${source.documentName}-${source.chunkIndex}-${index}`}
                className="rounded-2xl border border-stone-200 bg-stone-50/80 p-3 text-xs text-slate-600"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="min-w-0 flex-1 truncate font-semibold text-ink">
                    {source.documentName || 'Unknown document'}
                  </p>
                  <span
                    className={`rounded-full border px-2 py-1 font-semibold ${tone.className}`}
                  >
                    {`${tone.label} ${(source.score || 0).toFixed(2)}`}
                  </span>
                </div>

                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] uppercase tracking-[0.16em] text-slate-400">
                  <span>{`Chunk ${source.chunkIndex}`}</span>
                  {source.pageNumber !== null && source.pageNumber !== undefined ? (
                    <span>{`Page ${source.pageNumber}`}</span>
                  ) : null}
                </div>

                <blockquote
                  className={`mt-3 border-l-2 border-stone-200 pl-3 text-sm leading-6 text-slate-600 ${
                    isExpanded
                      ? 'whitespace-pre-wrap'
                      : 'overflow-hidden whitespace-pre-wrap [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:3]'
                  }`}
                >
                  {source.chunkText}
                </blockquote>

                {source.chunkText.length > 220 ? (
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedSources((prev) => ({
                        ...prev,
                        [index]: !prev[index],
                      }))
                    }
                    className="mt-2 text-xs font-medium text-tide transition hover:text-ink"
                  >
                    {isExpanded ? 'Show less' : 'Show more'}
                  </button>
                ) : null}
              </article>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
