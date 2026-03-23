import { Express, Request, Response } from 'express';
import { orchestrator } from './services/sentinel-orchestrator';
import { AGENT_DIVISIONS, Division } from './services/sentinel';
import { requireRole } from './middleware/auth';
import { delegateToOpenClaw } from './services/openclaw-delegate';

const adminOnly = requireRole('admin');

export function registerSentinelRoutes(app: Express): void {
  app.post('/api/sentinel/initialize', adminOnly, async (_req: Request, res: Response) => {
    try {
      const result = await orchestrator.initialize();
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/sentinel/status', adminOnly, async (_req: Request, res: Response) => {
    try {
      const status = await orchestrator.getNetworkStatus();
      res.json(status);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/sentinel/agents', adminOnly, async (_req: Request, res: Response) => {
    try {
      const agents = await orchestrator.getAllAgents();
      res.json({ agents, count: agents.length });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/sentinel/agents/:agentId', adminOnly, async (req: Request, res: Response) => {
    try {
      const agent = await orchestrator.getAgent(req.params.agentId);
      if (!agent) {
        return res.status(404).json({ error: 'Agent not found' });
      }
      res.json(agent);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/sentinel/divisions', adminOnly, async (_req: Request, res: Response) => {
    try {
      const divisions = Object.entries(AGENT_DIVISIONS).map(([key, info]) => ({
        id: key,
        ...info,
      }));
      res.json({ divisions });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/sentinel/divisions/:division', adminOnly, async (req: Request, res: Response) => {
    try {
      const division = req.params.division as Division;
      if (!AGENT_DIVISIONS[division]) {
        return res.status(404).json({ error: 'Division not found' });
      }
      const status = await orchestrator.getDivisionStatus(division);
      res.json(status);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/sentinel/tasks', adminOnly, async (req: Request, res: Response) => {
    try {
      const { agentId, title, description, priority, evidenceType, dueDate } = req.body;
      if (!agentId || !title || !description) {
        return res.status(400).json({ error: 'agentId, title, and description are required' });
      }
      const task = await orchestrator.assignTask({
        agentId,
        title,
        description,
        priority,
        evidenceType,
        dueDate: dueDate ? new Date(dueDate) : undefined,
      });
      res.json(task);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/sentinel/tasks', adminOnly, async (_req: Request, res: Response) => {
    try {
      const tasks = await orchestrator.getPendingTasks();
      res.json({ tasks, count: tasks.length });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/sentinel/tasks/:agentId', adminOnly, async (req: Request, res: Response) => {
    try {
      const tasks = await orchestrator.getTasksByAgent(req.params.agentId);
      res.json({ tasks, count: tasks.length });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/sentinel/tasks/:taskId/complete', adminOnly, async (req: Request, res: Response) => {
    try {
      const { outputUrl } = req.body;
      if (!outputUrl) {
        return res.status(400).json({ error: 'outputUrl (Drive link) is required for Integrity Mandate compliance' });
      }
      const success = await orchestrator.completeTask(req.params.taskId, outputUrl);
      if (!success) {
        return res.status(400).json({ error: 'Task completion failed - evidence not verified' });
      }
      res.json({ success: true, message: 'Task completed with verified evidence' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/sentinel/tasks/:taskId/verify', adminOnly, async (req: Request, res: Response) => {
    try {
      const { evidenceUrl, notes } = req.body;
      const verified = await orchestrator.verifyTaskEvidence(req.params.taskId, evidenceUrl, notes);
      res.json({ verified, message: verified ? 'Evidence verified' : 'Evidence verification failed' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/sentinel/cross-division', adminOnly, async (req: Request, res: Response) => {
    try {
      const { fromDivision, toDivision, title, description, priority } = req.body;
      if (!fromDivision || !toDivision || !title || !description) {
        return res.status(400).json({ error: 'fromDivision, toDivision, title, and description are required' });
      }
      const task = await orchestrator.createCrossDivisionTask({
        fromDivision,
        toDivision,
        title,
        description,
        priority,
      });
      res.json(task);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/sentinel/agent/:agentId/query', adminOnly, async (req: Request, res: Response) => {
    try {
      const { query, context } = req.body;
      if (!query) {
        return res.status(400).json({ error: 'query is required' });
      }
      const result = await orchestrator.routeToAIModel(req.params.agentId, query, context);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/sentinel/contract-review', adminOnly, async (_req: Request, res: Response) => {
    try {
      const { isReviewInProgress, initiateContractReview } = await import('./services/contract-review');
      if (isReviewInProgress()) {
        return res.status(409).json({ error: 'A contract review is already in progress' });
      }
      const reviewPromise = initiateContractReview();
      res.json({ status: 'initiated', message: 'Contract V4 legal review initiated. SENTINEL coordinating JURIS, LEXICON, AEGIS, SCRIBE.' });
      reviewPromise.catch(err => console.error('[SENTINEL] Contract review error:', err));
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/sentinel/contract-review', adminOnly, async (_req: Request, res: Response) => {
    try {
      const { getLatestReview, isReviewInProgress } = await import('./services/contract-review');
      const review = await getLatestReview();
      res.json({
        review,
        inProgress: isReviewInProgress(),
        available: review !== null
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/sentinel/openclaw-delegate', adminOnly, async (req: Request, res: Response) => {
    try {
      const { message, target } = req.body;
      if (!message) {
        return res.status(400).json({ error: 'message is required' });
      }
      const result = await delegateToOpenClaw(message, target);
      if (result.success) {
        res.json({ success: true, message: 'Message successfully delegated to OpenClaw', output: result.output });
      } else {
        res.status(500).json({ error: 'Failed to delegate to OpenClaw', details: result.output });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/sentinel/openclaw-queue', adminOnly, async (_req: Request, res: Response) => {
    try {
      const { db } = await import('./db');
      const { openclawMessages } = await import('../shared/schema');
      const { desc } = await import('drizzle-orm');
      
      const queue = await db.select()
        .from(openclawMessages)
        .orderBy(desc(openclawMessages.createdAt))
        .limit(50);
        
      res.json(queue);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  console.log('[SENTINEL] Orchestrator routes registered (admin-protected)');
}
