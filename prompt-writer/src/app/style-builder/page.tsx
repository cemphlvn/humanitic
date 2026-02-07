import Navbar from "@/components/Navbar";
import StyleBuilder from "@/components/StyleBuilder";

export default function StyleBuilderPage() {
  return (
    <>
      <Navbar />
      <main className="container pb-5">
        <div className="text-center mb-4">
          <h2 className="fw-bold" style={{ color: "var(--pw-style)" }}>
            Suno Style Builder
          </h2>
          <p className="text-muted" style={{ maxWidth: 600, margin: "0 auto" }}>
            Build style prompts visually. Select genre, mood, instruments, and
            more — see the Suno-ready style string update in real time.
          </p>
        </div>
        <div className="row justify-content-center">
          <div className="col-lg-10">
            <StyleBuilder />
          </div>
        </div>
      </main>
    </>
  );
}
