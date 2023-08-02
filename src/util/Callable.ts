// deno-lint-ignore no-explicit-any
export type CallableFn = (...args: any[]) => any;

export interface Callable<CallableFunction extends CallableFn> {
	(...args: Parameters<CallableFunction>): ReturnType<CallableFunction>;
}

/**
 * This object will allow to create an object with a callable signature.
 *
 * @template CallableFunction An optional call signature, if not provided it'll
 * be inferred by the callable parameter in the callable constructor.
 *
 * @example Creating a callable.
 * ```ts
 * const callable = new Callable((str: string) => str);
 * callable("hello");
 * ```
 *
 * @example Extending the callable object.
 * ```ts
 * class MyCallable extends Callable<(str: string) => string> {
 *   public constructor() {
 *     super((str) => str);
 *   }
 * }
 *
 * const myCallable = new MyCallable();
 * myCallable("Hello world");
 * ```
 *
 * Note that in this example a call signature was povided as a type parameter,
 * because it cannot be inferred from usage.
 */
export class Callable<CallableFunction extends CallableFn> extends Function {
	/**
	 * Initiate a new callable.
	 * @param callable The function to run when called.
	 */
	public constructor(callable: CallableFunction) {
		const key = "$";
		super("...args", `return this["${key}"](...args)`);
		// deno-lint-ignore no-explicit-any
		const t = this as any;
		t[key] = callable;
		const _bound = this.bind(this);
		return (t._bound = _bound);
	}
}

export default Callable;
