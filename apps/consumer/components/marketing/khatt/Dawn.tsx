interface DawnProps {
  /** "dusk" runs the gradient the other way, back into night. */
  direction?: "dawn" | "dusk";
}

/** The single luminance transition between the two halves of the page. */
export const Dawn = ({ direction = "dawn" }: DawnProps) => (
  <div
    className={direction === "dusk" ? "dawn dawn--dusk" : "dawn"}
    aria-hidden="true"
  />
);
