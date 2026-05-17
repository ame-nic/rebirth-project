/* Dispatcher: route a Source to the correct fetcher.
   Weather is handled separately by the hook because it produces a Weather
   object, not a FeedItem[] — keeping the items pipeline homogeneous. */

import { fetchRSS } from "./fetchRSS.js";
import { fetchReddit } from "./fetchReddit.js";

export async function fetchSourceItems(source) {
  switch (source.type) {
    case "rss":    return fetchRSS(source);
    case "reddit": return fetchReddit(source);
    default:       return [];
  }
}
