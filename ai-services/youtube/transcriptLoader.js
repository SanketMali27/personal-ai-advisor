const path = require('path');
const { pathToFileURL } = require('url');
const { serverRequire } = require('../../shared/runtime');

let youtubeTranscriptModulePromise;

function getYoutubeTranscriptModule() {
  if (!youtubeTranscriptModulePromise) {
    const packageJsonPath = serverRequire.resolve('youtube-transcript/package.json');
    const esmEntryPath = path.join(
      path.dirname(packageJsonPath),
      'dist',
      'youtube-transcript.esm.js'
    );

    youtubeTranscriptModulePromise = import(pathToFileURL(esmEntryPath).href);
  }

  return youtubeTranscriptModulePromise;
}

function extractVideoId(url) {
  const isValidVideoId = (videoId) => /^[A-Za-z0-9_-]{11}$/.test(videoId);

  try {
    const parsedUrl = new URL(String(url || '').trim());
    const hostname = parsedUrl.hostname.replace(/^www\./, '');
    const pathParts = parsedUrl.pathname.split('/').filter(Boolean);

    if (hostname === 'youtu.be' && isValidVideoId(pathParts[0])) {
      return pathParts[0];
    }

    if (hostname === 'youtube.com' || hostname === 'm.youtube.com') {
      if (parsedUrl.pathname === '/watch') {
        const videoId = parsedUrl.searchParams.get('v');

        if (isValidVideoId(videoId)) {
          return videoId;
        }
      }

      if (['embed', 'shorts'].includes(pathParts[0]) && isValidVideoId(pathParts[1])) {
        return pathParts[1];
      }
    }
  } catch (error) {
    throw new Error('Invalid YouTube URL');
  }

  throw new Error('Invalid YouTube URL');
}

function formatTimestamp(offsetMs) {
  const safeOffset = Number.isFinite(offsetMs) ? Math.max(0, offsetMs) : 0;
  const totalSeconds = Math.floor(safeOffset / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function cleanText(text) {
  return String(text || '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(parseInt(code, 10)))
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchTranscript(videoId) {
  let fetchYoutubeTranscript;
  let YoutubeTranscriptDisabledError;
  let YoutubeTranscriptNotAvailableError;
  let YoutubeTranscriptVideoUnavailableError;

  try {
    ({
      fetchTranscript: fetchYoutubeTranscript,
      YoutubeTranscriptDisabledError,
      YoutubeTranscriptNotAvailableError,
      YoutubeTranscriptVideoUnavailableError,
    } = await getYoutubeTranscriptModule());

    const transcript = await fetchYoutubeTranscript(videoId);

    if (!Array.isArray(transcript) || transcript.length === 0) {
      throw new Error('EMPTY_TRANSCRIPT: Transcript was fetched but contains no text.');
    }

    const normalizedTranscript = transcript
      .map((item) => ({
        text: cleanText(item?.text),
        timestamp: formatTimestamp(item?.offset),
      }))
      .filter((item) => item.text);

    if (normalizedTranscript.length === 0) {
      throw new Error('EMPTY_TRANSCRIPT: Transcript was fetched but contains no text.');
    }

    return normalizedTranscript;
  } catch (error) {
    if (
      error instanceof YoutubeTranscriptDisabledError ||
      error instanceof YoutubeTranscriptNotAvailableError
    ) {
      throw new Error('NO_TRANSCRIPT: This video has no transcript available.');
    }

    if (error instanceof YoutubeTranscriptVideoUnavailableError) {
      throw new Error('UNAVAILABLE: This video is private or does not exist.');
    }

    if (typeof error?.message === 'string') {
      if (error.message.startsWith('EMPTY_TRANSCRIPT:')) {
        throw error;
      }

      if (/no transcripts are available/i.test(error.message)) {
        throw new Error('NO_TRANSCRIPT: This video has no transcript available.');
      }

      if (/video is no longer available|private video|does not exist/i.test(error.message)) {
        throw new Error('UNAVAILABLE: This video is private or does not exist.');
      }
    }

    throw new Error(`FETCH_FAILED: ${error.message}`);
  }
}

function buildTranscriptText(transcriptItems) {
  const lines = transcriptItems
    .map((item) => {
      const text = cleanText(item?.text);

      if (!text) {
        return '';
      }

      return `[${item.timestamp}] ${text}`;
    })
    .filter(Boolean);

  const fullText = lines
    .join('\n')
    .replace(/\n{2,}/g, '\n')
    .trim();
  const words = fullText.match(/\S+/g) || [];
  const wordCount = words.length;
  const estimatedMinutes = wordCount
    ? Number(Math.max(wordCount / 150, 0.1).toFixed(1))
    : 0;

  return {
    fullText,
    wordCount,
    estimatedMinutes,
  };
}

function detectTranscriptQuality(transcriptItems) {
  if (!Array.isArray(transcriptItems) || transcriptItems.length === 0) {
    return { quality: 'auto', warning: true };
  }

  const itemsWithoutSentenceEnding = transcriptItems.filter((item) => {
    const text = cleanText(item?.text);
    return text ? !/[.!?]["']?$/.test(text) : true;
  }).length;

  const ratio = itemsWithoutSentenceEnding / transcriptItems.length;

  if (ratio > 0.6) {
    return { quality: 'auto', warning: true };
  }

  return { quality: 'manual', warning: false };
}

module.exports = {
  extractVideoId,
  fetchTranscript,
  buildTranscriptText,
  detectTranscriptQuality,
};
