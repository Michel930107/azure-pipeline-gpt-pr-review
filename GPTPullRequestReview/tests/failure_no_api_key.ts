import ma = require("azure-pipelines-task-lib/mock-answer");
import tmrm = require("azure-pipelines-task-lib/mock-run");
import path = require("path");
import * as tl from "azure-pipelines-task-lib/task";

let taskPath = path.join(__dirname, "..", "dist", "src", "index.js");
let tmr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(taskPath);

// Mock task lib with minimal implementation
let taskMock = {
    getInput: function(name: string, required?: boolean) {
        if (name === 'api_key') {
            throw new Error('Input required: api_key');
        }
        return '';
    },
    setResult: function(result: tl.TaskResult, message: string) {
        throw new Error(message);
    },
    TaskResult: {
        Failed: 1,
        Succeeded: 0
    }
};

tmr.registerMock('azure-pipelines-task-lib/task', taskMock);

// Run the task
tmr.run();
