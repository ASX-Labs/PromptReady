// prompt_analyzer.js — Analyzes raw prompts to extract task type, intent, complexity, and metadata

const PromptAnalyzer = (() => {

  const TASK_PATTERNS = {
    coding: {
      keywords: ['code', 'function', 'script', 'program', 'debug', 'fix bug', 'implement',
        'algorithm', 'class', 'api', 'database', 'sql', 'html', 'css', 'javascript',
        'python', 'java', 'react', 'node', 'typescript', 'build', 'deploy', 'component',
        'method', 'variable', 'loop', 'array', 'object', 'git', 'docker', 'test', 'unit test'],
      weight: 2
    },
    writing: {
      keywords: ['write', 'essay', 'article', 'blog', 'story', 'email', 'letter', 'report',
        'draft', 'compose', 'paragraph', 'content', 'copy', 'proofread', 'rewrite',
        'headline', 'caption', 'description', 'bio', 'tweet', 'post', 'newsletter'],
      weight: 2
    },
    analysis: {
      keywords: ['analyze', 'analysis', 'compare', 'evaluate', 'assess', 'review', 'examine',
        'investigate', 'pros and cons', 'advantages', 'disadvantages', 'breakdown',
        'insight', 'critique', 'audit', 'benchmark', 'measure'],
      weight: 2
    },
    creative: {
      keywords: ['create', 'design', 'brainstorm', 'idea', 'imagine', 'invent', 'generate ideas',
        'creative', 'novel', 'unique', 'original', 'poem', 'song', 'concept', 'pitch',
        'slogan', 'name', 'logo', 'brand identity'],
      weight: 1
    },
    business: {
      keywords: ['business', 'startup', 'marketing', 'strategy', 'plan', 'revenue', 'customer',
        'sales', 'product', 'market', 'brand', 'growth', 'investment', 'pitch', 'proposal',
        'company', 'enterprise', 'pricing', 'monetize', 'go-to-market', 'mvp', 'b2b', 'b2c'],
      weight: 2
    },
    research: {
      keywords: ['research', 'find', 'what is', 'how does', 'explain', 'define', 'tell me about',
        'information', 'facts', 'history', 'overview', 'introduction', 'background',
        'learn about', 'understand'],
      weight: 1
    },
    math: {
      keywords: ['calculate', 'math', 'equation', 'formula', 'solve', 'proof', 'statistics',
        'probability', 'compute', 'algebra', 'calculus', 'geometry', 'integral', 'derivative',
        'matrix', 'vector'],
      weight: 2
    },
    data: {
      keywords: ['data', 'json', 'csv', 'table', 'chart', 'graph', 'spreadsheet', 'format',
        'parse', 'convert', 'transform', 'structure', 'schema', 'dataset', 'pipeline',
        'etl', 'query'],
      weight: 2
    },
    reasoning: {
      keywords: ['think', 'reason', 'logic', 'argument', 'debate', 'philosophical', 'ethical',
        'moral', 'decision', 'should i', 'best way', 'optimal', 'tradeoff', 'consider',
        'weigh', 'perspective'],
      weight: 1
    }
  };

  const INTENT_PATTERNS = {
    create:    ['create', 'make', 'build', 'write', 'generate', 'design', 'develop', 'produce', 'draft', 'compose'],
    explain:   ['explain', 'what is', 'how does', 'why', 'define', 'describe', 'tell me', 'clarify', 'what are'],
    fix:       ['fix', 'debug', 'resolve', 'solve', 'correct', 'repair', 'error', 'bug', 'issue', 'problem', 'wrong'],
    improve:   ['improve', 'optimize', 'enhance', 'better', 'refactor', 'upgrade', 'revise', 'refine', 'polish'],
    compare:   ['compare', 'vs ', 'versus', 'difference between', 'similarities', 'pros and cons', 'which is better'],
    summarize: ['summarize', 'summary', 'brief', 'overview', 'tldr', 'condense', 'shorten', 'key points'],
    convert:   ['convert', 'transform', 'translate', 'change to', 'reformat', 'migrate', 'turn into'],
    plan:      ['plan', 'roadmap', 'strategy', 'steps to', 'process', 'workflow', 'approach', 'how to']
  };

  function detectTaskType(prompt) {
    const lower = prompt.toLowerCase();
    const scores = {};

    for (const [type, config] of Object.entries(TASK_PATTERNS)) {
      scores[type] = 0;
      for (const keyword of config.keywords) {
        if (lower.includes(keyword)) scores[type] += config.weight;
      }
    }

    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    return sorted[0][1] > 0 ? sorted[0][0] : 'general';
  }

  function detectIntent(prompt) {
    const lower = prompt.toLowerCase();
    for (const [intent, keywords] of Object.entries(INTENT_PATTERNS)) {
      for (const kw of keywords) {
        if (lower.includes(kw)) return intent;
      }
    }
    return 'create';
  }

  function assessComplexity(prompt) {
    const wordCount = prompt.trim().split(/\s+/).length;
    const multiReq = (prompt.match(/\b(and|also|additionally|furthermore|moreover|plus)\b/gi) || []).length > 2;
    const hasConstraints = /\b(must|should|need to|require|ensure|avoid|without|only|never)\b/i.test(prompt);
    const hasContext = prompt.length > 150;

    let score = 0;
    if (wordCount > 20) score++;
    if (wordCount > 50) score++;
    if (multiReq)       score++;
    if (hasConstraints) score++;
    if (hasContext)     score++;

    if (score <= 1) return 'simple';
    if (score <= 3) return 'moderate';
    return 'complex';
  }

  function extractSubject(prompt) {
    const cleaned = prompt
      .replace(/^(can you|please|i want you to|i need|help me|make|create|write|build|generate)\s+/i, '')
      .trim();
    return cleaned.split(' ').slice(0, 10).join(' ');
  }

  function analyze(prompt) {
    if (!prompt || !prompt.trim()) return null;
    return {
      taskType:             detectTaskType(prompt),
      intent:               detectIntent(prompt),
      complexity:           assessComplexity(prompt),
      subject:              extractSubject(prompt),
      needsStructuredOutput: /\b(list|table|json|bullet|format|structure|outline|steps|numbered)\b/i.test(prompt),
      needsExamples:        /\b(example|sample|like|such as|for instance|demo|show me)\b/i.test(prompt),
      wordCount:            prompt.trim().split(/\s+/).length,
      hasQuestion:          prompt.includes('?'),
      isVague:              prompt.trim().split(/\s+/).length < 8
    };
  }

  return { analyze };
})();
