import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { chatAPI } from '../api/services';

export default function ChatPage() {
  const { agentType } = useParams();
  const [sessions, setSessions] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    setActiveId(null);
    setMessages([]);
    setError('');

    chatAPI
      .getSessions(agentType)
      .then((response) => setSessions(response.data))
      .catch((err) => {
        setError(err.response?.data?.error || 'Unable to load sessions.');
      });
  }, [agentType]);

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

        <div className="max-h-[40vh] overflow-y-auto p-3 lg:max-h-[calc(100vh-145px)]">
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
                  {message.message}
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
            {error ? <p className="mb-3 text-sm text-red-600">{error}</p> : null}
            <div className="flex flex-col gap-3 md:flex-row">
              <input
                className="flex-1 rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-tide focus:bg-white"
                placeholder={activeId ? 'Ask your question...' : 'Start a new chat first'}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    send();
                  }
                }}
                disabled={!activeId || loading}
              />
              <button
                onClick={send}
                disabled={!activeId || loading}
                className="rounded-2xl bg-sun px-6 py-3 text-sm font-semibold text-ink transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
