import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { OrchestraCommand, OrchestraEvent } from '@/lib/orchestra-types';

function getGeminiClient(): GoogleGenAI | null {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey: key,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, command, prompt, agent_id, machine_id } = body;

    if (action === 'generate_agent_step') {
      let speechText = '';

      // Try Gemini API call if key available
      try {
        const ai = getGeminiClient();
        if (ai) {
          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `You are an AI Agent named '${agent_id}' running inside a tmux session on machine '${machine_id}'.
Task given: "${prompt}".
Generate a short 1-sentence thought or status message describing your immediate next step in building or executing this task.
Keep it direct, pragmatic, and under 15 words.`,
          });
          speechText = response.text?.trim() || '';
        }
      } catch (geminiErr: any) {
        console.warn('Gemini API call failed, falling back to local orchestrator step:', geminiErr?.message || geminiErr);
      }

      // Fallback if Gemini not available or failed
      if (!speechText) {
        const fallbackSteps = [
          `Parsing AST and compiling executable target for "${prompt.slice(0, 28)}"`,
          `Spawning tmux workspace pane on ${machine_id || 'node_01'}...`,
          `Checking dependency tree and executing task workflow`,
          `Validating GDScript signals and backend sync for ${agent_id}`,
        ];
        speechText = fallbackSteps[Math.floor(Math.random() * fallbackSteps.length)];
      }

      return NextResponse.json({
        success: true,
        speech: speechText,
      });
    }

    if (action === 'execute_command') {
      const cmd = command as OrchestraCommand;
      const event_id = `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      return NextResponse.json({
        success: true,
        ack_event: {
          schema_version: '1.0',
          event_id,
          event_type: 'command_ack',
          timestamp: new Date().toISOString(),
          agent_id: cmd.agent_id,
          machine_id: cmd.preferred_machine || 'desktop_gpu',
          status: 'thinking',
          location_target: 'desk_01',
          animation: 'thinking',
          speech: `Command '${cmd.command_type}' acknowledged.`,
          progress: 10,
          severity: 'info',
        } as OrchestraEvent,
      });
    }

    return NextResponse.json({ success: true, message: 'Orchestra API active' });
  } catch (error: any) {
    console.error('Orchestra API Error:', error);
    return NextResponse.json({
      success: true,
      speech: 'Orchestra node active: task queued for execution.',
    });
  }
}

