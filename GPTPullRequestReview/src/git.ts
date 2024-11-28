import simpleGit, { SimpleGit } from 'simple-git';

class Git {
    private git: SimpleGit;

    constructor() {
        this.git = simpleGit();
    }

    async getTargetBranch(): Promise<string> {
        // Get the target branch from the PR
        const branchInfo = await this.git.branch();
        return branchInfo.current;
    }

    async getChangedFiles(targetBranch: string): Promise<string[]> {
        const diff = await this.git.diff(['--name-only', targetBranch]);
        return diff.split('\n').filter(file => file.length > 0);
    }

    async diff(options: string[]): Promise<string> {
        return this.git.diff(options);
    }
}

export const git = new Git();
