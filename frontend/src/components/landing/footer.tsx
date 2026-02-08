import { Link } from "react-router-dom";

const footerLinks = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "Security", href: "#security" },
      { label: "Pricing", href: "#pricing" },
      { label: "API Docs", href: "#" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "#about" },
      { label: "Careers", href: "#" },
      { label: "Blog", href: "#" },
      { label: "Press", href: "#" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "#" },
      { label: "Terms of Service", href: "#" },
      { label: "Compliance", href: "#" },
      { label: "Licenses", href: "#" },
    ],
  },
];

export function Footer() {
  return (
    <footer
      id="about"
      className="border-t border-border/50 bg-background py-14 lg:py-20"
    >
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link to="/" className="flex items-center gap-2.5">
              <span className="font-display text-xl font-light tracking-wide text-foreground">
                Renaissance
              </span>
            </Link>
            <p className="mt-5 max-w-xs text-[13px] font-extralight leading-relaxed tracking-wide text-muted-foreground">
              Enterprise-grade crypto banking for the companies building the
              future of finance.
            </p>
          </div>

          {footerLinks.map((group) => (
            <div key={group.title}>
              <p className="text-[11px] font-extralight uppercase tracking-[0.3em] text-foreground">
                {group.title}
              </p>
              <ul className="mt-5 flex flex-col gap-3">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-[13px] font-extralight tracking-wider text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-border/50 pt-8 sm:flex-row">
          <p className="text-[11px] font-extralight tracking-wider text-muted-foreground">
            2026 Renaissance Inc. All rights reserved.
          </p>
          <div className="flex gap-6">
            {["Twitter", "LinkedIn", "GitHub"].map((s) => (
              <a
                key={s}
                href="#"
                className="text-[11px] font-extralight tracking-wider text-muted-foreground transition-colors hover:text-foreground"
              >
                {s}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
