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
    res.json({ session, messages });
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

    await ChatMessage.create({ sessionId, role: 'user', message });

    const history = await ChatMessage.find({ sessionId })
      .sort('-createdAt')
      .limit(10);

    const historyFormatted = history.reverse().map((entry) => ({
      role: entry.role,
      content: entry.message,
    }));

    const aiResponse = await routeToAgent({
      agentType: session.agentType,
      userId: req.user.id,
      userMessage: message,
      history: historyFormatted,
    });

    const assistantMsg = await ChatMessage.create({
      sessionId,
      role: 'assistant',
      message: aiResponse,
    });

    if (session.title === `${session.agentType} chat`) {
      session.title = message.slice(0, 60);
      await session.save();
    }

    res.json({ message: assistantMsg });
  } catch (err) {
    next(err);
  }
};
