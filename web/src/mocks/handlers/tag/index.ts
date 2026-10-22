import addTagHandler from './addTag.mock.handler';
import deleteTagHandler from './deleteTag.mock.handler';
import getTagHandler from './getTag.mock.handler';
import listTagsHandler from './listTags.mock.handler';
import updateTagHandler from './updateTag.mock.handler';

export const tagMockHandlers = (baseUrl: string) => [
  ...listTagsHandler(baseUrl),
  ...getTagHandler(baseUrl),
  ...addTagHandler(baseUrl),
  ...updateTagHandler(baseUrl),
  ...deleteTagHandler(baseUrl),
];
