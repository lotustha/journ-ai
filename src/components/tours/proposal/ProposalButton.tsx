"use client";

import dynamic from "next/dynamic";
import { FileDown, Loader2 } from "lucide-react";

// Import PDFDownloadLink dynamically to avoid server-side rendering issues with @react-pdf/renderer
const PDFDownloadLink = dynamic(
  () => import("@react-pdf/renderer").then((mod) => mod.PDFDownloadLink),
  {
    ssr: false,
    loading: () => (
      <button className="btn btn-outline gap-2" disabled>
        <Loader2 className="animate-spin" size={16} /> Loading PDF...
      </button>
    ),
  },
);

import { ProposalDocument } from "./ProposalDocument";

export function ProposalButton({ tour }: { tour: any }) {
  return (
    <PDFDownloadLink
      document={<ProposalDocument tour={tour} />}
      fileName={`${tour.name.replace(/\s+/g, "_")}_Proposal.pdf`}
      className="btn btn-outline gap-2 border-primary text-primary hover:bg-primary hover:text-white hover:border-primary"
    >
      {/* @react-pdf/renderer requires this function structure to handle 
            loading state vs ready state inside the link
        */}
      {({ loading }) => (
        <>
          {loading ? (
            <Loader2 className="animate-spin" size={16} />
          ) : (
            <FileDown size={16} />
          )}
          {loading ? "Generating..." : "Download Proposal"}
        </>
      )}
    </PDFDownloadLink>
  );
}
