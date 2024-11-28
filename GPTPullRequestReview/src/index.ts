import * as tl from "azure-pipelines-task-lib/task";
import { OpenAI } from 'openai';
import { reviewFile, submitConsolidatedReview } from './review';
import { deleteExistingComments } from './pr';
import { git } from './git';
import { Agent } from 'https';
import https from 'https';

async function run() {
    try {
        const apiKey = tl.getInput('api_key', true) as string;
        const aoiEndpoint = tl.getInput('aoi_endpoint', false);
        const supportSelfSignedCertificate = tl.getBoolInput('support_self_signed_certificate', false);

        const httpsAgent = new Agent({
            rejectUnauthorized: !supportSelfSignedCertificate
        });

        let openai: OpenAI | undefined;
        if (!aoiEndpoint) {
            openai = new OpenAI({ apiKey });
        }

        await deleteExistingComments(httpsAgent);

        const targetBranch = await git.getTargetBranch();
        const changedFiles = await git.getChangedFiles(targetBranch);

        for (const file of changedFiles) {
            await reviewFile(targetBranch, file, httpsAgent, apiKey, openai, aoiEndpoint);
        }

        // Submit consolidated review after all files are reviewed
        await submitConsolidatedReview(httpsAgent);

    } catch (err: any) {
        tl.setResult(tl.TaskResult.Failed, err.message);
    }
}

run();