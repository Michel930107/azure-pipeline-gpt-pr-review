import fetch from "node-fetch";
import { git } from "./git";
import OpenAI from "openai";
import { addCommentToPR } from "./pr";
import { Agent } from "https";
import * as tl from "azure-pipelines-task-lib/task";

let allReviews: { fileName: string; review: string }[] = [];

function getReviewInstructions(
  contextType: string,
  customContext: string
): string {
  const contextInstructions = {
    comprehensive: `
      Review priorities:
      1. Critical Technical Issues:
         - High-impact bugs and logic flaws
         - Major security vulnerabilities
         - Significant performance bottlenecks
         - Critical architectural concerns
         - Breaking API changes

      2. Essential Best Practices:
         - Core SOLID principle violations
         - Critical security patterns
         - Key performance optimizations
         - Important architectural decisions
         - Crucial error handling

      3. Code Quality Fundamentals:
         - Major maintainability issues
         - Significant technical debt
         - Critical design pattern problems
         - Important type safety concerns
         - Key validation gaps
    `,
    general: `
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
    `,
    security: `
      Review priorities:
      1. Security Vulnerabilities:
         - Input validation and sanitization
         - Authentication and authorization
         - Data exposure risks
         - Injection vulnerabilities (SQL, XSS, etc.)
         - Secure communication

      2. Security Best Practices:
         - Secure credential handling
         - Proper encryption usage
         - Session management
         - Access control implementation
         - Security headers and configurations

      3. Security Code Patterns:
         - Secure coding practices
         - Security-related error handling
         - Logging of sensitive information
         - Third-party dependency security
    `,
    performance: `
      Review priorities:
      1. Performance Optimization:
         - Algorithm efficiency
         - Resource utilization
         - Memory management
         - Database query optimization
         - Caching implementation

      2. Performance Patterns:
         - Async/await usage
         - Resource pooling
         - Data structure choices
         - Loop optimizations
         - Network calls optimization

      3. Performance Best Practices:
         - Resource cleanup
         - Memory leaks prevention
         - Connection pooling
         - Batch processing
         - Load handling
    `,
    architecture: `
      Review priorities:
      1. Architectural Patterns:
         - SOLID principles adherence
         - Design patterns implementation
         - Component coupling
         - System boundaries
         - Service interfaces

      2. Architectural Best Practices:
         - Separation of concerns
         - Dependency management
         - Service boundaries
         - Extension points
         - Module organization

      3. Architecture Quality:
         - Code organization
         - System scalability
         - Maintainability
         - Testability
         - Documentation
    `,
  };

  const baseInstructions = `Act as a senior software engineer reviewing a Pull Request. Focus only on significant technical issues and improvements.`;

  const selectedContext =
    contextType === "custom"
      ? `Custom Review Context:\n${customContext}`
      : contextInstructions[contextType as keyof typeof contextInstructions] ||
        contextInstructions.general;

  const guidelines = `
  Guidelines:
  - Only comment if you find significant issues that need addressing
  - Skip minor stylistic issues or subjective preferences
  - Be specific and technical in your feedback
  - Provide clear reasoning for each issue raised
  - Suggest concrete solutions when pointing out problems
  `;

  return `${baseInstructions}\n\n${selectedContext}\n\n${guidelines}\n\nReview the provided patch/diff and focus only on the changed lines.`;
}

export async function reviewFile(
  targetBranch: string,
  fileName: string,
  httpsAgent: Agent,
  apiKey: string,
  openai: OpenAI | undefined
) {
  console.log(`Start reviewing ${fileName} ...`);

  const defaultOpenAIModel = "gpt-4o";
  const patch = await git.diff([targetBranch, "--", fileName]);

  const contextType = tl.getInput("context_type") || "comprehensive";
  const additionalContext = tl.getInput("additional_context") || "";
  const instructions = getReviewInstructions(contextType, additionalContext);

  try {
    if (!openai) {
      throw new Error("OpenAI instance is not defined.");
    }
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

    if (response.choices && response.choices.length > 0) {
      const review = response.choices[0].message?.content as string;
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
