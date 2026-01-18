type AttributesAccessControl<T = Record<string, any>[]> = {
  entityType(entityType: number): AttributesAccessControl<T>;
  accessLevel(accessLevel: number): AttributesAccessControl<T>;
  attributesList(attributesList: Record<string, unknown>[]):
    AttributesAccessControl<T extends boolean | boolean[] ? T : boolean[]>;
  ignoreMissing(): AttributesAccessControl<T>;
  preventMissing(): AttributesAccessControl<T>;
  any(): AttributesAccessControl<boolean>;
  all(): AttributesAccessControl<boolean>;
  invalidate(userId: number, entityType: number): Promise<void>;
  then<TResult1 = T, TResult2 = never>(
    onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null
  ): Promise<TResult1 | TResult2>;
  catch<TResult = never>(
    onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null
  ): Promise<T | TResult>;
};

export type AccessControl = {
  byAttributes: () => AttributesAccessControl;
};
