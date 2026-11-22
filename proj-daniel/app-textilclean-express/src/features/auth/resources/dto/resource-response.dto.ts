import { Resource, ResourceI } from "../resource.model";

export type ResourceResponseDto = ResourceI;

export function toResourceResponse(resource: Resource): ResourceResponseDto {
  return resource.toJSON() as ResourceI;
}