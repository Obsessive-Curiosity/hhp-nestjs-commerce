export type CreateProductProps = {
  categoryId: number;
  name: string;
  retailPrice?: number | null;
  wholesalePrice?: number | null;
  description: string;
  imageUrl?: string | null;
};

export type UpdateProductProps = {
  name?: string;
  categoryId?: number;
  retailPrice?: number | null;
  wholesalePrice?: number | null;
  description?: string;
  imageUrl?: string | null;
};

export type GetProductsFilters = {
  categoryId?: number;
};
