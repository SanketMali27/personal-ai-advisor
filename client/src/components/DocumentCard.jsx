import { useMemo, useState } from 'react';

function formatUploadDate(value) {
  if (!value) {
    return 'Unknown date';
  }

  return new Date(value).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}


export default function DocumentCard({
  document,
  uploadsBaseUrl,
  isGenerating,
  error,
  onSummarize,
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasSummary = typeof document.summary === 'string' && document.summary.trim().length > 0;
  const canExpand = useMemo(
    () => hasSummary && document.summary.trim().length > 180,
    [document.summary, hasSummary]
  );

  return (
    <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl border border-stone-200 bg-white text-slate-500">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-medium text-ink">
                {document.originalName || document.filename}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {`Uploaded ${formatUploadDate(document.createdAt)}`}
              </p>
            </div>

            <a
              href={`${uploadsBaseUrl}/${encodeURIComponent(document.filename)}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-stone-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-stone-300 hover:text-ink"
            >
              Open
            </a>
          </div>

          <div className="mt-3">
            {hasSummary ? (
              <>
                <p
                  className={`text-sm leading-6 text-slate-600 ${isExpanded
                      ? 'whitespace-pre-wrap'
                      : 'overflow-hidden [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]'
                    }`}
                >
                  {document.summary}
                </p>

                {canExpand ? (
                  <button
                    type="button"
                    onClick={() => setIsExpanded((prev) => !prev)}
                    className="mt-2 text-xs font-medium text-tide transition hover:text-ink"
                  >
                    {isExpanded ? 'Show less' : 'Show more'}
                  </button>
                ) : null}
              </>
            ) : isGenerating ? (
              <div className="inline-flex items-center gap-2 text-sm text-slate-500">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-stone-300 border-t-tide" />
                <span>Generating...</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onSummarize(document)}
                disabled={isGenerating}
                className="rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-ink transition hover:border-tide hover:text-tide disabled:cursor-not-allowed disabled:opacity-60"
              >
                ✨ Summarize
              </button>
            )}

            {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
