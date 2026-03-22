import { useState } from 'react';
import { Link } from 'react-router-dom';
import { documentAPI } from '../api/services';

const DOMAINS = ['medical', 'education', 'finance', 'legal'];

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [domain, setDomain] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  async function handleUpload() {
    if (!file || !domain) {
      setError('Please select a file and domain.');
      setStatus('');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('domain', domain);

    try {
      setError('');
      setStatus('Uploading...');
      await documentAPI.upload(formData);
      setStatus('Uploaded successfully. Indexing continues in the background.');
      setFile(null);
    } catch (err) {
      setStatus('');
      setError(err.response?.data?.error || 'Upload failed. Try again.');
    }
  }

  return (
    <div className="min-h-screen bg-hero-wash px-6 py-10">
      <div className="mx-auto max-w-2xl rounded-[2rem] border border-white/70 bg-white/85 p-8 shadow-panel backdrop-blur">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-tide">Knowledge Base</p>
            <h1 className="mt-2 text-3xl font-bold text-ink">Upload documents</h1>
          </div>
          <Link to="/" className="text-sm font-semibold text-slate-500 hover:text-ink">
            Back
          </Link>
        </div>

        <div className="space-y-5">
          <label className="block rounded-[1.5rem] border border-dashed border-stone-300 bg-stone-50 p-5 text-sm text-slate-600">
            <span className="mb-3 block font-medium text-ink">Choose a file</span>
            <input
              type="file"
              accept=".pdf,.txt"
              onChange={(event) => setFile(event.target.files?.[0] || null)}
              className="w-full text-sm"
            />
            {file ? <span className="mt-3 block text-xs text-slate-500">{file.name}</span> : null}
          </label>

          <p className="text-xs text-slate-500">
            Supported formats: PDF and TXT. The current indexer does not parse Word files yet.
          </p>

          <select
            value={domain}
            onChange={(event) => setDomain(event.target.value)}
            className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-tide"
          >
            <option value="">Select domain</option>
            {DOMAINS.map((entry) => (
              <option key={entry} value={entry}>
                {entry.charAt(0).toUpperCase() + entry.slice(1)}
              </option>
            ))}
          </select>

          <button
            onClick={handleUpload}
            className="w-full rounded-2xl bg-ink px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Upload and Index
          </button>

          {status ? <p className="text-sm text-tide">{status}</p> : null}
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </div>
      </div>
    </div>
  );
}
