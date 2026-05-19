// framework_selector.js — Selects the optimal prompting framework based on prompt analysis

const FrameworkSelector = (() => {

  const FRAMEWORKS = {
    ROLE_CONTEXT_TASK: {
      id: 'role_context_task',
      name: 'Role + Context + Task',
      description: 'Assigns an expert role, provides context, and defines the task with constraints'
    },
    CHAIN_OF_THOUGHT: {
      id: 'chain_of_thought',
      name: 'Chain of Thought',
      description: 'Guides the model through a step-by-step reasoning process before answering'
    },
    STEP_BY_STEP: {
      id: 'step_by_step',
      name: 'Step-by-Step Reasoning',
      description: 'Breaks the task into clear sequential numbered steps'
    },
    FEW_SHOT: {
      id: 'few_shot',
      name: 'Few-Shot Prompting',
      description: 'Provides pattern examples to guide the response format and style'
    },
    INSTRUCTION_HIERARCHY: {
      id: 'instruction_hierarchy',
      name: 'Instruction Hierarchy',
      description: 'Organizes the prompt into primary and secondary layered instructions'
    },
    OUTPUT_FORMATTING: {
      id: 'output_formatting',
      name: 'Output Formatting',
      description: 'Specifies exact output structure, sections, and formatting requirements'
    },
    JSON_STRUCTURED: {
      id: 'json_structured',
      name: 'JSON Structured Output',
      description: 'Requests a response as a well-defined JSON schema'
    },
    SOCRATIC: {
      id: 'socratic',
      name: 'Socratic Questioning',
      description: 'Uses guided questions and answers to explore the topic with depth'
    },
    PLANNING_FIRST: {
      id: 'planning_first',
      name: 'Planning-First',
      description: 'Instructs the model to plan and outline before executing the full response'
    }
  };

  // Map framework id strings back to FRAMEWORKS keys for settings interop
  const ID_TO_KEY = Object.fromEntries(
    Object.entries(FRAMEWORKS).map(([k, v]) => [v.id, k])
  );

  function select(analysis, preferredFramework = 'auto') {
    if (preferredFramework && preferredFramework !== 'auto') {
      const key = ID_TO_KEY[preferredFramework] || preferredFramework.toUpperCase();
      if (FRAMEWORKS[key]) return FRAMEWORKS[key];
    }
    return selectAuto(analysis);
  }

  function selectAuto(analysis) {
    const { taskType, intent, complexity, needsStructuredOutput, needsExamples } = analysis;

    // Data / structured output tasks
    if (taskType === 'data') return FRAMEWORKS.JSON_STRUCTURED;
    if (needsStructuredOutput && taskType === 'coding') return FRAMEWORKS.JSON_STRUCTURED;

    // Complex coding → chain of thought; simple coding → step by step
    if (taskType === 'coding' && complexity === 'complex') return FRAMEWORKS.CHAIN_OF_THOUGHT;
    if (taskType === 'coding') return FRAMEWORKS.STEP_BY_STEP;

    // Math always benefits from step-by-step
    if (taskType === 'math') return FRAMEWORKS.STEP_BY_STEP;

    // Business and strategic work → role + context + task
    if (taskType === 'business') return FRAMEWORKS.ROLE_CONTEXT_TASK;

    // Complex analysis → planning first; lighter analysis → socratic
    if (taskType === 'analysis' && complexity === 'complex') return FRAMEWORKS.PLANNING_FIRST;
    if (taskType === 'analysis') return FRAMEWORKS.SOCRATIC;

    // Deep reasoning → chain of thought
    if (taskType === 'reasoning') return FRAMEWORKS.CHAIN_OF_THOUGHT;

    // Writing with structure → output formatting
    if (taskType === 'writing' && needsStructuredOutput) return FRAMEWORKS.OUTPUT_FORMATTING;

    // Creative tasks with examples requested → few shot
    if (taskType === 'creative' && needsExamples) return FRAMEWORKS.FEW_SHOT;

    // Complex creative → role + context
    if (taskType === 'creative' && complexity !== 'simple') return FRAMEWORKS.ROLE_CONTEXT_TASK;

    // Simple, vague prompts → instruction hierarchy to add clarity
    if (complexity === 'simple') return FRAMEWORKS.INSTRUCTION_HIERARCHY;

    // Fallback
    return FRAMEWORKS.ROLE_CONTEXT_TASK;
  }

  return { select, FRAMEWORKS, ID_TO_KEY };
})();
