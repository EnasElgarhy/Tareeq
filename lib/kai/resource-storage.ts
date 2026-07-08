import type { KaiLearningResource, KaiSavedResource } from "@/lib/kai/resource-types";

export const kaiSavedResourcesStorageKey = "tareeq.kai.saved_resources.v1";

function isSavedResource(value: unknown): value is KaiSavedResource {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Partial<KaiSavedResource>;
  return (
    typeof item.id === "string" &&
    typeof item.type === "string" &&
    typeof item.title === "string" &&
    typeof item.authorOrProvider === "string" &&
    typeof item.reason === "string" &&
    typeof item.difficulty === "string" &&
    typeof item.estimatedTime === "string" &&
    typeof item.savedAt === "string" &&
    typeof item.inActionPlan === "boolean"
  );
}

export function readSavedResources(): KaiSavedResource[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(kaiSavedResourcesStorageKey);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.every(isSavedResource) ? parsed : [];
  } catch {
    return [];
  }
}

function writeSavedResources(resources: KaiSavedResource[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(kaiSavedResourcesStorageKey, JSON.stringify(resources));
}

function matches(saved: KaiSavedResource, resource: KaiLearningResource): boolean {
  return saved.type === resource.type && saved.title.trim().toLowerCase() === resource.title.trim().toLowerCase();
}

export function findSavedResource(
  resources: KaiSavedResource[],
  resource: KaiLearningResource,
): KaiSavedResource | undefined {
  return resources.find((saved) => matches(saved, resource));
}

export function saveResource(resource: KaiLearningResource, now = new Date().toISOString()): KaiSavedResource[] {
  const current = readSavedResources();
  if (findSavedResource(current, resource)) return current;

  const next = [
    ...current,
    { ...resource, id: `res-${now}-${Math.random().toString(36).slice(2, 8)}`, savedAt: now, inActionPlan: false },
  ];
  writeSavedResources(next);
  return next;
}

export function unsaveResource(id: string): KaiSavedResource[] {
  const next = readSavedResources().filter((resource) => resource.id !== id);
  writeSavedResources(next);
  return next;
}

export function toggleActionPlan(id: string): KaiSavedResource[] {
  const next = readSavedResources().map((resource) =>
    resource.id === id ? { ...resource, inActionPlan: !resource.inActionPlan } : resource,
  );
  writeSavedResources(next);
  return next;
}
