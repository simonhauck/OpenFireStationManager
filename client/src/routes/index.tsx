import { createFileRoute } from "@tanstack/react-router";
import { HeroSection } from "../home/HeroSection";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return <HeroSection />;
}
