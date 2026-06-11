/** The 8 Tareeq career clusters. Colors carry meaning — never reassign. */

export type ClusterCode =
  | "TECH"
  | "ENG"
  | "SCI"
  | "ART"
  | "BUS"
  | "LAW"
  | "PPL"
  | "ENV";

export interface Cluster {
  code: ClusterCode;
  name: string;
  nameAr: string;
  /** CSS variable carrying the cluster color (defined in admin.css) */
  cssVar: string;
  hex: string;
}

export const CLUSTERS: Cluster[] = [
  { code: "TECH", name: "Technology", nameAr: "التقنية", cssVar: "--adm-cl-tech", hex: "#1D63D2" },
  { code: "ENG", name: "Engineering", nameAr: "الهندسة", cssVar: "--adm-cl-eng", hex: "#C2410C" },
  { code: "SCI", name: "Science", nameAr: "العلوم", cssVar: "--adm-cl-sci", hex: "#5040D9" },
  { code: "ART", name: "Arts & Media", nameAr: "الفنون", cssVar: "--adm-cl-art", hex: "#A521C4" },
  { code: "BUS", name: "Business", nameAr: "الأعمال", cssVar: "--adm-cl-bus", hex: "#6B4D00" },
  { code: "LAW", name: "Law & Policy", nameAr: "القانون", cssVar: "--adm-cl-law", hex: "#0E7A6E" },
  { code: "PPL", name: "People & Care", nameAr: "الرعاية", cssVar: "--adm-cl-ppl", hex: "#C01F55" },
  { code: "ENV", name: "Environment", nameAr: "البيئة", cssVar: "--adm-cl-env", hex: "#1F7A3D" },
];

export const clusterByCode = (code: ClusterCode): Cluster =>
  CLUSTERS.find((c) => c.code === code) ?? CLUSTERS[0];
