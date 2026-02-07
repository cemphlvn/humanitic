"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav
      className="navbar navbar-expand-lg mb-4 shadow-2"
      style={{ background: "var(--pw-primary)" }}
    >
      <div className="container">
        <Link className="navbar-brand text-white d-flex align-items-center" href="/">
          <i className="fas fa-music me-2" />
          <span className="navbar-brand-text">Suno Prompt Writer</span>
        </Link>

        <div className="d-flex align-items-center gap-2">
          <Link
            href="/"
            className={`btn btn-sm ${pathname === "/" ? "btn-light" : "btn-outline-light"}`}
          >
            <i className="fas fa-wand-magic-sparkles me-1" />
            Generator
          </Link>
          <Link
            href="/style-builder"
            className={`btn btn-sm ${pathname === "/style-builder" ? "btn-light" : "btn-outline-light"}`}
          >
            <i className="fas fa-palette me-1" />
            Style Builder
          </Link>
        </div>
      </div>
    </nav>
  );
}
