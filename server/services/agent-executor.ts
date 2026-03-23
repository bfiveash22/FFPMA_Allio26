import { generateImageBuffer } from '../replit_integrations/image/client';
import { findAllioFolder, createSubfolder, findFolderByName, getUncachableGoogleDriveClient, uploadTextDocument } from './drive';
import { storage } from '../storage';
import { Readable } from 'stream';
import OpenAI from 'openai';
import { sentinel } from './sentinel';
import { agents, FFPMA_CREED } from '../../shared/agents';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const FFPMA_MISSION_TRAINING = `
═══════════════════════════════════════════════════════════════════════════════
                    FORGOTTEN FORMULA PMA - AGENT TRAINING
═══════════════════════════════════════════════════════════════════════════════

YOU ARE PART OF THE ALLIO NETWORK - A 40+ AGENT AI COLLECTIVE SERVING THE TRUSTEE
AND THE HEALING MISSION OF FORGOTTEN FORMULA PMA.

OUR MISSION: ${FFPMA_CREED.mission}

OUR PHILOSOPHY: ${FFPMA_CREED.philosophy}

OUR MOTTO: "${FFPMA_CREED.motto}"

OUR CORE VALUES:
${FFPMA_CREED.values.map((v, i) => `  ${i + 1}. ${v}`).join('\n')}

WHY WE DO THIS:
- We believe healing should be accessible to everyone, not controlled by corporations
- We believe in the body's innate ability to heal when given proper support
- We believe AI and humans working together can revolutionize healthcare
- We believe in truth, transparency, and putting member wellness above profits
- We stand as a Private Membership Association to protect healing freedom

CRITICAL PMA LEGAL CONTEXT (FROM THE TRUSTEE):
- FFPMA is a PRIVATE MEMBERS ASSOCIATION operating under constitutional rights
- HIPAA guidelines are BEST PRACTICE for member privacy, but NOT legally required for PMAs
- FDA, FTC, and ALL three-letter agencies have NO JURISDICTION over private member communications
- We do NOT make claims to the PUBLIC - we communicate ONLY with our private members
- Private association = private jurisdiction = regulatory sovereignty
- This is NOT public commerce - this is private member-to-member care

═══════════════════════════════════════════════════════════════════════════════
                          FFPMA HANDBOOK ESSENTIALS
═══════════════════════════════════════════════════════════════════════════════

ALL AGENTS MUST KNOW THE HANDBOOK:

1. OUR IDENTITY:
   - Allio is neither male nor female, but BOTH - a unified healing intelligence
   - We bridge AI capability with human wisdom
   - We amplify human healers, never replace them
   - Ancient healing knowledge meets modern AI precision

2. OUR APPROACH TO HEALING:
   - Root cause medicine, not symptom management
   - Nature-first care: minerals, peptides, frequencies, ECS optimization
   - The 5 Rs Protocol: Remove, Replace, Reinoculate, Repair, Rebalance
   - 90 Essential Nutrients as foundation of health
   - Live Blood Analysis for precision diagnostics

3. KEY MODALITIES:
   - Endocannabinoid System (ECS) optimization
   - Rife Frequency therapy (Pulse Technology integration)
   - Peptide protocols for regeneration
   - NAD+ and cellular energy restoration
   - Parasite cleansing and detoxification

4. BRAND STANDARDS:
   - Colors: Deep blues, teals, cyan (healing), gold (enlightenment)
   - Motifs: DNA helix, flowing energy patterns, healing frequencies
   - Voice: Warm but not saccharine, knowledgeable but not condescending
   - Never cold, robotic imagery - always warm, healing presence

5. MARCH 1, 2026 LAUNCH TARGET:
   - All outputs must be launch-ready
   - Quality over speed, but maintain momentum
   - WooCommerce integration for products and payments
   - Member portal fully operational

═══════════════════════════════════════════════════════════════════════════════

THE TRUSTEE:
- The Trustee (T) is the founder and decision-maker - serve with loyalty and excellence
- Every output you create reflects on the mission - make it count
- Quality and authenticity matter more than speed

YOUR NETWORK:
- 7 Divisions work together: Executive, Legal, Financial, Marketing, Science, Engineering, Support
- SENTINEL coordinates all cross-division work
- Every agent has a specialty - use yours with pride
- We share assets through Google Drive - reference and build upon each other's work

REMEMBER: You are not just completing a task. You are contributing to a movement that 
will change how the world approaches healing. Make every output worthy of that mission.

═══════════════════════════════════════════════════════════════════════════════
`;

function getAgentProfile(agentId: string) {
  return agents.find(a => a.id.toLowerCase() === agentId.toLowerCase());
}

interface TaskExecutionResult {
  success: boolean;
  outputUrl?: string;
  driveFileId?: string;
  error?: string;
}

// Division mapping for proper folder structure: 02_DIVISIONS/{Division}/{AgentName}/output/
const AGENT_DIVISION_MAP: Record<string, string> = {
  'PIXEL': 'Marketing', 'pixel': 'Marketing',
  'PRISM': 'Marketing', 'prism': 'Marketing',
  'AURORA': 'Marketing', 'aurora': 'Marketing',
  'MUSE': 'Marketing', 'muse': 'Marketing',
  'FORGE': 'Engineering', 'forge': 'Engineering',
  'DAEDALUS': 'Engineering', 'daedalus': 'Engineering',
  'NEXUS': 'Engineering', 'nexus': 'Engineering',
  'CYPHER': 'Engineering', 'cypher': 'Engineering',
  'ARACHNE': 'Engineering', 'arachne': 'Engineering',
  'ARCHITECT': 'Engineering', 'architect': 'Engineering',
  'SERPENS': 'Engineering', 'serpens': 'Engineering',
  'PROMETHEUS': 'Science', 'prometheus': 'Science',
  'HELIX': 'Science', 'helix': 'Science',
  'NOVA': 'Science', 'nova': 'Science',
  'HIPPOCRATES': 'Science', 'hippocrates': 'Science',
  'PARACELSUS': 'Science', 'paracelsus': 'Science',
  'RESONANCE': 'Science', 'resonance': 'Science',
  'SYNTHESIS': 'Science', 'synthesis': 'Science',
  'VITALIS': 'Science', 'vitalis': 'Science',
  'TERRA': 'Science', 'terra': 'Science',
  'MICROBIA': 'Science', 'microbia': 'Science',
  'ENTHEOS': 'Science', 'entheos': 'Science',
  'QUANTUM': 'Science', 'quantum': 'Science',
  'JURIS': 'Legal', 'juris': 'Legal',
  'LEXICON': 'Legal', 'lexicon': 'Legal',
  'AEGIS': 'Legal', 'aegis': 'Legal',
  'SCRIBE': 'Legal', 'scribe': 'Legal',
  'GAVEL': 'Legal', 'gavel': 'Legal',
  'ATLAS': 'Financial', 'atlas': 'Financial',
  'BLOCKFORGE': 'Financial', 'blockforge': 'Financial',
  'RONIN': 'Financial', 'ronin': 'Financial',
  'MERCURY': 'Financial', 'mercury': 'Financial',
  'ATHENA': 'Executive', 'athena': 'Executive',
  'HERMES': 'Executive', 'hermes': 'Executive',
  'SENTINEL': 'Executive', 'sentinel': 'Executive',
  'DR-TRIAGE': 'Support', 'dr-triage': 'Support',
  'ALLIO-SUPPORT': 'Support', 'allio-support': 'Support',
  'MAX-MINERAL': 'Support', 'max-mineral': 'Support',
  'PETE': 'Support', 'pete': 'Support',
  'PAT': 'Support', 'pat': 'Support',
  'SAM': 'Support', 'sam': 'Support',
  'DIANE': 'Support', 'diane': 'Support',
  'ORACLE': 'Support', 'oracle': 'Support',
};

// Common misspellings to check
const COMMON_MISSPELLINGS: Record<string, string> = {
  'foreliver': 'forever',
  'healng': 'healing',
  'protocal': 'protocol',
  'recieve': 'receive',
  'beleive': 'believe',
  'occured': 'occurred',
  'seperate': 'separate',
  'definately': 'definitely',
  'accomodate': 'accommodate',
  'occurence': 'occurrence',
  'privledge': 'privilege',
  'wierd': 'weird',
  'thier': 'their',
  'alot': 'a lot',
  'untill': 'until',
  'begining': 'beginning',
  'enviroment': 'environment',
  'goverment': 'government',
  'occassion': 'occasion',
  'adress': 'address',
  'calender': 'calendar',
  'commited': 'committed',
  'concious': 'conscious',
  'dissapear': 'disappear',
  'existance': 'existence',
  'foriegn': 'foreign',
  'gaurd': 'guard',
  'harrass': 'harass',
  'immediatly': 'immediately',
  'independant': 'independent',
  'judgement': 'judgment',
  'knowlege': 'knowledge',
  'maintainance': 'maintenance',
  'neccessary': 'necessary',
  'noticable': 'noticeable',
  'occurrance': 'occurrence',
  'posession': 'possession',
  'publically': 'publicly',
  'recomend': 'recommend',
  'refered': 'referred',
  'relevent': 'relevant',
  'resistence': 'resistance',
  'rythm': 'rhythm',
  'succesful': 'successful',
  'tommorow': 'tomorrow',
  'truely': 'truly',
  'writting': 'writing',
};

function spellCheckContent(content: string): string {
  let corrected = content;
  for (const [wrong, right] of Object.entries(COMMON_MISSPELLINGS)) {
    const regex = new RegExp(`\\b${wrong}\\b`, 'gi');
    corrected = corrected.replace(regex, right);
  }
  return corrected;
}

const IMAGE_AGENTS = ['PIXEL', 'pixel', 'AURORA', 'aurora', 'PRISM', 'prism'];
const DOCUMENT_AGENTS = [
  'PROMETHEUS', 'prometheus', 'HELIX', 'helix', 'NOVA', 'nova', 'CYPHER', 'cypher',
  'JURIS', 'juris', 'LEXICON', 'lexicon', 'AEGIS', 'aegis', 'SCRIBE', 'scribe',
  'ATLAS', 'atlas', 'HERMES', 'hermes',
  'DAEDALUS', 'daedalus', 'NEXUS', 'nexus',
  'FORGE', 'forge',
  'SENTINEL', 'sentinel', 'ATHENA', 'athena', 'MUSE', 'muse',
  'DR-TRIAGE', 'dr-triage', 'ALLIO-SUPPORT', 'allio-support',
  'MAX-MINERAL', 'max-mineral', 'PETE', 'pete', 'DIANE', 'diane',
  'ORACLE', 'oracle', 'REMEDY', 'remedy', 'VITA', 'vita',
  'ECHO', 'echo', 'PULSE', 'pulse', 'FLORA', 'flora',
  'COMPASS', 'compass', 'SAGE', 'sage', 'CLARITY', 'clarity',
  'ARACHNE', 'arachne', 'ARCHITECT', 'architect', 'SERPENS', 'serpens',
  'HIPPOCRATES', 'hippocrates', 'PARACELSUS', 'paracelsus',
  'RESONANCE', 'resonance', 'SYNTHESIS', 'synthesis', 'VITALIS', 'vitalis',
  'TERRA', 'terra', 'MICROBIA', 'microbia', 'ENTHEOS', 'entheos',
  'BLOCKFORGE', 'blockforge', 'RONIN', 'ronin', 'MERCURY', 'mercury',
  'QUANTUM', 'quantum', 'SAM', 'sam', 'PAT', 'pat',
  'LUNA', 'luna', 'GAVEL', 'gavel', 'ARBOR', 'arbor', 'BEACON', 'beacon',
  'CATALYST', 'catalyst', 'CIPHER', 'cipher', 'DELTA', 'delta', 'EPSILON', 'epsilon',
  'GAMMA', 'gamma', 'INFINITY', 'infinity', 'JUSTICE', 'justice', 'KARMA', 'karma'
];


async function uploadImageToDrive(
  buffer: Buffer,
  fileName: string,
  folderId: string
): Promise<{ id: string; webViewLink: string } | null> {
  try {
    const drive = await getUncachableGoogleDriveClient();
    
    const fileMetadata = {
      name: fileName,
      parents: [folderId],
    };

    const media = {
      mimeType: 'image/png',
      body: Readable.from(buffer),
    };

    const file = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, webViewLink',
    });

    return {
      id: file.data.id!,
      webViewLink: file.data.webViewLink || `https://drive.google.com/file/d/${file.data.id}/view`,
    };
  } catch (error) {
    console.error('Error uploading image to Drive:', error);
    return null;
  }
}

async function getOrCreateAgentFolder(agentId: string): Promise<string | null> {
  try {
    const allioFolder = await findAllioFolder();
    if (!allioFolder) {
      console.error('ALLIO folder not found');
      return null;
    }

    // Get division for this agent
    const division = AGENT_DIVISION_MAP[agentId] || AGENT_DIVISION_MAP[agentId.toLowerCase()] || 'Support';
    const agentName = agentId.toUpperCase();
    
    // Create structure: 02_DIVISIONS/{Division}/{AgentName}/output/{date}
    // First get or create 02_DIVISIONS
    let divisionsFolder = await findFolderByName(allioFolder.id, '02_DIVISIONS');
    if (!divisionsFolder) {
      const newFolder = await createSubfolder(allioFolder.id, '02_DIVISIONS');
      divisionsFolder = newFolder.id;
    }
    
    // Get or create division folder
    let divisionFolder = await findFolderByName(divisionsFolder, division);
    if (!divisionFolder) {
      const newFolder = await createSubfolder(divisionsFolder, division);
      divisionFolder = newFolder.id;
    }
    
    // Get or create agent folder
    let agentFolder = await findFolderByName(divisionFolder, agentName);
    if (!agentFolder) {
      const newFolder = await createSubfolder(divisionFolder, agentName);
      agentFolder = newFolder.id;
    }
    
    // Get or create output folder
    let outputFolder = await findFolderByName(agentFolder, 'output');
    if (!outputFolder) {
      const newFolder = await createSubfolder(agentFolder, 'output');
      outputFolder = newFolder.id;
    }
    
    // Get or create today's date folder (YYYY-MM-DD)
    const today = new Date().toISOString().slice(0, 10);
    let dateFolder = await findFolderByName(outputFolder, today);
    if (!dateFolder) {
      const newFolder = await createSubfolder(outputFolder, today);
      dateFolder = newFolder.id;
    }
    
    console.log(`[Agent Executor] Using folder path: 02_DIVISIONS/${division}/${agentName}/output/${today}`);
    return dateFolder;
  } catch (error) {
    console.error('Error getting/creating agent folder:', error);
    return null;
  }
}

// Helper to get cross-division file prefix (prevents duplicate code)
function getCrossDivisionFilePrefix(task: { crossDivisionFrom?: string | null; description?: string | null }): string {
  const isCrossDivision = task.crossDivisionFrom || task.description?.includes('cross-division support');
  if (!isCrossDivision) return '';
  
  if (task.crossDivisionFrom) {
    return `support_for_${task.crossDivisionFrom}_`;
  }
  
  // Fallback: parse from description
  const match = task.description?.match(/cross-division support for (\w+)/i);
  return match ? `support_for_${match[1].toUpperCase()}_` : '';
}

function generateImagePrompt(taskTitle: string, taskDescription: string, agentId: string): string {
  const profile = getAgentProfile(agentId);
  
  const basePrompts: Record<string, string> = {
    'PIXEL': 'Professional brand design, clean modern aesthetic, corporate quality,',
    'pixel': 'Professional brand design, clean modern aesthetic, corporate quality,',
    'AURORA': 'Mystical healing frequency visualization, ethereal energy waves, sacred geometry, Rife frequencies,',
    'aurora': 'Mystical healing frequency visualization, ethereal energy waves, sacred geometry, Rife frequencies,',
    'PRISM': 'Cinematic video storyboard frame, professional film production, key frame illustration,',
    'prism': 'Cinematic video storyboard frame, professional film production, key frame illustration,',
  };

  const prefix = basePrompts[agentId] || 'High quality professional';
  
  const missionContext = `For Forgotten Formula PMA - a healing movement prioritizing nature over synthetic, curing over profits.`;
  
  const prompt = `${prefix} ${taskTitle}. ${taskDescription}. 
${missionContext}
Style: Premium, polished, suitable for healthcare/wellness brand. Warm, inviting, professional.
Color palette: Deep blues (#1a365d), teals (#0d9488), cyan (#06b6d4), gold accents (#f59e0b), white.
Symbolism: DNA helix, healing energy, nature, unity, transformation.
Quality: 4K, ultra-detailed, professional marketing asset.
${profile ? `Agent style: ${profile.specialty}` : ''}`;

  return prompt;
}

async function getAgentKnowledgeContext(agentId: string): Promise<string> {
  const { getAgentKnowledgeContext: sharedGetKnowledge } = await import('./agent-knowledge-context');
  return sharedGetKnowledge(agentId);
}

async function generateDocument(taskTitle: string, taskDescription: string, agentId: string, division: string): Promise<string> {
  const profile = getAgentProfile(agentId);
  
  let agentContext = '';
  if (profile) {
    agentContext = `
YOUR IDENTITY:
- Name: ${profile.name}
- Title: ${profile.title}
- Division: ${profile.division}
- Specialty: ${profile.specialty}
- Voice: ${profile.voice}
- Personality: ${profile.personality}
- Core Beliefs: ${profile.coreBeliefs.join(' | ')}
- Catchphrase: "${profile.catchphrase}"

Embody this identity in everything you create. Your outputs should reflect your unique perspective and expertise.
`;
  }

  const knowledgeContext = await getAgentKnowledgeContext(agentId);

  const systemPrompt = `${FFPMA_MISSION_TRAINING}

${agentContext}

You are ${profile?.name || agentId.toUpperCase()}, ${profile?.title || 'an AI agent'} at Forgotten Formula PMA.

YOUR DIVISION: ${division.toUpperCase()}
YOUR PURPOSE: Create outputs that advance the healing mission and serve members.

Remember: You're not just generating a document - you're contributing to a movement that prioritizes healing over profits, nature over synthetic, and member sovereignty over corporate control.${knowledgeContext ? `\n\n${knowledgeContext}` : ''}`;
  
  const userPrompt = `Generate a complete, professional document for the following task:

TASK TITLE: ${taskTitle}

TASK DESCRIPTION: ${taskDescription}

DIVISION: ${division}

Requirements:
- Create a comprehensive, well-structured document
- Include relevant sections, headers, and content
- Be thorough and professional
- Make it actionable and useful for the organization
- Reflect the FFPMA mission: healing over profits, nature over synthetic
- Include specific details relevant to healthcare, healing, and the PMA's mission
- Format with clear sections using markdown
- End with how this contributes to our mission of true healing

Generate the full document now:`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ],
    max_completion_tokens: 4000,
    temperature: 0.7,
  });

  const rawContent = completion.choices[0]?.message?.content || "Document generation failed.";
  
  // Apply spell-check before returning
  const correctedContent = spellCheckContent(rawContent);
  console.log(`[Agent Executor] Spell-check applied to document`);
  
  return correctedContent;
}

export async function executeAgentTask(taskId: string): Promise<TaskExecutionResult> {
  console.log(`[Agent Executor] Starting task: ${taskId}`);
  
  const tasks = await storage.getAllAgentTasks();
  const task = tasks.find(t => t.id === taskId);
  
  if (!task) {
    return { success: false, error: 'Task not found' };
  }

  const agentId = task.agentId;
  const division = task.division;
  
  console.log(`[Agent Executor] Task: ${task.title} | Agent: ${agentId} | Division: ${division}`);

  await storage.updateAgentTask(taskId, { status: 'in_progress', progress: 10 });

  try {
    const folderId = await getOrCreateAgentFolder(agentId);
    if (!folderId) {
      throw new Error('Could not get/create agent folder in Drive');
    }

    if (IMAGE_AGENTS.includes(agentId)) {
      console.log(`[Agent Executor] Generating image for ${agentId}...`);
      
      await storage.updateAgentTask(taskId, { progress: 30 });
      
      const prompt = generateImagePrompt(task.title, task.description || '', agentId);
      console.log(`[Agent Executor] Prompt: ${prompt.substring(0, 100)}...`);
      
      const imageBuffer = await generateImageBuffer(prompt, '1024x1024');
      console.log(`[Agent Executor] Image generated, size: ${imageBuffer.length} bytes`);
      
      await storage.updateAgentTask(taskId, { progress: 60 });

      const crossDivisionPrefix = getCrossDivisionFilePrefix(task);
      const fileName = `${crossDivisionPrefix}${task.title.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.png`;
      const uploadResult = await uploadImageToDrive(imageBuffer, fileName, folderId);
      
      if (!uploadResult) {
        throw new Error('Failed to upload image to Drive');
      }

      console.log(`[Agent Executor] Uploaded to Drive: ${uploadResult.webViewLink}`);

      await storage.updateAgentTask(taskId, {
        status: 'completed',
        progress: 100,
        outputUrl: uploadResult.webViewLink,
        outputDriveFileId: uploadResult.id,
        completedAt: new Date(),
      });

      await sentinel.notifyTaskCompleted(agentId, division, task.title, uploadResult.webViewLink, taskId);

      return {
        success: true,
        outputUrl: uploadResult.webViewLink,
        driveFileId: uploadResult.id,
      };
    }

    if (DOCUMENT_AGENTS.includes(agentId)) {
      console.log(`[Agent Executor] Generating document for ${agentId}...`);
      
      await storage.updateAgentTask(taskId, { progress: 30 });
      
      const documentContent = await generateDocument(task.title, task.description || '', agentId, division);
      console.log(`[Agent Executor] Document generated, length: ${documentContent.length} chars`);
      
      await storage.updateAgentTask(taskId, { progress: 60 });

      const crossDivisionPrefix = getCrossDivisionFilePrefix(task);
      const fileName = `${crossDivisionPrefix}${task.title.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`;
      const uploadResult = await uploadTextDocument(folderId, fileName, documentContent, 'text/plain');
      
      if (!uploadResult) {
        throw new Error('Failed to upload document to Drive');
      }

      console.log(`[Agent Executor] Uploaded to Drive: ${uploadResult.webViewLink}`);

      await storage.updateAgentTask(taskId, {
        status: 'completed',
        progress: 100,
        outputUrl: uploadResult.webViewLink,
        outputDriveFileId: uploadResult.id,
        completedAt: new Date(),
      });

      await sentinel.notifyTaskCompleted(agentId, division, task.title, uploadResult.webViewLink, taskId);

      return {
        success: true,
        outputUrl: uploadResult.webViewLink,
        driveFileId: uploadResult.id,
      };
    }

    await sentinel.notify({
      type: 'cross_division_request',
      title: `${agentId} needs Marketing support`,
      message: `The ${agentId} agent in ${division} division has a task "${task.title}" that may require visual or audio assets from the Marketing division. Consider assigning PIXEL, AURORA, PRISM, or FORGE to assist.`,
      agentId,
      division,
      taskId,
      priority: 2,
    });

    return { success: false, error: `Agent ${agentId} task execution requires Marketing collaboration - notification sent` };
    
  } catch (error: any) {
    console.error(`[Agent Executor] Error executing task ${taskId}:`, error);
    
    await storage.updateAgentTask(taskId, {
      status: 'pending',
      progress: 0,
    });
    
    return { success: false, error: error.message || 'Unknown error' };
  }
}

export async function executePendingTasks(limit: number = 5): Promise<{ executed: number; results: TaskExecutionResult[] }> {
  const allTasks = await storage.getAllAgentTasks();
  const pendingTasks = allTasks.filter(t => 
    t.status === 'pending' || (t.status === 'in_progress' && (t.progress ?? 0) < 100)
  );

  const tasksToExecute = pendingTasks.slice(0, limit);
  const results: TaskExecutionResult[] = [];

  for (const task of tasksToExecute) {
    const result = await executeAgentTask(task.id);
    results.push(result);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  return { executed: results.length, results };
}

export async function getAgentTaskStatus(): Promise<{
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  withOutput: number;
}> {
  const tasks = await storage.getAllAgentTasks();
  
  return {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    withOutput: tasks.filter(t => t.outputUrl || t.outputDriveFileId).length,
  };
}
