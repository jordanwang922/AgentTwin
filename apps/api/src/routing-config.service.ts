import { Injectable, Optional } from "@nestjs/common";
import type { ChannelProfile, GroupProfile, TenantProfile } from "@agenttwin/core";
import { demoGroupProfile } from "@agenttwin/core";
import {
  createFileRoutingConfigRepository,
  type RoutingConfigRepository,
  type RoutingConfigSnapshot
} from "./storage-repositories";
import { createStorageProvider } from "./storage-provider";

@Injectable()
export class RoutingConfigService {
  private readonly repository: RoutingConfigRepository;
  private readonly ready: Promise<void>;
  private tenant!: TenantProfile;
  private channel!: ChannelProfile;
  private groups: GroupProfile[] = [];

  constructor(@Optional() repositoryOrFilePath?: RoutingConfigRepository | string) {
    this.repository =
      typeof repositoryOrFilePath === "string"
        ? createFileRoutingConfigRepository(repositoryOrFilePath)
        : repositoryOrFilePath ?? createStorageProvider().createRoutingConfigRepository();

    this.ready = this.hydrate();
  }

  async getTenantProfile() {
    await this.ready;
    return this.tenant;
  }

  async getChannelProfile() {
    await this.ready;
    return this.channel;
  }

  async getGroupProfiles() {
    await this.ready;
    return [...this.groups];
  }

  async getGroupConfig(groupId: string) {
    await this.ready;
    return this.groups.find((group) => group.groupId === groupId) ?? demoGroupProfile;
  }

  async updateTenantProfile(profile: TenantProfile) {
    await this.ready;
    this.tenant = profile;
    await this.persist();
    return this.tenant;
  }

  async updateGroupConfig(profile: GroupProfile) {
    await this.ready;
    this.groups = [profile, ...this.groups.filter((group) => group.groupId !== profile.groupId)];
    await this.persist();
    return profile;
  }

  private async hydrate() {
    const snapshot = await this.repository.load();
    this.tenant = snapshot.tenant;
    this.channel = snapshot.channel;
    this.groups = snapshot.groups?.length ? snapshot.groups : [demoGroupProfile];
  }

  private async persist() {
    const snapshot: RoutingConfigSnapshot = {
      tenant: this.tenant,
      channel: this.channel,
      groups: this.groups
    };

    await this.repository.save(snapshot);
  }
}
