import { memberRole } from '@/schema/tables';
import { InferEnumType } from '@/type';
import { type ClassValue, clsx } from 'clsx';
import { PgEnum, PgTableWithColumns } from 'drizzle-orm/pg-core';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function removeTableInternalFields<
  Table extends PgTableWithColumns<any>
>(table: Table) {
  const {
    _,
    $inferInsert: __,
    $inferSelect: ___,
    getSQL: _getSql,
    ...rest
  } = table;

  return rest as Omit<Table, '_' | ' $inferInsert' | '$inferSelect' | 'getSQL'>;
}

type NativeEnum<DbEnums extends PgEnum<any>> = [
  InferEnumType<DbEnums>
] extends [infer EnumSet extends `${string}`]
  ? { [K in EnumSet]: K }
  : never;

export const convertPgEnumNative = <DbEnums extends PgEnum<any>>(
  enums: DbEnums
): NativeEnum<DbEnums> => {
  return Object.fromEntries(new Set(enums.enumValues).entries());
};
