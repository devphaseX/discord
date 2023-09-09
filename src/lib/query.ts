interface URLQuery {
  [query: string]: unknown;
}

export function getUrlQuery<T extends URLQuery>(
  req: Request,
  validator?: (query: URLQuery) => T
): T {
  const url = new URL(req.url);
  let query = <T>Object.fromEntries(url.searchParams);

  if (validator) {
    query = validator(query);
  }

  return <T>query;
}
