import { OutlyLogo } from "@/components/brand/outly-logo";
import { Icon, type IconName } from "@/components/ui/icon";
import { FOOTER_GROUPS, PLACEHOLDER_HREF, SOCIAL_LINKS } from "@/lib/constants";

export function SiteFooter() {
  return (
    <footer className="bg-[var(--outly-night)] text-white/80">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_2fr]">
          <div>
            <OutlyLogo width={72} height={72} variant="transparent" quality={100} />
            <p className="mt-5 max-w-xs text-sm leading-relaxed">OUTLY — Explore, Connect, Belong</p>
            <p className="mt-1 text-xs text-white/50">Explore. Connect. Belong.</p>
            <ul className="mt-6 flex gap-3" aria-label="Social links (coming soon)">
              {SOCIAL_LINKS.map((social) => (
                <li key={social.label}>
                  <a
                    href={social.href}
                    aria-disabled={social.href === PLACEHOLDER_HREF}
                    title={social.href === PLACEHOLDER_HREF ? `${social.label} — coming soon` : social.label}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-white/60 transition-colors hover:border-white/40 hover:text-white"
                  >
                    <Icon name={social.label.toLowerCase() as IconName} className="h-4 w-4" />
                    <span className="sr-only">{social.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {FOOTER_GROUPS.map((group) => (
              <div key={group.title}>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-white">
                  {group.title}
                </h3>
                <ul className="mt-4 flex flex-col gap-3">
                  {group.links.map((link) => {
                    const isPlaceholder = link.href === PLACEHOLDER_HREF;
                    return (
                      <li key={link.label}>
                        <a
                          href={link.href}
                          aria-disabled={isPlaceholder}
                          className="inline-flex items-center gap-2 text-sm text-white/60 transition-colors hover:text-white"
                        >
                          {link.label}
                          {isPlaceholder ? (
                            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/50">
                              Soon
                            </span>
                          ) : null}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 border-t border-white/10 pt-8 text-xs text-white/40">
          © {new Date().getFullYear()} OUTLY. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
