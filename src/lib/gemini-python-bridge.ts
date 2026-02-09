import { spawn } from 'child_process';
import path from 'path';

/**
 * Calls the Python Gemini analysis script with a prompt and returns the result.
 * @param prompt The prompt to send to Gemini
 * @returns The text response from Gemini
 */
export async function analyzeWithGeminiPython(prompt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const scriptPath = path.resolve(process.cwd(), 'analyze_with_gemini.py');
    const pythonProcess = spawn('python', [scriptPath, prompt], {
      env: { ...process.env },
    });

    let output = '';
    let error = '';

    pythonProcess.stdout.on('data', (data) => {
      output += data.toString();
    });
    pythonProcess.stderr.on('data', (data) => {
      error += data.toString();
    });
    pythonProcess.on('close', (code) => {
      if (code === 0) {
        resolve(output.trim());
      } else {
        reject(new Error(`Python exited with code ${code}: ${error}`));
      }
    });
  });
}
