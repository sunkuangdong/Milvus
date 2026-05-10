import { tool } from '@langchain/core/tools';
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { z } from 'zod';

// 1. Read file tool
const readFileTool = tool(
  async ({ filePath }) => {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      console.log(`  [Tool Call] read_file("${filePath}") - Successfully read ${content.length} bytes`);
      return `File content:\n${content}`;
    } catch (error) {
      console.log(`  [Tool Call] read_file("${filePath}") - Error: ${error.message}`);
      return `Failed to read file: ${error.message}`;
    }
  },
  {
    name: 'read_file',
    description: 'Read file content from the given path',
    schema: z.object({
      filePath: z.string().describe('File path'),
    }),
  }
);

// 2. Write file tool
const writeFileTool = tool(
  async ({ filePath, content }) => {
    try {
      const dir = path.dirname(filePath);
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, content, 'utf-8');
      console.log(`  [Tool Call] write_file("${filePath}") - Successfully wrote ${content.length} bytes`);
      return `File written successfully: ${filePath}`;
    } catch (error) {
      console.log(`  [Tool Call] write_file("${filePath}") - Error: ${error.message}`);
      return `Failed to write file: ${error.message}`;
    }
  },
  {
    name: 'write_file',
    description: 'Write content to the given file path and auto-create directories',
    schema: z.object({
      filePath: z.string().describe('File path'),
      content: z.string().describe('Content to write'),
    }),
  }
);

// 3. Execute command tool (with real-time output)
// Note: echo may behave differently on Windows; set shell to powershell if needed.
const executeCommandTool = tool(
  async ({ command, workingDirectory }) => {
    const cwd = workingDirectory || process.cwd();
    console.log(`  [Tool Call] execute_command("${command}")${workingDirectory ? ` - Working directory: ${workingDirectory}` : ''}`);

    return new Promise((resolve, reject) => {
      // Parse command and arguments
      const [cmd, ...args] = command.split(' ');

      const child = spawn(cmd, args, {
        cwd,
        stdio: 'inherit', // Stream output to console in real time
        shell: true,
      });

      let errorMsg = '';

      child.on('error', (error) => {
        errorMsg = error.message;
      });

      child.on('close', (code) => {
        if (code === 0) {
          console.log(`  [Tool Call] execute_command("${command}") - Succeeded`);
          const cwdInfo = workingDirectory
            ? `\n\nImportant: Command succeeded in "${workingDirectory}". If you need to continue in this directory, pass workingDirectory: "${workingDirectory}" instead of using cd.`
            : '';
          resolve(`Command succeeded: ${command}${cwdInfo}`);
        } else {
          console.log(`  [Tool Call] execute_command("${command}") - Failed, exit code: ${code}`);
          resolve(`Command failed, exit code: ${code}${errorMsg ? '\nError: ' + errorMsg : ''}`);
        }
      });
    });
  },
  {
    name: 'execute_command',
    description: 'Execute system command with optional working directory and live output',
    schema: z.object({
      command: z.string().describe('Command to execute'),
      workingDirectory: z.string().optional().describe('Working directory (recommended)'),
    }),
  }
);

// 4. List directory tool
const listDirectoryTool = tool(
  async ({ directoryPath }) => {
    try {
      const files = await fs.readdir(directoryPath);
      console.log(`  [Tool Call] list_directory("${directoryPath}") - Found ${files.length} items`);
      return `Directory contents:\n${files.map(f => `- ${f}`).join('\n')}`;
    } catch (error) {
      console.log(`  [Tool Call] list_directory("${directoryPath}") - Error: ${error.message}`);
      return `Failed to list directory: ${error.message}`;
    }
  },
  {
    name: 'list_directory',
    description: 'List files and folders in the given directory',
    schema: z.object({
      directoryPath: z.string().describe('Directory path'),
    }),
  }
);

export { readFileTool, writeFileTool, executeCommandTool, listDirectoryTool };