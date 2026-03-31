const ChatSession = require('../models/ChatSession');
const ChatMessage = require('../models/ChatMessage');
const { routeToAgent } = require('../../ai-services/orchestrator/agentRouter');

exports.createSession = async (req, res, next) => {
  try {
    const { agentType, title } = req.body;

    const session = await ChatSession.create({
      userId: req.user.id,
      agentType,
      title: title || `${agentType} chat`,
    });

    res.status(201).json(session);
  } catch (err) {
    next(err);
  }
};

exports.getSessions = async (req, res, next) => {
  try {
    const { agentType } = req.query;
    const filter = { userId: req.user.id };

    if (agentType) {
      filter.agentType = agentType;
    }

    const sessions = await ChatSession.find(filter).sort('-createdAt');
    res.json(sessions);
  } catch (err) {
    next(err);
  }
};

exports.getSession = async (req, res, next) => {
  try {
    const session = await ChatSession.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const messages = await ChatMessage.find({ sessionId: session._id }).sort('createdAt');
    const serializedMessages = messages.map((entry) => {
      const message = entry.toObject();

      return {
        ...message,
        type: message.type || 'chat',
        sources: Array.isArray(message.sources) ? message.sources : [],
      };
    });

    res.json({ session, messages: serializedMessages });
  } catch (err) {
    next(err);
  }
};

exports.sendMessage = async (req, res, next) => {
  try {
    const { sessionId, message } = req.body;

    const session = await ChatSession.findOne({
      _id: sessionId,
      userId: req.user.id,
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    await ChatMessage.create({ sessionId, role: 'user', type: 'chat', message });

    const history = await ChatMessage.find({ sessionId })
      .sort('-createdAt')
      .limit(10);

    const historyFormatted = history.reverse().map((entry) => ({
      role: entry.role,
      content: entry.message,
    }));

    const { answer, sources } = await routeToAgent({
      agentType: session.agentType,
      userId: req.user.id,
      userMessage: message,
      history: historyFormatted,
    });

    await ChatMessage.create({
      sessionId,
      role: 'assistant',
      type: 'chat',
      message: answer,
      sources: Array.isArray(sources) ? sources : [],
    });

    if (session.title === `${session.agentType} chat`) {
      session.title = message.slice(0, 60);
      await session.save();
    }

    res.json({ reply: answer, sources: Array.isArray(sources) ? sources : [] });
  } catch (err) {
    next(err);
  }
};

exports.addSummaryMessage = async (req, res, next) => {
  try {
    const { sessionId, message, documentId } = req.body;

    if (!sessionId || !message || !documentId) {
      return res.status(400).json({ error: 'sessionId, documentId, and message are required' });
    }

    const session = await ChatSession.findOne({
      _id: sessionId,
      userId: req.user.id,
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const summaryMessage = await ChatMessage.create({
      sessionId,
      role: 'assistant',
      type: 'summary',
      documentId,
      message,
      sources: [],
    });

    res.status(201).json({ message: summaryMessage });
  } catch (err) {
    next(err);
  }
};
