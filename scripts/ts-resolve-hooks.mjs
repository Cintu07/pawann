export async function resolve(specifier, context, next) {
  if (specifier.startsWith(".") && !/\.[cm]?[jt]s$|\.json$/.test(specifier)) {
    try {
      return await next(`${specifier}.ts`, context);
    } catch {
      // fall through to the normal resolution
    }
  }
  return next(specifier, context);
}
