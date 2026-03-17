export const TEXT_CATEGORY_ORDER_MODE = 'text-category';
export const TEXT_REQUEST_CATEGORY_NAMES = ['سوبر ماركت'];

export type TextCategoryOrderDraft = {
  categoryId: string;
  categoryName: string;
  requestText: string;
};

export function isTextRequestCategory(name?: string | null) {
  return TEXT_REQUEST_CATEGORY_NAMES.includes((name || '').trim());
}

export function getTextCategoryOrderDraftKey(categoryId: string) {
  return `text-category-order-draft:${categoryId}`;
}

export function readTextCategoryOrderDraft(categoryId: string): TextCategoryOrderDraft | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(getTextCategoryOrderDraftKey(categoryId));
    return raw ? JSON.parse(raw) as TextCategoryOrderDraft : null;
  } catch {
    return null;
  }
}

export function writeTextCategoryOrderDraft(draft: TextCategoryOrderDraft) {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(getTextCategoryOrderDraftKey(draft.categoryId), JSON.stringify(draft));
}

export function clearTextCategoryOrderDraft(categoryId: string) {
  if (typeof window === 'undefined') return;
  window.sessionStorage.removeItem(getTextCategoryOrderDraftKey(categoryId));
}
