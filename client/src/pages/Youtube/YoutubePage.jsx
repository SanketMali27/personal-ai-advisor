import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import MarkdownRenderer from '../../components/MarkdownRenderer';
import SourcePanel from '../../components/SourcePanel';
import { youtubeAPI } from '../../api/services';
import { useYoutubeStore } from '../../store/youtubeStore';

const PROCESSING_STEPS = [
  'Fetching transcript...',
  'Chunking content...',
  'Generating summary...',
];

const QUICK_ACTIONS = [
  { label: 'Key Points', prompt: 'Give me the key points from this video.' },
  { label: 'Explain Simply', prompt: 'Explain this video simply for a beginner.' },
  { label: 'Explain in Detail', prompt: 'Explain this video in detail.' },
  { label: 'Timestamps', prompt: 'List the important timestamps and what happens at each point.' },
];

function makeMessage({
  id = crypto.randomUUID(),
  role,
  content,
  sources = [],
  status = 'sent',
  retryMessage = '',
}) {
  return {
    id,
    role,
    content,
    sources,
    status,
    retryMessage,
  };
}

function normalizeStoredMessage(message) {
  return makeMessage({
    id: message?.id || crypto.randomUUID(),
    role: message?.role === 'assistant' ? 'assistant' : 'user',
    content: message?.message ?? message?.content ?? '',
    sources: Array.isArray(message?.sources) ? message.sources : [],
  });
}

function mapProcessError(error) {
  const backendCode = error?.response?.data?.code;
  const backendMessage = error?.response?.data?.error;

  if (backendCode === 'NO_TRANSCRIPT') {
    return "This video doesn't have a transcript. Try a video with captions enabled.";
  }

  if (backendCode === 'UNAVAILABLE') {
    return 'This video is private or unavailable.';
  }

  if (backendCode === 'EMPTY_TRANSCRIPT') {
    return 'The transcript appears to be empty. Try a different video.';
  }

  if (backendCode === 'FETCH_FAILED') {
    return 'Something went wrong fetching the transcript. Check the URL and try again.';
  }

  if (backendMessage === 'Invalid YouTube URL' || error?.response?.status === 400) {
    return 'Please enter a valid YouTube URL.';
  }

  return 'We could not analyze this video right now. Please try again.';
}

function getYoutubeWatchUrl(videoId) {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

function getYoutubeEmbedUrl(videoId) {
  return `https://www.youtube.com/embed/${videoId}`;
}

function getThumbnailUrl(videoId) {
  return `https://img.youtube.com/vi/${videoId}/0.jpg`;
}

function formatMinutes(value) {
  if (typeof value !== 'number' || Number.isNaN(value) || value <= 0) {
    return 'Unknown length';
  }

  const roundedValue = Number.isInteger(value) ? value.toString() : value.toFixed(1);
  return `${roundedValue} min`;
}

function buildChatHistory(messages) {
  return messages
    .filter((message) => message.status !== 'failed')
    .map((message) => ({
      role: message.role,
      content: message.content,
    }));
}

function WarningBanner({ children }) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
      <p className="font-medium">Caption quality note</p>
      <p className="mt-1">{children}</p>
    </div>
  );
}

function InfoPill({ children }) {
  return (
    <span className="rounded-full border border-stone-200 bg-white px-3 py-1.5 text-sm text-slate-600">
      {children}
    </span>
  );
}

export default function YoutubePage() {
  const {
    currentVideo,
    videoHistory,
    chatMessages,
    isProcessing,
    processingStep,
    error,
    historyError,
    isHistoryLoading,
    isVideoLoading,
    setCurrentVideo,
    setVideoHistory,
    setChatMessages,
    addChatMessage,
    removeChatMessage,
    clearChatMessages,
    setProcessingState,
    setError,
    setHistoryError,
    setHistoryLoading,
    setVideoLoading,
    resetYoutubeState,
  } = useYoutubeStore();

  const [urlInput, setUrlInput] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const [playerErrored, setPlayerErrored] = useState(false);
  const [deletingVideoId, setDeletingVideoId] = useState('');
  const bottomRef = useRef(null);
  const processingTimeoutsRef = useRef([]);

  async function loadHistory() {
    setHistoryLoading(true);
    setHistoryError(null);

    try {
      const response = await youtubeAPI.history();
      setVideoHistory(Array.isArray(response.data) ? response.data : []);
    } catch (loadError) {
      setHistoryError('Could not load history');
    } finally {
      setHistoryLoading(false);
    }
  }

  function stopProcessingSequence() {
    processingTimeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
    processingTimeoutsRef.current = [];
  }

  function startProcessingSequence() {
    stopProcessingSequence();
    setProcessingState(true, PROCESSING_STEPS[0]);

    processingTimeoutsRef.current = [
      window.setTimeout(() => setProcessingState(true, PROCESSING_STEPS[1]), 800),
      window.setTimeout(() => setProcessingState(true, PROCESSING_STEPS[2]), 1800),
    ];
  }

  function resetForAnotherVideo() {
    setCurrentVideo(null);
    clearChatMessages();
    setChatInput('');
    setUrlInput('');
    setError(null);
    setPlayerErrored(false);
    setVideoLoading(false);
  }

  async function openVideo(videoId) {
    if (!videoId) {
      return;
    }

    setVideoLoading(true);
    setError(null);
    setPlayerErrored(false);

    try {
      const response = await youtubeAPI.getVideo(videoId);
      setCurrentVideo(response.data);
      setChatMessages(
        Array.isArray(response.data?.messages)
          ? response.data.messages.map(normalizeStoredMessage)
          : []
      );
      setChatInput('');
    } catch (loadError) {
      setError('Could not load this saved video chat.');
    } finally {
      setVideoLoading(false);
    }
  }

  async function handleProcessVideo(event) {
    event?.preventDefault();

    if (!urlInput.trim() || isProcessing) {
      setError('Please enter a valid YouTube URL.');
      return;
    }

    setError(null);
    clearChatMessages();
    setPlayerErrored(false);
    startProcessingSequence();

    try {
      const response = await youtubeAPI.process({ url: urlInput.trim() });
      const nextVideo = {
        ...response.data,
        url: response.data?.url || urlInput.trim(),
      };

      setProcessingState(true, 'Ready!');
      await new Promise((resolve) => window.setTimeout(resolve, 350));
      setCurrentVideo(nextVideo);
      setChatMessages(
        Array.isArray(response.data?.messages)
          ? response.data.messages.map(normalizeStoredMessage)
          : []
      );
      setChatInput('');
      setUrlInput('');
      await loadHistory();
    } catch (processError) {
      setError(mapProcessError(processError));
    } finally {
      stopProcessingSequence();
      setProcessingState(false, '');
    }
  }

  async function handleDeleteVideo(videoId) {
    if (!videoId || deletingVideoId) {
      return;
    }

    setDeletingVideoId(videoId);
    setError(null);

    try {
      await youtubeAPI.deleteVideo(videoId);
      setVideoHistory((prevHistory) =>
        prevHistory.filter((video) => video.videoId !== videoId)
      );
      await loadHistory();

      if (currentVideo?.videoId === videoId) {
        resetForAnotherVideo();
      }
    } catch (deleteError) {
      setError('We could not delete that video right now.');
    } finally {
      setDeletingVideoId('');
    }
  }

  async function sendMessage(prefilledMessage = '', failedMessageId = '') {
    const nextMessage = (prefilledMessage || chatInput).trim();

    if (!currentVideo?.videoId || !nextMessage || isChatting) {
      return;
    }

    const previousMessages = [...chatMessages];

    if (failedMessageId) {
      removeChatMessage(failedMessageId);
    }

    addChatMessage(makeMessage({ role: 'user', content: nextMessage }));
    setChatInput('');
    setIsChatting(true);
    setError(null);

    try {
      const response = await youtubeAPI.chat({
        videoId: currentVideo.videoId,
        message: nextMessage,
        chatHistory: buildChatHistory(previousMessages),
      });

      addChatMessage(
        makeMessage({
          role: 'assistant',
          content: response.data.reply,
          sources: response.data.sources,
        })
      );

      setVideoHistory((prevHistory) =>
        prevHistory.map((video) =>
          video.videoId === currentVideo.videoId
            ? { ...video, messageCount: (video.messageCount || 0) + 2 }
            : video
        )
      );
    } catch (chatError) {
      addChatMessage(
        makeMessage({
          role: 'assistant',
          content: 'This question did not go through.',
          status: 'failed',
          retryMessage: nextMessage,
        })
      );
    } finally {
      setIsChatting(false);
    }
  }

  useEffect(() => {
    resetYoutubeState();
    loadHistory();

    return () => {
      stopProcessingSequence();
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isChatting]);

  return (
    <div className="flex min-h-screen flex-col bg-stone-100 lg:h-screen lg:flex-row">
      <aside className="w-full border-b border-stone-200 bg-white lg:w-80 lg:border-b-0 lg:border-r">
        <div className="border-b border-stone-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-tide">Advisor</p>
              <h2 className="mt-2 text-2xl font-semibold text-ink">YouTube</h2>
            </div>
            <Link to="/" className="text-sm font-medium text-slate-500 hover:text-ink">
              Back
            </Link>
          </div>

          <p className="mt-3 text-sm text-slate-500">
            Paste a YouTube link, generate a transcript summary, and reopen saved video chats anytime.
          </p>

          <div className="mt-4">
            <button
              type="button"
              onClick={resetForAnotherVideo}
              className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              + New Video
            </button>
          </div>
        </div>

        <div className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.25em] text-tide">Video History</p>
            <button
              type="button"
              onClick={loadHistory}
              className="text-xs font-semibold text-slate-500 transition hover:text-ink"
            >
              Refresh
            </button>
          </div>

          <div className="mt-4 max-h-[calc(100vh-170px)] space-y-3 overflow-y-auto pr-1">
            {isHistoryLoading ? (
              <p className="rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm text-slate-500">
                Loading video history...
              </p>
            ) : historyError ? (
              <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm text-slate-500">
                <p>{historyError}</p>
                <button
                  type="button"
                  onClick={loadHistory}
                  className="mt-3 rounded-full border border-stone-300 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-stone-400 hover:text-ink"
                >
                  Retry
                </button>
              </div>
            ) : videoHistory.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-stone-300 p-4 text-sm text-slate-500">
                No videos yet. Paste a YouTube link to get started.
              </p>
            ) : (
              videoHistory.map((video) => (
                <div
                  key={video.videoId}
                  className={`w-full rounded-[1.5rem] border p-3 text-left transition ${currentVideo?.videoId === video.videoId
                    ? 'border-amber-200 bg-amber-50'
                    : 'border-stone-200 bg-stone-50 hover:border-stone-300 hover:bg-white'
                    }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => openVideo(video.videoId)}
                      className="flex min-w-0 flex-1 gap-3 text-left"
                    >
                      <img
                        src={getThumbnailUrl(video.videoId)}
                        alt={video.title || video.videoId}
                        className="h-16 w-24 rounded-xl object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="overflow-hidden text-sm font-semibold text-ink [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
                          {video.title || video.videoId}
                        </p>

                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <span>{formatMinutes(video.estimatedMinutes)}</span>
                          {typeof video.messageCount === 'number' ? (
                            <span>{`${video.messageCount} messages`}</span>
                          ) : null}
                          {video.qualityWarning ? (
                            <span className="rounded-full border border-amber-200 bg-amber-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-700">
                              Auto captions
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteVideo(video.videoId)}
                      disabled={deletingVideoId === video.videoId}
                      className="rounded-full border border-stone-300 px-2 py-1 text-[11px] font-semibold text-slate-500 transition hover:border-red-200 hover:text-red-600 disabled:opacity-60"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </aside>

      <main className="flex flex-1 min-h-0 flex-col">
        {!currentVideo ? (
          <div className="flex flex-1 items-center justify-center px-4 py-8 md:px-8">
            <div className="w-full max-w-3xl rounded-[2rem] border border-stone-200 bg-white p-8 shadow-panel">
              <div className="mx-auto max-w-xl text-center">
                <p className="text-xs uppercase tracking-[0.25em] text-tide">YouTube Explainer Agent</p>
                <h1 className="mt-3 text-4xl font-bold text-ink">Analyze a YouTube video</h1>
                <p className="mt-3 text-sm leading-6 text-slate-500">
                  Fetch the transcript, build a summary, and keep a saved chat thread for each video you process.
                </p>
              </div>

              <form onSubmit={handleProcessVideo} className="mx-auto mt-8 max-w-2xl">
                <div className="flex items-center gap-3 rounded-[1.8rem] border border-stone-300 bg-stone-50 px-4 py-4 transition focus-within:border-tide focus-within:bg-white">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.6 3.5 12 3.5 12 3.5s-7.6 0-9.4.6A3 3 0 0 0 .5 6.2 31.2 31.2 0 0 0 0 12a31.2 31.2 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.8.6 9.4.6 9.4.6s7.6 0 9.4-.6a3 3 0 0 0 2.1-2.1A31.2 31.2 0 0 0 24 12a31.2 31.2 0 0 0-.5-5.8ZM9.5 15.7V8.3L16 12Z" />
                    </svg>
                  </div>

                  <input
                    value={urlInput}
                    onChange={(event) => setUrlInput(event.target.value)}
                    placeholder="Paste a YouTube link..."
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-stone-400"
                    disabled={isProcessing}
                  />

                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="rounded-2xl bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Analyze Video
                  </button>
                </div>
              </form>

              {isProcessing ? (
                <div className="mx-auto mt-6 max-w-xl rounded-2xl border border-stone-200 bg-stone-50 px-4 py-4 text-sm text-slate-600">
                  <p className="font-medium text-ink">{processingStep}</p>
                  <p className="mt-1 text-slate-500">
                    This can take a moment while the transcript is indexed and summarized.
                  </p>
                </div>
              ) : null}

              {error ? (
                <p className="mx-auto mt-4 max-w-xl text-sm text-red-600">{error}</p>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="flex flex-1 min-h-0 flex-col lg:flex-row">
            <section className="border-b border-stone-200 bg-white lg:w-[25rem] lg:border-b-0 lg:border-r">
              <div className="h-full overflow-y-auto px-4 py-5 md:px-6">
                <div className="space-y-4">


                  <div className="overflow-hidden rounded-[1.8rem] border border-stone-200 bg-stone-50 shadow-sm">
                    {!playerErrored ? (
                      <iframe
                        title={currentVideo.title || currentVideo.videoId}
                        src={getYoutubeEmbedUrl(currentVideo.videoId)}
                        className="aspect-video w-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                        onError={() => setPlayerErrored(true)}
                      />
                    ) : (
                      <div className="flex aspect-video items-center justify-center p-6 text-center text-sm text-slate-500">
                        <div>
                          <p>The player could not load here.</p>
                          <a
                            href={getYoutubeWatchUrl(currentVideo.videoId)}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-3 inline-flex rounded-full border border-stone-300 px-4 py-2 font-semibold text-slate-700 transition hover:border-stone-400 hover:text-ink"
                          >
                            Open on YouTube
                          </a>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="rounded-[1.8rem] border border-stone-200 bg-stone-50 p-5">
                    <p className="text-xs uppercase tracking-[0.25em] text-tide">Video Stats</p>
                    <h1 className="mt-3 text-2xl font-semibold text-ink">
                      {currentVideo.title || currentVideo.videoId}
                    </h1>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <InfoPill>{formatMinutes(currentVideo.estimatedMinutes)}</InfoPill>
                      <InfoPill>{`${currentVideo.wordCount || 0} words`}</InfoPill>
                      <InfoPill>{`${chatMessages.length} saved messages`}</InfoPill>
                    </div>
                    <a
                      href={getYoutubeWatchUrl(currentVideo.videoId)}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 inline-flex rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-stone-400 hover:text-ink"
                    >
                      Open on YouTube
                    </a>
                  </div>

                  <div className="rounded-[1.8rem] border border-stone-200 bg-white p-5 shadow-sm">
                    <p className="text-xs uppercase tracking-[0.25em] text-tide">Instant Summary</p>
                    <div className="mt-3 text-sm leading-7 text-slate-700">
                      {currentVideo.summary ? (
                        <MarkdownRenderer content={currentVideo.summary} />
                      ) : (
                        <p className="m-0">Summary unavailable</p>
                      )}
                    </div>
                  </div>

                  {currentVideo.qualityWarning ? (
                    <WarningBanner>
                      This video uses auto-generated captions. Accuracy may be lower than usual.
                    </WarningBanner>
                  ) : null}

                  <div className="rounded-[1.8rem] border border-stone-200 bg-stone-50 p-4">
                    <p className="text-xs uppercase tracking-[0.25em] text-tide">Quick Actions</p>
                    <div className="mt-3 flex flex-wrap gap-3">
                      {QUICK_ACTIONS.map((action) => (
                        <button
                          key={action.label}
                          type="button"
                          onClick={() => sendMessage(action.prompt)}
                          disabled={isChatting}
                          className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-stone-400 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="flex min-h-0 flex-1 flex-col">
              <div className="border-b border-stone-200 bg-white px-4 py-4 md:px-8">
                <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-tide">Saved Conversation</p>
                    <h2 className="mt-1 text-xl font-semibold text-ink">
                      {currentVideo.title || currentVideo.videoId}
                    </h2>
                  </div>

                  {isVideoLoading ? (
                    <span className="text-sm font-medium text-slate-500">Loading chat...</span>
                  ) : null}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8">
                <div className="mx-auto max-w-4xl space-y-4">
                  {isVideoLoading ? (
                    <div className="rounded-[1.8rem] border border-stone-200 bg-white p-6 text-sm text-slate-500">
                      Loading the saved conversation for this video...
                    </div>
                  ) : chatMessages.length === 0 ? (
                    <div className="rounded-[1.8rem] border border-dashed border-stone-300 bg-white/70 p-6 text-sm text-slate-500">
                      No previous messages for this video yet. Ask anything about it and this chat will be saved here.
                    </div>
                  ) : null}

                  {!isVideoLoading
                    ? chatMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className="w-full max-w-3xl">
                          <div
                            className={`rounded-[1.6rem] px-5 py-4 text-sm leading-7 shadow-sm ${message.role === 'user'
                              ? 'bg-ink text-white'
                              : message.status === 'failed'
                                ? 'border border-red-200 bg-red-50 text-red-700'
                                : 'border border-stone-200 bg-white text-slate-700'
                              }`}
                          >
                            {message.role === 'assistant' && message.status !== 'failed' ? (
                              <MarkdownRenderer content={message.content} />
                            ) : (
                              <p className="m-0 whitespace-pre-wrap">{message.content}</p>
                            )}
                          </div>

                          {message.status === 'failed' ? (
                            <button
                              type="button"
                              onClick={() => sendMessage(message.retryMessage, message.id)}
                              className="mt-3 rounded-full border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:border-red-300"
                            >
                              Retry
                            </button>
                          ) : null}

                          {message.role === 'assistant' && message.status !== 'failed' ? (
                            <SourcePanel sources={message.sources} />
                          ) : null}
                        </div>
                      </div>
                    ))
                    : null}

                  {isChatting ? (
                    <div className="flex justify-start">
                      <div className="rounded-[1.6rem] border border-stone-200 bg-white px-5 py-4 text-sm text-slate-500 shadow-sm">
                        Thinking...
                      </div>
                    </div>
                  ) : null}

                  <div ref={bottomRef} />
                </div>
              </div>

              <div className="border-t border-stone-200 bg-white px-4 py-4 md:px-8">
                <div className="mx-auto max-w-4xl">
                  {currentVideo && error ? <p className="mb-3 text-sm text-red-600">{error}</p> : null}

                  <div className="flex items-center gap-2 rounded-2xl border border-stone-300 bg-stone-50 px-3 py-2 transition focus-within:border-tide focus-within:bg-white">
                    <input
                      value={chatInput}
                      onChange={(event) => setChatInput(event.target.value)}
                      placeholder="Ask about this video..."
                      className="flex-1 bg-transparent text-sm outline-none placeholder:text-stone-400 disabled:cursor-not-allowed"
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          sendMessage();
                        }
                      }}
                      disabled={!currentVideo || isChatting || isVideoLoading}
                    />

                    <button
                      type="button"
                      onClick={() => sendMessage()}
                      disabled={!currentVideo || isChatting || isVideoLoading || !chatInput.trim()}
                      className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-sun text-ink transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13" />
                        <polygon points="22 2 15 22 11 13 2 9 22 2" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
