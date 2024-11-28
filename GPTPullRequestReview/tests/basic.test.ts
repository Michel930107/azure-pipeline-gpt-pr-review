import * as assert from 'assert';
import * as tl from 'azure-pipelines-task-lib/task';

describe('Basic Test Suite', () => {
    it('should load task lib', () => {
        assert.ok(tl, 'Task lib should be loaded');
    });

    it('should require api key', () => {
        let threwError = false;
        try {
            tl.getInput('api_key', true);
        } catch (error: any) {
            threwError = true;
            assert.ok(error.message.includes('api_key'), 'Error should mention api_key');
        }
        assert.ok(threwError, 'Should have thrown an error for missing api_key');
    });
}); 