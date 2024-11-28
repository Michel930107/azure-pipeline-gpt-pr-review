import fetch from "node-fetch";
import { git } from "./git";
import { OpenAI } from "openai";
import { addCommentToPR } from "./pr";
import { Agent } from "https";
import * as tl from "azure-pipelines-task-lib/task";

let allReviews: { fileName: string; review: string }[] = [];

export async function reviewFile(
  targetBranch: string,
  fileName: string,
  httpsAgent: Agent,
  apiKey: string,
  openai: OpenAI | undefined,
  aoiEndpoint: string | undefined
) {
  console.log(`Start reviewing ${fileName} ...`);

  const defaultOpenAIModel = "gpt-4o";
  const patch = await git.diff([targetBranch, "--", fileName]);

  const instructions = `Act as a senior software engineer reviewing a Pull Request. Focus only on significant technical issues and improvements.

  Review priorities:
  1. Critical Issues:
     - Potential bugs, runtime errors, or logic flaws
     - Security vulnerabilities
     - Performance bottlenecks
     - Memory leaks
     - Race conditions

  2. Code Quality:
     - Violation of SOLID principles
     - Breaking changes to public APIs
     - Incorrect error handling
     - Missing validation of critical data
     - Problematic design patterns

  3. Clean Code:
     - Complex code that could be simplified
     - Duplicated logic that should be abstracted
     - Unclear naming that impacts maintainability
     - Missing type safety in critical sections

  Guidelines:
  - Only comment if you find significant issues that need addressing
  - Skip minor stylistic issues or subjective preferences
  - Don't comment on correct code or provide positive feedback
  - Be specific and technical in your feedback
  - Provide clear reasoning for each issue raised
  - Suggest concrete solutions when pointing out problems

  Review the provided patch/diff and focus only on the changed lines.`;

  try {
    let choices: any;

    if (openai) {
      const response = await openai.chat.completions.create({
        model: tl.getInput("model") || defaultOpenAIModel,
        messages: [
          {
            role: "system",
            content: instructions,
          },
          {
            role: "user",
            content: patch,
          },
        ],
        max_tokens: 500,
      });

      choices = response.choices;
    } else if (aoiEndpoint) {
      const request = await fetch(aoiEndpoint, {
        method: "POST",
        headers: { "api-key": `${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          max_tokens: 500,
          messages: [
            {
              role: "user",
              content: `${instructions}\n, patch : ${patch}}`,
            },
          ],
        }),
      });

      const response = await request.json();
      choices = response.choices;
    }

    if (choices && choices.length > 0) {
      const review = choices[0].message?.content as string;
      if (review.trim() !== "") {
        allReviews.push({ fileName, review });
      }
    }

    console.log(`Review of ${fileName} completed.`);
  } catch (error: any) {
    if (error.response) {
      console.log(error.response.status);
      console.log(error.response.data);
    } else {
      console.log(error.message);
    }
  }
}

export async function submitConsolidatedReview(httpsAgent: Agent) {
  if (allReviews.length > 0) {
    const consolidatedComment = [
      "# Pull Request Review Summary\n",
      "I've completed the review of all changes in this pull request. Here are my findings:\n",
    ];

    for (const review of allReviews) {
      consolidatedComment.push(`## ${review.fileName}\n${review.review}\n`);
    }

    consolidatedComment.push(
      "\n## Overall Assessment",
      "The above feedback highlights the key findings from the code review."
    );

    await addCommentToPR("", consolidatedComment.join("\n"), httpsAgent);
    allReviews = []; // Clear the reviews after submitting
  }
}
