import { useRef, useEffect, useCallback, useState } from "react";
import { SyntaxAnalysis, SongAnalysis } from "@/types";

// Worker messages use a generic result that callers cast to the expected type
interface WorkerMessage {
  type?: string;
  result: any;
  id: number;
}

export function useSyntaxWorker() {
  const workerRef = useRef<Worker | null>(null);
  const [isReady, setIsReady] = useState(false);
  const pendingRequestsRef = useRef<
    Map<number, (result: SyntaxAnalysis) => void>
  >(new Map());
  const idCounterRef = useRef(0);

  useEffect(() => {
    // Create the worker
    workerRef.current = new Worker(
      new URL("@/workers/syntaxWorker.ts", import.meta.url),
      { type: "module" },
    );

    // Set up message handler
    workerRef.current.onmessage = (e: MessageEvent<WorkerMessage>) => {
      const { id } = e.data;
      const resolver = pendingRequestsRef.current.get(id);
      if (resolver) {
        // Pass the result regardless of type - caller knows what they asked for
        const result = e.data.result;
        resolver(result);
        pendingRequestsRef.current.delete(id);
      }
    };

    workerRef.current.onerror = (error) => {
      console.error("Syntax worker error:", error);
    };

    setIsReady(true);

    // Cleanup on unmount
    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
      pendingRequestsRef.current.clear();
    };
  }, []);

  const analyze = useCallback((text: string): Promise<SyntaxAnalysis> => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current) {
        resolve({
          nouns: [],
          pronouns: [],
          verbs: [],
          adjectives: [],
          adverbs: [],
          prepositions: [],
          conjunctions: [],
          articles: [],
          interjections: [],
          urls: [],
          numbers: [],
          hashtags: [],
        });
        return;
      }

      const id = ++idCounterRef.current;
      pendingRequestsRef.current.set(id, resolve as (result: any) => void);
      workerRef.current.postMessage({ type: "syntax", text, id });

      setTimeout(() => {
        if (pendingRequestsRef.current.has(id)) {
          pendingRequestsRef.current.delete(id);
          reject(new Error("Syntax analysis timeout"));
        }
      }, 5000);
    });
  }, []);

  const analyzeSong = useCallback((text: string): Promise<SongAnalysis> => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current) {
        resolve({
          lines: [], rhymeGroups: [], totalSyllables: 0,
          flowMetrics: { rhymeDensity: 0, avgSyllablesPerLine: 0, internalRhymeCount: 0, multiSyllabicRhymes: 0, longestRhymeChain: 0 },
          rhymeScheme: { pattern: "—", label: "—" },
        });
        return;
      }

      const id = ++idCounterRef.current;
      pendingRequestsRef.current.set(id, resolve as (result: any) => void);
      workerRef.current.postMessage({ type: "song", text, id });

      setTimeout(() => {
        if (pendingRequestsRef.current.has(id)) {
          pendingRequestsRef.current.delete(id);
          reject(new Error("Song analysis timeout"));
        }
      }, 5000);
    });
  }, []);

  return { analyze, analyzeSong, isReady };
}
