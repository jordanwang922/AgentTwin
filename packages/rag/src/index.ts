import { ChatReplyMode, type ChatRequest, type FaqEntry, type KnowledgeArticle } from "@agenttwin/core";

export interface RetrievalResult {
  answer?: string;
  mode: ChatReplyMode;
  confidence: number;
  citations: string[];
}

export function resolveKnowledge(
  request: ChatRequest,
  faqEntries: FaqEntry[],
  knowledgeArticles: KnowledgeArticle[]
): RetrievalResult {
  const faq = faqEntries.find((entry) => {
    const candidates = [entry.question, ...entry.aliases];
    return candidates.some((candidate) => candidate === request.message || request.message.includes(candidate));
  });

  if (faq) {
    return {
      answer: faq.answer,
      mode: ChatReplyMode.FAQ,
      confidence: 0.92,
      citations: [faq.citation]
    };
  }

  const scoredArticles = knowledgeArticles
    .map((article) => ({
      article,
      score: article.keywords.filter((keyword) => request.message.includes(keyword)).length
    }))
    .sort((left, right) => right.score - left.score);

  const topArticle = scoredArticles[0];

  if (topArticle && topArticle.score >= 2) {
    return {
      answer: `${topArticle.article.summary}${topArticle.article.content}`,
      mode: ChatReplyMode.RAG,
      confidence: 0.76,
      citations: [topArticle.article.citation]
    };
  }

  return {
    mode: ChatReplyMode.AI,
    confidence: 0.36,
    citations: []
  };
}
