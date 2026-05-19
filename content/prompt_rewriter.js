// prompt_rewriter.js — Transforms raw prompts into structured, high-quality enhanced prompts

const PromptRewriter = (() => {

  const EXPERT_ROLES = {
    coding:    'an expert software engineer and architect',
    writing:   'a professional writer and editor',
    analysis:  'a senior analyst and strategic consultant',
    creative:  'a creative director and innovation specialist',
    business:  'a seasoned startup strategist and business consultant',
    research:  'a rigorous research analyst',
    math:      'an expert mathematician and problem solver',
    data:      'a senior data engineer and analyst',
    reasoning: 'a critical thinking expert and logician',
    general:   'a knowledgeable expert in the relevant field'
  };

  const ROLE_CONTEXT = {
    coding:    'with deep knowledge of software architecture, design patterns, and clean code principles',
    writing:   'with a talent for clear, engaging, and audience-appropriate communication',
    analysis:  'with a systematic, evidence-based, and objective analytical approach',
    creative:  'with a strong sense of originality, aesthetics, and creative problem-solving',
    business:  'with expertise in market strategy, financial modeling, and growth frameworks',
    research:  'with rigorous research methodology and meticulous attention to accuracy',
    math:      'with mastery of mathematical reasoning and proof techniques',
    data:      'with deep experience in data modeling, transformation pipelines, and schema design',
    reasoning: 'with mastery of formal logic, argument structure, and critical analysis',
    general:   'with comprehensive domain knowledge and strong critical thinking'
  };

  const OUTPUT_SPEC = {
    simple:   '',
    moderate: '\n\nFormat your response with clear headings and bullet points where appropriate.',
    complex:  '\n\nStructure your response with:\n- Clear section headings (## Heading)\n- Bullet points for lists\n- Code blocks (```language) for any code\n- A concise summary at the end'
  };

  // ─── Public entry point ───────────────────────────────────────────────────

  function rewrite(rawPrompt, analysis, framework, intensity = 'balanced') {
    const role = EXPERT_ROLES[analysis.taskType] || EXPERT_ROLES.general;
    switch (framework.id) {
      case 'role_context_task':    return rewriteRoleContextTask(rawPrompt, analysis, role, intensity);
      case 'chain_of_thought':     return rewriteChainOfThought(rawPrompt, analysis, role, intensity);
      case 'step_by_step':         return rewriteStepByStep(rawPrompt, analysis, role, intensity);
      case 'few_shot':             return rewriteFewShot(rawPrompt, analysis, role, intensity);
      case 'instruction_hierarchy':return rewriteInstructionHierarchy(rawPrompt, analysis, intensity);
      case 'output_formatting':    return rewriteOutputFormatting(rawPrompt, analysis, role, intensity);
      case 'json_structured':      return rewriteJsonStructured(rawPrompt, analysis, intensity);
      case 'socratic':             return rewriteSocratic(rawPrompt, analysis, role, intensity);
      case 'planning_first':       return rewritePlanningFirst(rawPrompt, analysis, role, intensity);
      default:                     return rewriteRoleContextTask(rawPrompt, analysis, role, intensity);
    }
  }

  // ─── Framework implementations ────────────────────────────────────────────

  function rewriteRoleContextTask(raw, analysis, role, intensity) {
    const context = ROLE_CONTEXT[analysis.taskType] || ROLE_CONTEXT.general;
    const outputFmt = OUTPUT_SPEC[analysis.complexity] || OUTPUT_SPEC.moderate;

    if (intensity === 'light') {
      return `You are ${role}.\n\n${raw}\n\nProvide a thorough, well-structured response.`;
    }

    if (intensity === 'aggressive') {
      return `You are ${role} ${context}.\n\n` +
        `Context: The user requires expert-level assistance with the following task.\n\n` +
        `Task: ${raw}\n\n` +
        `Requirements:\n` +
        `- Provide a comprehensive and detailed response\n` +
        `- Include specific examples and actionable recommendations\n` +
        `- Consider edge cases and potential challenges\n` +
        `- Justify your recommendations with clear reasoning\n` +
        `- Assume the user has intermediate knowledge of the subject\n\n` +
        `Constraints:\n` +
        `- Be precise — avoid vague generalizations\n` +
        `- Prioritize practical, implementable solutions` +
        outputFmt;
    }

    return `You are ${role} ${context}.\n\n` +
      `Task: ${raw}\n\n` +
      `Please provide a detailed, structured response that:\n` +
      `- Addresses all aspects of the request\n` +
      `- Includes specific, actionable steps or recommendations\n` +
      `- Considers relevant constraints and best practices` +
      outputFmt;
  }

  function rewriteChainOfThought(raw, analysis, role, intensity) {
    if (intensity === 'light') {
      return `${raw}\n\nThink through this step by step before giving your final answer.`;
    }

    const thoughtProcess = intensity === 'aggressive'
      ? `Let's work through this systematically:\n\n` +
        `1. Analyze the core problem and all its components\n` +
        `2. Identify all relevant constraints and requirements\n` +
        `3. Explore multiple approaches and their tradeoffs\n` +
        `4. Determine the optimal solution with clear reasoning\n` +
        `5. Validate the solution against the original requirements\n\n` +
        `Task: `
      : `Think through this carefully, step by step:\n\nTask: `;

    return `You are ${role}.\n\n${thoughtProcess}${raw}\n\n` +
      `Show your reasoning process clearly, then deliver a comprehensive final answer.`;
  }

  function rewriteStepByStep(raw, analysis, role, intensity) {
    if (intensity === 'light') {
      return `${raw}\n\nProvide a numbered, step-by-step solution.`;
    }

    const suffix = intensity === 'aggressive'
      ? `\n\nProvide your response as numbered steps. For each step:\n` +
        `- Explain what you are doing and why\n` +
        `- Include any code, examples, or specifics needed\n` +
        `- Note prerequisites or dependencies\n\n` +
        `End with a summary and any important caveats.`
      : `\n\nProvide a clear, numbered step-by-step solution with a brief explanation for each step.`;

    return `You are ${role}.\n\n${raw}${suffix}`;
  }

  function rewriteFewShot(raw, analysis, role, intensity) {
    if (intensity === 'light') {
      return `${raw}\n\nProvide your answer using a clear, consistent format with examples where helpful.`;
    }

    const exampleBlocks = {
      coding:   `Example pattern:\nInput: [describe sample input]\nExpected Output: [sample output with explanation]\nApproach: [brief description of the solution logic]\n\nNow apply this pattern to:`,
      writing:  `Style example:\n[A short sample demonstrating the expected tone, structure, and depth]\n\nNow produce:`,
      analysis: `Analysis example:\nAspect 1: [key finding]\nAspect 2: [key finding]\nConclusion: [summary with recommendation]\n\nApply this framework to:`,
      general:  `Response pattern:\nOverview: [brief summary]\nDetails: [in-depth exploration with specifics]\nConclusion: [key takeaways and next steps]\n\nNow address:`
    };

    const block = exampleBlocks[analysis.taskType] || exampleBlocks.general;
    return `You are ${role}.\n\n${block} ${raw}\n\nMaintain consistent format, depth, and quality throughout.`;
  }

  function rewriteInstructionHierarchy(raw, analysis, intensity) {
    if (intensity === 'light') {
      return `Primary task: ${raw}\n\nBe specific, concrete, and concise in your response.`;
    }

    return `## Primary Instruction\n${raw}\n\n` +
      `## Secondary Requirements\n` +
      `- Use concrete examples to support your points\n` +
      `- Avoid vague or generic statements\n` +
      `- Keep the response focused and directly relevant\n\n` +
      `## Output Expectations\n` +
      `- Well-organized, logical structure\n` +
      `- Actionable and practical content\n` +
      `- Appropriate depth for the complexity of the task`;
  }

  function rewriteOutputFormatting(raw, analysis, role, intensity) {
    if (intensity === 'light') {
      return `${raw}\n\nFormat your response with clear headings, bullet points, and a logical structure.`;
    }

    const formatSpecs = {
      writing: `## Format Specification\n` +
        `- **Title**: Compelling and descriptive\n` +
        `- **Introduction**: Hook + context (2–3 sentences)\n` +
        `- **Body**: Organized sections with subheadings\n` +
        `- **Conclusion**: Key takeaways and call to action\n` +
        `- **Tone**: Professional yet engaging`,
      coding: `## Format Specification\n` +
        `- **Explanation**: Brief description of the approach\n` +
        `- **Code**: Clean, well-commented code block\n` +
        `- **Breakdown**: Key parts explained line by line\n` +
        `- **Usage**: How to run or test the solution\n` +
        `- **Edge Cases**: Important considerations`,
      analysis: `## Format Specification\n` +
        `- **Executive Summary**: 3–5 sentence overview\n` +
        `- **Key Findings**: Bulleted list of main insights\n` +
        `- **Detailed Analysis**: Sections per major aspect\n` +
        `- **Recommendations**: Prioritized actionable items\n` +
        `- **Conclusion**: Final assessment`,
      general: `## Format Specification\n` +
        `- **Overview**: Brief introduction\n` +
        `- **Main Content**: Organized with clear headings\n` +
        `- **Details**: Supporting points with examples\n` +
        `- **Summary**: Key takeaways`
    };

    const spec = formatSpecs[analysis.taskType] || formatSpecs.general;
    return `You are ${role}.\n\n## Task\n${raw}\n\n${spec}`;
  }

  function rewriteJsonStructured(raw, analysis, intensity) {
    if (intensity === 'light') {
      return `${raw}\n\nReturn your response as a well-structured JSON object.`;
    }

    const schemaHint = intensity === 'aggressive'
      ? `\n\nReturn ONLY a valid JSON object matching this schema:\n` +
        `{\n` +
        `  "summary": "string — brief overview",\n` +
        `  "details": [\n` +
        `    { "aspect": "string", "content": "string", "examples": ["string"] }\n` +
        `  ],\n` +
        `  "recommendations": ["string"],\n` +
        `  "metadata": { "complexity": "low|medium|high", "confidence": "low|medium|high" }\n` +
        `}`
      : `\n\nReturn your response as a structured JSON object with clear, descriptive keys and values.`;

    return `Task: ${raw}${schemaHint}`;
  }

  function rewriteSocratic(raw, analysis, role, intensity) {
    if (intensity === 'light') {
      return `${raw}\n\nExplore this topic from multiple perspectives, asking and answering key questions along the way.`;
    }

    const depth = intensity === 'aggressive'
      ? `\n\nUse the Socratic method to explore this thoroughly:\n` +
        `1. What is the core question or problem here?\n` +
        `2. What assumptions are being made?\n` +
        `3. What evidence supports different viewpoints?\n` +
        `4. What are the broader implications and second-order effects?\n` +
        `5. What is the most reasoned, defensible conclusion?\n\n` +
        `Provide both the guiding questions AND comprehensive answers to each.`
      : `\n\nApproach this by asking and answering key questions that progressively deepen understanding.`;

    return `You are ${role}.\n\nTopic to explore: ${raw}${depth}`;
  }

  function rewritePlanningFirst(raw, analysis, role, intensity) {
    if (intensity === 'light') {
      return `${raw}\n\nFirst outline your plan of attack, then execute it fully.`;
    }

    const planDetail = intensity === 'aggressive'
      ? `\n\nBefore executing, produce a detailed plan:\n\n` +
        `**Phase 1 — Planning:**\n` +
        `- Decompose the task into sub-components\n` +
        `- Identify potential risks and blockers\n` +
        `- Define clear success criteria\n` +
        `- Choose the best methodology or approach\n\n` +
        `**Phase 2 — Execution:**\n` +
        `- Implement each component step by step\n` +
        `- Reference decisions made in Phase 1\n\n` +
        `**Phase 3 — Review:**\n` +
        `- Verify output meets all requirements\n` +
        `- Highlight limitations or follow-up steps`
      : `\n\nStart with a concise plan/outline, then execute it comprehensively.`;

    return `You are ${role}.\n\nTask: ${raw}${planDetail}`;
  }

  // ─── Quality scoring ──────────────────────────────────────────────────────

  function calculateQualityScore(rawPrompt, enhancedPrompt) {
    let score = 40;
    if (enhancedPrompt.includes('\n\n'))                   score += 5;
    if (/##|###/.test(enhancedPrompt))                     score += 7;
    if (/\*\*[^*]+\*\*/.test(enhancedPrompt))              score += 5;
    if (/^You are /m.test(enhancedPrompt))                  score += 10;
    if (/- /.test(enhancedPrompt))                         score += 5;
    if (enhancedPrompt.length > rawPrompt.length * 1.5)    score += 8;
    if (/example|Example/i.test(enhancedPrompt))           score += 5;
    if (/step|phase|requirement|constraint/i.test(enhancedPrompt)) score += 5;
    if (/format|structure|heading/i.test(enhancedPrompt))  score += 5;
    if (enhancedPrompt.split('\n').length > 5)             score += 5;
    return Math.min(score, 99);
  }

  return { rewrite, calculateQualityScore };
})();
