import { Injectable, Optional } from "@nestjs/common";
import type { FaqEntry, KnowledgeArticle, RiskRule } from "@agenttwin/core";
import {
  createFileKnowledgeCatalogRepository,
  type KnowledgeCatalogRepository,
  type KnowledgeCatalogSnapshot
} from "./storage-repositories";
import { createStorageProvider } from "./storage-provider";

@Injectable()
export class KnowledgeCatalogService {
  private readonly repository: KnowledgeCatalogRepository;
  private readonly ready: Promise<void>;
  private faqEntries: FaqEntry[] = [];
  private articles: KnowledgeArticle[] = [];
  private riskRules: RiskRule[] = [];

  constructor(@Optional() repositoryOrFilePath?: KnowledgeCatalogRepository | string) {
    this.repository =
      typeof repositoryOrFilePath === "string"
        ? createFileKnowledgeCatalogRepository(repositoryOrFilePath)
        : repositoryOrFilePath ?? createStorageProvider().createKnowledgeCatalogRepository();

    this.ready = this.hydrate();
  }

  async getFaqEntries() {
    await this.ready;
    return [...this.faqEntries];
  }

  async getArticles() {
    await this.ready;
    return [...this.articles];
  }

  async getRiskRules() {
    await this.ready;
    return [...this.riskRules];
  }

  async getDomains() {
    await this.ready;
    return ["course", "faq", "case", "sop_template"];
  }

  async addFaqEntry(entry: FaqEntry) {
    await this.ready;
    this.faqEntries = [entry, ...this.faqEntries.filter((item) => item.id !== entry.id)];
    await this.persist();
    return entry;
  }

  async addKnowledgeArticle(article: KnowledgeArticle) {
    await this.ready;
    this.articles = [article, ...this.articles.filter((item) => item.id !== article.id)];
    await this.persist();
    return article;
  }

  async addRiskRule(rule: RiskRule) {
    await this.ready;
    this.riskRules = [rule, ...this.riskRules.filter((item) => item.id !== rule.id)];
    await this.persist();
    return rule;
  }

  private async hydrate() {
    const snapshot = await this.repository.load();
    this.faqEntries = snapshot.faq ?? [];
    this.articles = snapshot.articles ?? [];
    this.riskRules = snapshot.riskRules ?? [];
  }

  private async persist() {
    const snapshot: KnowledgeCatalogSnapshot = {
      faq: this.faqEntries,
      articles: this.articles,
      riskRules: this.riskRules
    };

    await this.repository.save(snapshot);
  }
}
