import type { Metadata } from "next";
import AgentBuilder from "@/components/builder/AgentBuilder";

export const metadata: Metadata = {
  title: "Maverick — Agent Studio",
  description: "Build your agent: shape, color, mood and motion — all live, all in code.",
};

export default function BuilderPage() {
  return <AgentBuilder />;
}
