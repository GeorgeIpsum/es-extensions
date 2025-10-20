const NilSym = Symbol("NIL");

Array.prototype.amount = function <T>(...args: Parameters<Array<T>["filter"]>) {
  return this.filter(...args).length;
};

Array.prototype.asyncFilter = async function <T>(
  ...[filter]: Parameters<Array<T>["filter"]>
) {
  return (
    await Promise.all(
      this.map(
        (item, i, a) =>
          new Promise((res) =>
            requestIdleCallback(() => res(filter(item, i, a) ? item : NilSym))
          )
      )
    )
  ).filter((item) => item !== NilSym);
};

Array.prototype.asyncEach = async function <T>(
  ...[forEach]: Parameters<Array<T>["forEach"]>
) {
  return await Promise.allSettled(
    this.map(
      (item, i, a) =>
        new Promise((res) =>
          requestIdleCallback(() => res(forEach(item, i, a)))
        )
    )
  );
};

Array.prototype.reduceKeys = function <T, U extends keyof T>(key: U) {
  return this.reduce(
    (keyObj, item) => ({ ...keyObj, [item[key]]: item }),
    {} as { [K in T[U] as string | number | symbol]: T }
  ) as { [K in T[U] as string | number | symbol]: T };
};

Array.prototype.group = function<T extends object, U extends string>(callbackfn: (value: T, index: number) => U) {
  return this.reduce(
    (record: Record<U, T[]>, object: T, index: number) => {
      const key = callbackfn(object, index);
      if (!(key in record)) {
        record[key] = [object];
      } else {
        record[key].push(object);
      }
      return record;
    },
    {} as Record<U, T[]>
  );
};

Object.groupBy = function <T extends object, U extends string>(
  array: T[],
  callbackfn: (object: T, index: number) => U
): Record<U, T[]> {
  return array.reduce(
    (record: Record<U, T[]>, object: T, index: number) => {
      const key = callbackfn(object, index);
      if (!(key in record)) {
        record[key] = [object];
      } else {
        record[key].push(object);
      }
      return record;
    },
    {} as Record<U, T[]>
  );
};

export {};