import { useState, useEffect } from "react";

// Mimics Monkeytype's JSON format from frontend/static/languages/*.json
export interface LanguageJSON {
  name: string;
  noLazyMode?: boolean;
  orderedByFrequency?: boolean;
  words: string[];
}

// Module-level cache to mimic Monkeytype's memoizeAsync / Map cache pattern.
// This prevents multiple fetches across remounts or separate components.
const languageCache = new Map<string, Promise<LanguageJSON>>();

export function useWordList(languageName: string = "english") {
  const [words, setWords] = useState<string[]>([]);
  const [isOrderedByFrequency, setIsOrderedByFrequency] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);

    const fetchLanguage = async () => {
      try {
        const url = `/languages/${languageName}.json`;
        
        let fetchPromise = languageCache.get(languageName);
        if (!fetchPromise) {
          fetchPromise = fetch(url).then(async (res) => {
            if (!res.ok) {
              throw new Error(`Failed to fetch language ${languageName}: ${res.statusText}`);
            }
            return (await res.json()) as LanguageJSON;
          });
          languageCache.set(languageName, fetchPromise);
        }

        const data = await fetchPromise;

        if (isMounted) {
          setWords(data.words);
          // Default to true if not explicitly set to false, matching Zipf compatibility
          setIsOrderedByFrequency(data.orderedByFrequency !== false);
          setIsLoading(false);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || "An error occurred fetching the language");
          setIsLoading(false);
        }
      }
    };

    fetchLanguage();

    return () => {
      isMounted = false;
    };
  }, [languageName]);

  return { words, isOrderedByFrequency, isLoading, error };
}
