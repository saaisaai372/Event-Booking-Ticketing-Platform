import type { Metadata } from "next";
import { Mail, MapPin, Phone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <div className="container-page max-w-3xl py-14">
      <h1 className="text-3xl font-bold tracking-tight">Contact</h1>
      <p className="mt-3 text-muted-foreground">
        This is a demo project, so there is no support desk behind it — but here is where
        you would reach us.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <Mail className="size-5 text-primary" />
            <p className="mt-3 text-sm font-medium">Email</p>
            <p className="text-sm text-muted-foreground">support@evently.test</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <Phone className="size-5 text-primary" />
            <p className="mt-3 text-sm font-medium">Phone</p>
            <p className="text-sm text-muted-foreground">+91 00000 00000</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <MapPin className="size-5 text-primary" />
            <p className="mt-3 text-sm font-medium">Office</p>
            <p className="text-sm text-muted-foreground">Bengaluru, India</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
