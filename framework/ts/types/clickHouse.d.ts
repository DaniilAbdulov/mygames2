export type ClickHouse = {
  query<T>(opts?: Partial<Options>): ClickHouseQuery<T>
};

export type ClickHouseQuery<
  T,
  Operation extends ClickHouseOperations = ClickHouseOperations.SELECT,
  Raw extends boolean = false,
  Result = Operation extends ClickHouseOperations.SELECT ?
    Raw extends false ?
      T[] :
      string :
    unknown
> = ClickHouseQueryBuilder & {
  readonly [Symbol.toStringTag]: string;
  raw(): ClickHouseQuery<T, Operation, true>;
  select(...args: string[]): ClickHouseQuery<T, ClickHouseOperations.SELECT, Raw>;
  insert(value: T): ClickHouseQuery<T, ClickHouseOperations.INSERT, Raw>;
  then<UResult1 = Result, UResult2 = never>(
    onfulfilled?: ((value: Result) => UResult1 | Promise<UResult1>) | null | undefined,
    onrejected?: ((reason: unknown) => UResult2 | Promise<UResult2>) | null | undefined,
  ): Promise<UResult1 | UResult2>;
  catch<UResult = never>(
    onrejected?: ((reason: unknown) => UResult | Promise<UResult>) | null | undefined,
  ): Promise<Result | UResult>;
  finally(onfinally?: (() => void) | null | undefined): Promise<Result>;
}

declare class ClickHouseQueryBuilder extends WhereBuilder {
  static readonly CollapsingSign: typeof CollapsingSign;
  get operation(): ClickHouseOperations;
  final(): this;
  into(tableName: string): this;
  format(format: string): this;
  limit(limit: number): this;
  offset(offset: number): this;
  orderBy(field: string, dir: 'asc' | 'desc'): this;
  groupBy(...args: [string, ...string[]]): this;
  select(...args: string[]): this;
  insert(value: unknown): this;
  from(fromClause: string | ((ch: ClickHouseQueryBuilder) => ClickHouseQueryBuilder)): this;
  as(alias: string): this;
  allLeftJoin(builder: ((ch: ClickHouseQueryBuilder) => ClickHouseQueryBuilder)): this;
  using(column: string): this;
  toSQL(): string
}

declare class WhereBuilder {
  prewhere(fn: (builder: WhereBuilder) => WhereBuilder): this;
  prewhere(column: string, value: unknown): this;
  prewhere(column: string, op: string, value: unknown): this;
  orPrewhere(fn: (builder: WhereBuilder) => WhereBuilder): this;
  orPrewhere(column: string, value: unknown): this;
  orPrewhere(column: string, op: string, value: unknown): this;
  prewhereNot(fn: (builder: WhereBuilder) => WhereBuilder): this;
  prewhereNot(column: string, value: unknown): this;
  prewhereNot(column: string, op: string, value: unknown): this;
  orPrewhereNot(fn: (builder: WhereBuilder) => WhereBuilder): this;
  orPrewhereNot(column: string, value: unknown): this;
  orPrewhereNot(column: string, op: string, value: unknown): this;
  prewhereIn(column: string, values: unknown[]): this;
  orPrewhereIn(column: string, values: unknown[]): this;
  prewhereNotNull(column: string): this;
  orPrewhereNotNull(column: string): this;
  where(fn: (builder: WhereBuilder) => WhereBuilder): this;
  where(column: string, value: unknown): this;
  where(column: string, op: string, value: unknown): this;
  orWhere(fn: (builder: WhereBuilder) => WhereBuilder): this;
  orWhere(column: string, value: unknown): this;
  orWhere(column: string, op: string, value: unknown): this;
  whereNot(fn: (builder: WhereBuilder) => WhereBuilder): this;
  whereNot(column: string, value: unknown): this;
  whereNot(column: string, op: string, value: unknown): this;
  orWhereNot(fn: (builder: WhereBuilder) => WhereBuilder): this;
  orWhereNot(column: string, value: unknown): this;
  orWhereNot(column: string, op: string, value: unknown): this;
  whereIn(column: string, values: unknown[]): this;
  orWhereIn(column: string, values: unknown[]): this;
  whereNotNull(column: string): this;
  orWhereNotNull(column: string): this;
}

type Options = {
  timeout: number;
  wait: boolean;
  instant: boolean;
};

declare enum ClickHouseOperations {
  SELECT = 0,
  INSERT = 1
}

declare enum CollapsingSign {
  STATE = 1,
  CANCEL = -1
}
