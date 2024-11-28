import ma = require('azure-pipelines-task-lib/mock-answer');
import tmrm = require('azure-pipelines-task-lib/mock-run');
import path = require('path');

let taskPath = path.join(__dirname, '..', 'dist', 'src', 'index.js');
let tmr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(taskPath);

// Mock task lib
tmr.registerMock('azure-pipelines-task-lib/task', {
    getInput: (name: string, required?: boolean) => {
        switch (name) {
            case 'api_key': return 'fake-api-key';
            case 'model': return 'gpt-4';
            default: return '';
        }
    },
    getBoolInput: () => false,
    setResult: () => {},
    debug: () => {},
    loc: () => {},
    TaskResult: { Failed: 1, Succeeded: 0 }
});

// Mock git
tmr.registerMock('./git', {
    git: {
        diff: () => Promise.resolve('mock diff'),
        getTargetBranch: () => Promise.resolve('main'),
        getChangedFiles: () => Promise.resolve(['file1.ts'])
    }
});

// Mock OpenAI
tmr.registerMock('openai', {
    default: class {
        constructor() {}
        chat = {
            completions: {
                create: () => Promise.resolve({
                    choices: [{
                        message: { content: 'Test review' }
                    }]
                })
            }
        }
    }
});

tmr.run(); 