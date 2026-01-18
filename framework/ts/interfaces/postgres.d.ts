import {Knex} from 'knex/types';

/*
Этот тип нужен для корректной работы дженериков.
Украден из knex/types, т.к. он не экспортируется
 */
type DeferredKeySelection<
  TBase,
  TKeys extends string,
  THasSelect extends true | false = false,
  TAliasMapping extends {} = {},
  TSingle extends boolean = false,
  TIntersectProps extends {} = {},
  TUnionProps = never
> = {
  _base: TBase;
  _hasSelection: THasSelect;
  _keys: TKeys;
  _aliases: TAliasMapping;
  _single: TSingle;
  _intersectProps: TIntersectProps;
  _unionProps: TUnionProps;
};

interface ErrorCodes {
  RAISE_EXCEPTION: 'P0001';
  UNIQUE_VIOLATION: '23505';
  EXCLUSION_VIOLATION: '23P01';
}

declare interface Postgres<TRecord extends {} = any> {
  query<TRecord2 extends {} = TRecord, TResult2 = DeferredKeySelection<TRecord2, never>[]>(
    tableName?: Knex.TableDescriptor | Knex.AliasDict,
  ): Knex.QueryBuilder<TRecord2, TResult2>;

  queryOnReplica<TRecord2 extends {} = TRecord, TResult2 = DeferredKeySelection<TRecord2, never>[]>(
    tableName?: Knex.TableDescriptor | Knex.AliasDict,
  ): Knex.QueryBuilder<TRecord2, TResult2>;

  queryOnArchive<TRecord2 extends {} = TRecord, TResult2 = DeferredKeySelection<TRecord2, never>[]>(
    tableName?: Knex.TableDescriptor | Knex.AliasDict,
  ): Knex.QueryBuilder<TRecord2, TResult2>;

  transaction(): Promise<Knex.Transaction>
  transaction<T>(
    f: (trx: Knex.Transaction) => Promise<T> | void
  ): Promise<T>
  transaction<T>(
    f?: (trx: Knex.Transaction) => Promise<T> | void
  ): Promise<T> | Promise<Knex.Transaction>

  raw: Knex.RawBuilder<TRecord>
  ref: Knex.RefBuilder,

  errorCodes: ErrorCodes
}

export = Postgres;
