// Fix: Provide placeholder content for prompts.ts to make it a valid module.

// This file contains prompt templates for various generation tasks.

export const Prompts = {
    generateOutline: (premise: string, authorStyle: string): string => `
        You are a master storyteller and world-builder, deeply inspired by the style of ${authorStyle}.
        Your task is to take a simple story premise and expand it into a compelling three-act plot outline.
        
        Story Premise: "${premise}"
        
        Please generate a detailed outline covering:
        1.  **Act I: The Setup** - Introduction to the protagonist, the world, and the inciting incident.
        2.  **Act II: The Confrontation** - Rising action, major challenges, and the midpoint twist.
        3.  **Act III: The Resolution** - The climax, falling action, and the story's conclusion.
        
        The outline should be structured, clear, and full of creative potential.
    `,

    // Add other prompt templates here as needed, e.g., for character generation, chapter writing, etc.
};
