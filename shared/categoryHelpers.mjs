export const getCategoryLabel = (transaction) => {
  if (transaction?.category === "Other" && transaction.customCategory?.trim()) {
    return transaction.customCategory.trim();
  }

  return transaction?.category || "";
};

export const normalizeCustomCategory = (category) =>
  category
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toLocaleUpperCase() + word.slice(1).toLocaleLowerCase())
    .join(" ");
