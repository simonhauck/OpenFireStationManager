import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div className="p-2">
      <h3>Welcome Home!</h3>
      <button className="btn btn-primary" onClick={() => console.log("I am a button")}>
        Hello
      </button>
    </div>
  );
}
