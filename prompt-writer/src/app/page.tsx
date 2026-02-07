import Navbar from "@/components/Navbar";
import PromptGenerator from "@/components/PromptGenerator";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="container pb-5">
        <div className="text-center mb-4">
          <h2 className="fw-bold" style={{ color: "var(--pw-primary)" }}>
            Educational Music Prompt Generator
          </h2>
          <p className="text-muted" style={{ maxWidth: 600, margin: "0 auto" }}>
            Generate curiosity-sparking lyrics and style prompts for Suno AI.
            Powered by a Cognitive Strategy Agent that ensures every song teaches
            through wonder.
          </p>
        </div>
        <PromptGenerator />
      </main>
    </>
  );
}
