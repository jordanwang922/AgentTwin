import { Injectable, Optional } from "@nestjs/common";
import type { SopTemplate } from "@agenttwin/core";
import { SopStateService } from "./sop-state.service";
import { TemplateRendererService } from "./template-renderer.service";

interface CreateSopTemplateInput {
  id: string;
  name: string;
  channel: string;
  content: string;
}

interface UpdateSopTemplateInput {
  id: string;
  name?: string;
  channel?: string;
  content?: string;
}

@Injectable()
export class SopTemplateService {
  private readonly renderer: TemplateRendererService;

  constructor(
    private readonly state: SopStateService,
    @Optional() renderer?: TemplateRendererService
  ) {
    this.renderer = renderer ?? new TemplateRendererService();
  }

  async create(input: CreateSopTemplateInput): Promise<SopTemplate> {
    const template: SopTemplate = {
      ...input,
      variables: [...new Set(this.renderer.extractVariables(input.content))],
      createdAt: new Date().toISOString()
    };

    return this.state.saveTemplate(template);
  }

  async list() {
    return this.state.getTemplates();
  }

  async getById(id: string) {
    const templates = await this.state.getTemplates();
    return templates.find((template) => template.id === id);
  }

  async update(input: UpdateSopTemplateInput) {
    const current = await this.getById(input.id);
    if (!current) {
      throw new Error(`Template ${input.id} not found`);
    }

    const content = input.content ?? current.content;
    const template: SopTemplate = {
      ...current,
      ...input,
      content,
      variables: [...new Set(this.renderer.extractVariables(content))]
    };

    return this.state.saveTemplate(template);
  }

  async remove(id: string) {
    await this.state.deleteTemplate(id);
  }
}
