interface ThreadProps {
  /** Cluster token the segment carries, e.g. "var(--cluster-technology)". */
  tone?: string;
}

/**
 * The thread — a continuous spine running down the start edge of the content
 * column. Each section owns a segment and colours it with the cluster the
 * section is about, so the line reports what you are reading rather than
 * decorating it. Scales on the compositor; no layout or paint work.
 */
export const Thread = ({ tone }: ThreadProps) => (
  <span
    className="thread"
    style={tone ? { color: tone } : undefined}
    aria-hidden="true"
  />
);
