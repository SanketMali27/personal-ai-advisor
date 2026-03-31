const YoutubeVideo = require('../models/YoutubeVideo');
const {
  extractVideoId,
  fetchTranscript,
  buildTranscriptText,
  detectTranscriptQuality,
} = require('../../ai-services/youtube/transcriptLoader');
const {
  processYoutubeVideo,
  generateVideoSummary,
  answerVideoQuestion,
  getYoutubeCollectionName,
} = require('../../ai-services/youtube/youtubeRagPipeline');
const { deleteCollection } = require('../../vector-db/qdrantClient');

function extractTitleFromUrl(url) {
  try {
    const parsedUrl = new URL(String(url || '').trim());
    return parsedUrl.searchParams.get('title') || '';
  } catch (error) {
    return '';
  }
}

function serializeYoutubeMessage(message) {
  return {
    id: message?._id?.toString?.() || null,
    role: message.role,
    message: message.message,
    sources: Array.isArray(message.sources) ? message.sources : [],
    createdAt: message.createdAt || null,
  };
}

function buildYoutubeVideoResponse(video, { includeMessages = false } = {}) {
  return {
    videoId: video.videoId,
    url: video.url,
    title: video.title,
    summary: video.summary,
    chunkCount: video.chunkCount,
    wordCount: video.wordCount,
    estimatedMinutes: video.estimatedMinutes,
    qualityWarning: video.qualityWarning,
    createdAt: video.createdAt,
    messages: includeMessages
      ? (Array.isArray(video.messages) ? video.messages : []).map(serializeYoutubeMessage)
      : undefined,
  };
}

function mapTranscriptError(error) {
  if (typeof error?.message !== 'string') {
    return null;
  }

  if (error.message.startsWith('NO_TRANSCRIPT:')) {
    return {
      status: 422,
      body: {
        error: 'This video has no transcript available.',
        code: 'NO_TRANSCRIPT',
      },
    };
  }

  if (error.message.startsWith('UNAVAILABLE:')) {
    return {
      status: 422,
      body: {
        error: 'This video is private or does not exist.',
        code: 'UNAVAILABLE',
      },
    };
  }

  if (error.message.startsWith('EMPTY_TRANSCRIPT:')) {
    return {
      status: 422,
      body: {
        error: 'Transcript was fetched but contains no text.',
        code: 'EMPTY_TRANSCRIPT',
      },
    };
  }

  if (error.message.startsWith('FETCH_FAILED:')) {
    return {
      status: 500,
      body: {
        error: 'Something went wrong fetching the transcript.',
        code: 'FETCH_FAILED',
      },
    };
  }

  return null;
}

exports.processYoutubeVideo = async (req, res) => {
  const { url } = req.body || {};

  let videoId;

  try {
    videoId = extractVideoId(url);
  } catch (error) {
    return res.status(400).json({ error: 'Invalid YouTube URL' });
  }

  try {
    const existingVideo = await YoutubeVideo.findOne({
      userId: req.user.id,
      videoId,
    }).lean();

    if (existingVideo) {
      return res.json({
        ...buildYoutubeVideoResponse(existingVideo, { includeMessages: true }),
        alreadyProcessed: true,
      });
    }

    let transcriptItems;

    try {
      transcriptItems = await fetchTranscript(videoId);
    } catch (error) {
      const mappedError = mapTranscriptError(error);

      if (mappedError) {
        return res.status(mappedError.status).json(mappedError.body);
      }

      throw error;
    }

    const { fullText, wordCount, estimatedMinutes } = buildTranscriptText(transcriptItems);
    const transcriptQuality = detectTranscriptQuality(transcriptItems);

    let processingResult;

    try {
      processingResult = await processYoutubeVideo(videoId, fullText, 'youtube');
    } catch (error) {
      console.error('YouTube indexing failed:', error.message);
      return res.status(500).json({
        error: 'We could not process this video right now.',
        code: 'QDRANT_FAILED',
      });
    }

    const summary = await generateVideoSummary(fullText);
    const title = extractTitleFromUrl(url);

    try {
      const video = await YoutubeVideo.create({
        userId: req.user.id,
        videoId,
        url,
        title,
        summary,
        wordCount,
        estimatedMinutes,
        qualityWarning: transcriptQuality.warning,
        chunkCount: processingResult.chunkCount,
      });

      return res.json({
        ...buildYoutubeVideoResponse(video, { includeMessages: true }),
        alreadyProcessed: processingResult.alreadyProcessed,
      });
    } catch (error) {
      if (error?.code === 11000) {
        const existingVideo = await YoutubeVideo.findOne({
          userId: req.user.id,
          videoId,
        }).lean();

        if (existingVideo) {
          return res.json({
            ...buildYoutubeVideoResponse(existingVideo, { includeMessages: true }),
            alreadyProcessed: true,
          });
        }
      }

      throw error;
    }
  } catch (error) {
    console.error('YouTube process route failed:', error.message);
    return res.status(500).json({
      error: 'We could not analyze this video right now.',
      code: 'PROCESS_FAILED',
    });
  }
};

exports.chatWithYoutubeVideo = async (req, res) => {
  const { videoId, message, chatHistory } = req.body || {};

  if (!videoId || !message) {
    return res.status(400).json({ error: 'videoId and message are required' });
  }

  try {
    const video = await YoutubeVideo.findOne({
      userId: req.user.id,
      videoId,
    }).lean();

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const history = (Array.isArray(video.messages) && video.messages.length > 0
      ? video.messages
      : Array.isArray(chatHistory)
        ? chatHistory
        : []
    )
      .filter((entry) => entry?.role && (entry?.content || entry?.message))
      .slice(-10)
      .map((entry) => ({
        role: entry.role === 'assistant' ? 'assistant' : 'user',
        content: String(entry.content || entry.message),
      }));

    try {
      const { answer, sources } = await answerVideoQuestion(videoId, message, history);
      await YoutubeVideo.updateOne(
        { _id: video._id },
        {
          $push: {
            messages: {
              $each: [
                {
                  role: 'user',
                  message: String(message),
                  sources: [],
                },
                {
                  role: 'assistant',
                  message: answer,
                  sources: Array.isArray(sources) ? sources : [],
                },
              ],
            },
          },
        }
      );

      return res.json({
        reply: answer,
        sources: Array.isArray(sources) ? sources : [],
      });
    } catch (error) {
      console.error('YouTube chat failed:', error.message);
      return res.status(500).json({
        error: 'We could not answer that video question right now.',
      });
    }
  } catch (error) {
    console.error('YouTube chat route failed:', error.message);
    return res.status(500).json({
      error: 'We could not answer that video question right now.',
    });
  }
};

exports.getYoutubeVideo = async (req, res) => {
  try {
    const video = await YoutubeVideo.findOne({
      userId: req.user.id,
      videoId: req.params.videoId,
    }).lean();

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    return res.json(buildYoutubeVideoResponse(video, { includeMessages: true }));
  } catch (error) {
    console.error('YouTube video fetch failed:', error.message);
    return res.status(500).json({ error: 'Could not load this video' });
  }
};

exports.getYoutubeHistory = async (req, res) => {
  try {
    const videos = await YoutubeVideo.find({ userId: req.user.id })
      .sort('-createdAt')
      .select('videoId url title summary createdAt estimatedMinutes qualityWarning wordCount messages')
      .lean();

    return res.json(
      videos.map((video) => ({
        ...buildYoutubeVideoResponse(video),
        messageCount: Array.isArray(video.messages) ? video.messages.length : 0,
      }))
    );
  } catch (error) {
    console.error('YouTube history failed:', error.message);
    return res.status(500).json({ error: 'Could not load YouTube history' });
  }
};

exports.deleteYoutubeVideo = async (req, res) => {
  try {
    const video = await YoutubeVideo.findOne({
      userId: req.user.id,
      videoId: req.params.videoId,
    });

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    try {
      await deleteCollection(getYoutubeCollectionName(video.videoId));
    } catch (error) {
      console.error('YouTube collection delete failed:', error.message);
      return res.status(500).json({
        error: 'We could not delete this video right now.',
      });
    }

    await video.deleteOne();

    return res.json({ success: true });
  } catch (error) {
    console.error('YouTube delete failed:', error.message);
    return res.status(500).json({
      error: 'We could not delete this video right now.',
    });
  }
};
