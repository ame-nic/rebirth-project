/* Reddit's public JSON endpoint works from the browser without auth.
   We still wrap it in a User-Agent header per Reddit's etiquette guidance. */

export async function fetchReddit(source) {
  const { subreddit, sort = "hot", limit = 5 } = source.config;
  const url = `https://www.reddit.com/r/${subreddit}/${sort}.json?limit=${limit}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`Reddit ${res.status}`);
  const json = await res.json();
  const posts = json?.data?.children || [];
  return posts.map(({ data: p }) => ({
    id:          p.id,
    title:       p.title,
    summary:     p.selftext
      ? p.selftext.slice(0, 200)
      : `${p.score.toLocaleString()} upvote · ${p.num_comments} commenti`,
    url:         p.url?.startsWith("http")
      ? p.url
      : `https://reddit.com${p.permalink}`,
    publishedAt: new Date(p.created_utc * 1000),
    source:      `r/${subreddit}`,
    sourceId:    source.id,
    category:    source.category,
    image:       p.thumbnail?.startsWith("http") ? p.thumbnail : null,
    read:        false,
  }));
}
