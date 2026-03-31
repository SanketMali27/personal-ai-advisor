const { runDoctorAgent } = require('../agents/doctorAgent');
const { runTeacherAgent } = require('../agents/teacherAgent');
const { runFinanceAgent } = require('../agents/financeAgent');
const { runLawyerAgent } = require('../agents/lawyerAgent');
const { runRagPipeline } = require('../rag/pipeline');

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

  return runRagPipeline({
    query: userMessage,
    userId,
    domain: agentConfig.domain,
    topK: 5,
    runner: agentConfig.runner,
    runnerInput: {
      userId,
      userMessage,
      history,
    },
  });
}

module.exports = { routeToAgent };
