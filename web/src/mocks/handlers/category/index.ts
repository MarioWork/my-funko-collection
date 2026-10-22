import addCategoryHandler from './addCategory.mock.handler';
import deleteCategoryHandler from './deleteCategory.mock.handler';
import getCategoryHandler from './getCategory.mock.handler';
import listCategoriesHandler from './listCategories.mock.handler';
import updateCategoryHandler from './updateCategory.mock.handler';

export const categoryMockHandlers = (baseUrl: string) => [
  ...listCategoriesHandler(baseUrl),
  ...getCategoryHandler(baseUrl),
  ...addCategoryHandler(baseUrl),
  ...updateCategoryHandler(baseUrl),
  ...deleteCategoryHandler(baseUrl),
];
