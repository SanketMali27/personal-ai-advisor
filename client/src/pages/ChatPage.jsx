import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { chatAPI, documentAPI } from '../api/services';
import MarkdownRenderer from '../components/MarkdownRenderer';

const AGENT_DOMAIN_MAP = {
  doctor: 'medical',
  teacher: 'education',
  finance: 'finance',
  lawyer: 'legal',
};

function getUploadsBaseUrl() {
  const apiUrl = import.meta.env.VITE_API_URL;

  if (!apiUrl) {
    return '/uploads';
  }

  const apiOrigin = new URL(apiUrl, window.location.origin);
  return `${apiOrigin.origin}/uploads`;
}

export default function ChatPage() {
  const { agentType } = useParams();
  const [sessions, setSessions] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [docsLoading, setDocsLoading] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);
  const domain = AGENT_DOMAIN_MAP[agentType];

  async function loadDocuments(currentDomain) {
    if (!currentDomain) {
      setDocuments([]);
      return;
    }

    setDocsLoading(true);

    try {
      const response = await documentAPI.getDocuments(currentDomain);
      setDocuments(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to load documents.');
    } finally {
      setDocsLoading(false);
    }
  }

  useEffect(() => {
    setActiveId(null);
    setMessages([]);
    setDocuments([]);
    setError('');
    setUploadStatus('');
    setFile(null);

    chatAPI
      .getSessions(agentType)
      .then((response) => setSessions(response.data))
      .catch((err) => {
        setError(err.response?.data?.error || 'Unable to load sessions.');
      });
  }, [agentType]);

  useEffect(() => {
    loadDocuments(domain);
  }, [domain]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function openSession(id) {
    setActiveId(id);
    setError('');

    try {
      const { data } = await chatAPI.getSession(id);
      setMessages(data.messages);
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to load this chat.');
    }
  }

  async function newChat() {
    setError('');

    try {
      const { data } = await chatAPI.createSession({ agentType });
      setSessions((prev) => [data, ...prev]);
      setActiveId(data._id);
      setMessages([]);
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to create a chat.');
    }
  }

  async function handleUpload() {
    if (!file || !domain) {
      setError('Please select a file to upload.');
      setUploadStatus('');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('domain', domain);

    try {
      setUploading(true);
      setError('');
      setUploadStatus('Uploading...');
      await documentAPI.upload(formData);
      setUploadStatus('Uploaded successfully. Indexing continues in the background.');
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      await loadDocuments(domain);
    } catch (err) {
      setUploadStatus('');
      setError(err.response?.data?.error || 'Upload failed. Try again.');
    } finally {
      setUploading(false);
    }
  }

  async function send() {
    if (!input.trim() || !activeId || loading) {
      return;
    }

    const userMsg = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', message: userMsg }]);
    setLoading(true);
    setError('');

    try {
      const { data } = await chatAPI.sendMessage({
        sessionId: activeId,
        message: userMsg,
      });
      setMessages((prev) => [...prev, data.message]);
      setSessions((prev) =>
        prev.map((session) =>
          session._id === activeId &&
            (!session.title || session.title === `${agentType} chat`)
            ? { ...session, title: userMsg.slice(0, 60) }
            : session
        )
      );
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to send message.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-stone-100 lg:h-screen lg:flex-row">
      <aside className="w-full border-b border-stone-200 bg-white lg:w-80 lg:border-b-0 lg:border-r">
        <div className="border-b border-stone-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-tide">Advisor</p>
              <h2 className="mt-2 text-2xl font-semibold capitalize text-ink">{agentType}</h2>
            </div>
            <Link to="/" className="text-sm font-medium text-slate-500 hover:text-ink">
              Back
            </Link>
          </div>

          <button
            onClick={newChat}
            className="mt-4 w-full rounded-2xl bg-ink px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Start New Chat
          </button>
        </div>

        <div className="border-b border-stone-200 p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.25em] text-tide">Uploaded Files</p>
            {domain ? <span className="text-xs capitalize text-slate-500">{domain}</span> : null}
          </div>

          <div className="mt-3 max-h-56 space-y-2 overflow-y-auto">
            {docsLoading ? (
              <p className="rounded-2xl border border-stone-200 bg-stone-50 p-3 text-sm text-slate-500">
                Loading files...
              </p>
            ) : documents.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-stone-300 p-3 text-sm text-slate-500">
                No files uploaded for this domain yet.
              </p>
            ) : (
              documents.map((doc) => (
                <a
                  key={doc._id}
                  href={`${getUploadsBaseUrl()}/${encodeURIComponent(doc.filename)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm transition hover:border-tide hover:bg-white"
                >
                  <p className="truncate font-medium text-ink">{doc.originalName || doc.filename}</p>
                  <p className="mt-1 text-xs capitalize text-slate-500">
                    {doc.status} {doc.chunkCount ? ` - ${doc.chunkCount} chunks` : ''}
                  </p>
                </a>
              ))
            )}
          </div>
        </div>

        <div className="max-h-[40vh] overflow-y-auto p-3 lg:max-h-[calc(100vh-369px)]">
          {sessions.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-stone-300 p-4 text-sm text-slate-500">
              No chats yet. Start one to begin.
            </p>
          ) : (
            sessions.map((session) => (
              <button
                key={session._id}
                onClick={() => openSession(session._id)}
                className={`mb-2 w-full rounded-2xl px-4 py-3 text-left text-sm transition ${activeId === session._id
                  ? 'bg-amber-100 text-ink'
                  : 'bg-stone-50 text-slate-600 hover:bg-stone-100'
                  }`}
              >
                <p className="truncate font-medium">{session.title}</p>
              </button>
            ))
          )}
        </div>
      </aside>

      <main className="flex flex-1 flex-col">
        <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8">
          {!activeId && (
            <div className="mx-auto mt-16 max-w-xl rounded-[2rem] border border-dashed border-stone-300 bg-white/70 p-8 text-center shadow-sm">
              <h3 className="text-2xl font-semibold text-ink">Open a chat to begin</h3>
              <p className="mt-2 text-sm text-slate-500">
                Create a session, ask a question, and the agent will pull relevant document context when available.
              </p>
            </div>
          )}

          <div className="mx-auto max-w-3xl space-y-4">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-2xl rounded-[1.6rem] px-5 py-4 text-sm leading-7 shadow-sm ${message.role === 'user'
                    ? 'bg-ink text-white'
                    : 'border border-stone-200 bg-white text-slate-700'
                    }`}
                >
                  {message.role === 'assistant' ? (
                    <MarkdownRenderer content={message.message} />
                  ) : (
                    <p className="m-0 whitespace-pre-wrap">{message.message}</p>
                  )}
                </div>
              </div>
            ))}



            {loading && (
              <div className="flex justify-start">
                <div className="rounded-[1.6rem] border border-stone-200 bg-white px-5 py-4 text-sm text-slate-500 shadow-sm">
                  Thinking...
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        </div>

        <div className="border-t border-stone-200 bg-white px-4 py-4 md:px-8">
          <div className="mx-auto max-w-3xl">
            {uploadStatus ? <p className="mb-2 text-sm text-tide">{uploadStatus}</p> : null}
            {error ? <p className="mb-3 text-sm text-red-600">{error}</p> : null}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt"
              id="file-upload"
              className="hidden"
              onChange={(event) => {
                setFile(event.target.files?.[0] || null);
                setUploadStatus('');
              }}
            />

            <div className="flex items-center gap-2 rounded-2xl border border-stone-300 bg-stone-50 px-3 py-2 transition focus-within:border-tide focus-within:bg-white">
              <label
                htmlFor="file-upload"
                title="Attach file"
                className={`flex h-8 w-8 flex-shrink-0 cursor-pointer items-center justify-center rounded-xl border transition
      ${file
                    ? 'border-tide bg-tide/10 text-tide'
                    : 'border-stone-300 bg-white text-stone-400 hover:border-stone-400 hover:text-stone-600'
                  }`}
              >
                {file ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                )}
              </label>

              {file && (
                <span className="flex items-center gap-1 rounded-lg bg-stone-100 px-2 py-0.5 text-xs text-stone-600 max-w-[120px] truncate">
                  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                  {file.name}
                </span>
              )}

              <input
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-stone-400 disabled:cursor-not-allowed"
                placeholder={
                  file
                    ? `Ready to upload to ${domain || 'this domain'}`
                    : activeId
                      ? 'Ask your question...'
                      : 'Start a new chat first'
                }
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    if (file) {
                      handleUpload();
                    } else {
                      send();
                    }
                  }
                }}
                disabled={(file && uploading) || (!file && (!activeId || loading))}
              />

              <button
                onClick={file ? handleUpload : send}
                disabled={file ? uploading : !activeId || loading}
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-sun text-ink transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {file ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="19" x2="12" y2="5" />
                    <polyline points="5 12 12 5 19 12" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
