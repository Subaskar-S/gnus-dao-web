import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Governance",
  description: "GNUS DAO governance and voting platform",
};

export default function GovernancePage() {
  // Redirect to proposals page since governance is handled there
  redirect("/proposals");
}
