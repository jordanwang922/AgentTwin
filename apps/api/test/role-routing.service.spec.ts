import { RoleRoutingService } from "../src/role-routing.service";

describe("RoleRoutingService", () => {
  it("routes teacher requests into teacher mode and student requests into student mode", async () => {
    const service = new RoleRoutingService();

    expect(await service.resolveMode({ userId: "teacher-001", channel: "admin" })).toBe("teacher");
    expect(await service.resolveMode({ userId: "student-001", channel: "wecom" })).toBe("student");
  });
});
