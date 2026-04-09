import { Body, Controller, Post } from "@nestjs/common";
import type { ChatRequest } from "@agenttwin/core";
import { ChatService } from "./chat.service";

@Controller("api/chat")
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  async createReply(@Body() body: ChatRequest) {
    return this.chatService.process(body);
  }
}
