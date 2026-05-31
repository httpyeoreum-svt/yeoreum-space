import { PageLoading } from "@/components/page-loading";

/**
 * Ensures NEXT / BEFORE navigation between songs (same [id] segment) shows the
 * loading cue while the next item streams in.
 */
export default function Loading() {
  return <PageLoading />;
}
