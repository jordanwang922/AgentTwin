import { Injectable } from "@nestjs/common";

@Injectable()
export class TemplateRendererService {
  render(template: string, variables: Record<string, string>) {
    return template.replaceAll(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (match, key: string) => {
      return variables[key] ?? match;
    });
  }

  extractVariables(template: string) {
    return [...template.matchAll(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g)].map((match) => match[1]);
  }
}
