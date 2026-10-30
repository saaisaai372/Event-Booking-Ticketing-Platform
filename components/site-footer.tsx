import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { APP_NAME, CATEGORIES } from "@/lib/constants";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border bg-card/40">
      <div className="container-page grid gap-8 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Link href="/" className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <CalendarDays className="size-4" />
            </span>
            <span className="text-lg font-semibold tracking-tight">{APP_NAME}</span>
          </Link>
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            Discover events, book tickets in seconds, and check in with a QR code.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold">Categories</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            {CATEGORIES.slice(0, 4).map((category) => (
              <li key={category.slug}>
                <Link
                  href={`/events?category=${category.slug}`}
                  className="transition-colors hover:text-foreground"
                >
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold">Company</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              <Link href="/about" className="transition-colors hover:text-foreground">
                About
              </Link>
            </li>
            <li>
              <Link href="/contact" className="transition-colors hover:text-foreground">
                Contact
              </Link>
            </li>
            <li>
              <Link href="/faq" className="transition-colors hover:text-foreground">
                FAQ
              </Link>
            </li>
            <li>
              <Link
                href="/for-organizers"
                className="transition-colors hover:text-foreground"
              >
                For organizers
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold">Legal</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              <Link href="/terms" className="transition-colors hover:text-foreground">
                Terms of service
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="transition-colors hover:text-foreground">
                Privacy policy
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border py-6">
        <p className="container-page text-xs text-muted-foreground">
          © {new Date().getFullYear()} {APP_NAME}. Built as an intern project — payments
          are simulated.
        </p>
      </div>
    </footer>
  );
}
