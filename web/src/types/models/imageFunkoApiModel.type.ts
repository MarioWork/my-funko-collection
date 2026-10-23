import type { NamedApiModel } from './namedApiModel.type';

// The funko an image belongs to, as GET /images and /images/groups embed it.
export interface ImageFunkoApiModel extends NamedApiModel {
  number: string;
}
