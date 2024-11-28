import ma = require('azure-pipelines-task-lib/mock-answer');
import tmrm = require('azure-pipelines-task-lib/mock-run');
import path = require('path');

let taskPath = path.join(__dirname, '..', 'dist', 'src', 'index.js');
let tmr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(taskPath);

// Set inputs
tmr.setInput('api_key', 'fake-api-key');
tmr.setInput('model', 'gpt-4');
tmr.setInput('context_type', 'general');

// Mock git diff response
tmr.registerMock('./git', {
    diff: async () => 'mock diff content',
    getTargetBranch: async () => 'main',
    getChangedFiles: async () => ['file1.ts', 'file2.ts']
});

// Mock OpenAI response
tmr.registerMock('openai', {
    OpenAI: class {
        constructor() {}
        chat = {
            completions: {
                create: async () => ({
                    choices: [{
                        message: {
                            content: 'Test review comment'
                        }
                    }]
                })
            }
        }
    }
});

tmr.run(); 