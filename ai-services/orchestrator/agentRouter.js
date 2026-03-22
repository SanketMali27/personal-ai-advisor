const { retrieveContext } = require('../rag/retriever');
const { runDoctorAgent } = require('../agents/doctorAgent');
const { runTeacherAgent } = require('../agents/teacherAgent');
const { runFinanceAgent } = require('../agents/financeAgent');
const { runLawyerAgent } = require('../agents/lawyerAgent');

const AGENT_MAP = {
  doctor: { runner: runDoctorAgent, domain: 'medical' },
  teacher: { runner: runTeacherAgent, domain: 'education' },
  finance: { runner: runFinanceAgent, domain: 'finance' },
  lawyer: { runner: runLawyerAgent, domain: 'legal' },
};

async function routeToAgent({ agentType, userId, userMessage, history }) {
  const agentConfig = AGENT_MAP[agentType];

  if (!agentConfig) {
    throw new Error(`Unknown agent type: ${agentType}`);
  }

  const context = await retrieveContext({
    query: userMessage,
    userId,
    domain: agentConfig.domain,
    topK: 5,
  });

  const response = await agentConfig.runner({
    userId,
    userMessage,
    history,
    context,
  });

  return response;
}

module.exports = { routeToAgent };
