declare global {
  interface Array<T> {
    /**
     * Returns the number of elements of an array that meet the condition specified in a callback function. Uses `Array.filter` under the hood.
     *
     * @param predicate A function that accepts up to three arguments. The filter method calls the predicate function one time for each element in the array.
     * @param thisArg An object to which the this keyword can refer in the predicate function. If thisArg is omitted, undefined is used as the this value.
     */
    amount(...args: Parameters<Array<T>["filter"]>): number;

    /**
     * Asynchronously returns the elements of an array that meet the condition specified in a callback function so as to not block the event loop. Uses `Promise.all` and `requestIdleCallback` under the hood.
     *
     * **USAGE WARNING**: This is a nice utility that allows you to do "expensive"-ish operations (think filtering results in large-ish array) without totally blocking the event loop for however long it takes to loop through the `predicate` function. At the end of the day, you can still end up "starving" the event loop if either a) your array is large enough or b) the internal function is expensive enough. If you feel the need to use it, be **absolutely sure** to perf test it.
     *
     * @param predicate A function that accepts up to three arguments. The filter method calls the predicate function one time for each element in the array.
     * @param thisArg An object to which the this keyword can refer in the predicate function. If thisArg is omitted, undefined is used as the this value.
     */
    asyncFilter(...args: Parameters<Array<T>["filter"]>): Promise<T[]>;

    /**
     * Asynchronously performs the specified action for each element in an array so as to not block the event loop. Uses `Promise.allSettled` and `requestIdleCallback` under the hood.
     *
     * **USAGE WARNING**: This is a nice utility that allows you to do "expensive"-ish operations (think mutating results in large-ish array) without totally blocking the event loop for however long it takes to loop through the `callbackfn` function. At the end of the day, you can still end up "starving" the event loop if either a) your array is large enough or b) the internal function is expensive enough. If you feel the need to use it, be **absolutely sure** to perf test it.
     *
     * @param callbackfn A function that accepts up to three arguments. forEach calls the callbackfn function one time for each element in the array.
     * @param thisArg An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value.
     */
    asyncEach(
      ...args: Parameters<Array<T>["forEach"]>
    ): Promise<PromiseSettledResult<T>[]>;

    /**
     * Converts the array to an object using the value at the specified `key` argument for the corresponding key in the returned object. Overwrites duplicate key values.
     *
     * @example
     * ```
     * [{ name: "John" }, { name: "Jane" }].reduceKeys("name");
     * // => { "John": { name: "John" }, "Jane": { name: "Jane" } }
     *
     * [{ name: "Adam" }, { name: "Adam" }].reduceKeys("name");
     * // => { "Adam": { name: "Adam" } }
     * ```
     *
     * @param key The key to reduce the array on
     */
    reduceKeys<U extends keyof T>(
      key: U
    ): { [K in T[U] as string | number | symbol]: T };

    /**
     * Returns an object with keys representing groups of the initial array. The group keys are determined by the supplied `callbackfn`.
     *
     * @param callbackfn callbackfn is run on each element of the array to determine the grouping key for each element
     */
    group<U extends string>(callbackfn: (value: T, index: number) => U): Record<U, T[]>;
  }

  interface Object {
    /**
     * Returns an object with keys representing groups of the initial array. The group keys are determined by the supplied `callbackfn`.
     *
     * @param array the array to run the groupBy function on
     * @param callbackfn callbackfn is run on each element of the array to determine the grouping key for each element
     */
    groupBy<T extends object, U extends string>(
      array: T[],
      callbackfn: (object: T, index: number) => U
    ): Record<U, T[]>;
  }
}

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