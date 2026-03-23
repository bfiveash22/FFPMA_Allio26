import { executeAgentTask } from './server/services/agent-executor';
import { storage } from './server/storage';

async function testAgentTools() {
  try {
    console.log('Creating test task for FORGE...');
    const task = await storage.createAgentTask({
      agentId: 'FORGE',
      division: 'engineering',
      title: 'Automated Tool Belt Test',
      description: 'Please write a new file called "forge_test_output.txt" in the current directory containing the exact text "FORGE CAN USE TOOLS!". You must use your write_file tool to do this.',
      priority: 1
    });

    console.log('Task created with ID:', task.id);
    
    console.log('Executing task...');
    const result = await executeAgentTask(task.id);
    console.log('Execution result:', result);
    
    process.exit(0);
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

testAgentTools();
