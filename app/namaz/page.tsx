import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/Card";
import Link from "next/link";
import { Phone } from "lucide-react";

export const dynamic = "force-dynamic";

interface Mosque {
  id: string;
  name: string;
  area: string;
  contact_phone: string | null;
  fajr: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  jumma: string | null;
  last_updated_by_mosque: string;
}

function formatTelLink(phone: string): string {
  const cleaned = phone.replace(/[\s-]/g, "");
  const prefixed = cleaned.startsWith("+91") ? cleaned : `+91${cleaned}`;
  return `tel:${prefixed}`;
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "today";
  if (diffDays === 1) return "1 day ago";
  if (diffDays < 30) return `${diffDays} days ago`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths === 1) return "1 month ago";
  if (diffMonths < 12) return `${diffMonths} months ago`;
  const diffYears = Math.floor(diffMonths / 12);
  if (diffYears === 1) return "1 year ago";
  return `${diffYears} years ago`;
}

export default async function NamazPage() {
  const { data: mosques } = await supabase
    .from("mosques")
    .select("*")
    .eq("status", "verified")
    .order("name");

  const verifiedMosques = (mosques as Mosque[]) || [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900">Namaz Timings</h1>
          <p className="text-sm text-gray-500 mt-1">
            Prayer times from mosques in Vaniyambadi.
          </p>
        </div>
        <Link
          href="/namaz/register"
          className="text-sm font-medium text-primary hover:underline whitespace-nowrap"
        >
          + Register mosque
        </Link>
      </div>

      {verifiedMosques.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
          <p className="text-gray-500">No mosque timings listed yet.</p>
          <p className="text-sm text-gray-400">
            Are you a mosque committee member?{" "}
            <Link href="/namaz/register" className="text-primary font-medium hover:underline">
              Register your mosque
            </Link>
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {verifiedMosques.map((mosque) => (
            <Card key={mosque.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h2 className="font-bold text-gray-900 text-lg">{mosque.name}</h2>
                    <p className="text-sm text-gray-500">{mosque.area}</p>
                  </div>
                  <p className="text-xs text-gray-400 whitespace-nowrap">
                    Updated {timeAgo(mosque.last_updated_by_mosque)}
                  </p>
                </div>

                <div className="grid grid-cols-5 gap-2 mb-3">
                  {[
                    { label: "Fajr", time: mosque.fajr },
                    { label: "Dhuhr", time: mosque.dhuhr },
                    { label: "Asr", time: mosque.asr },
                    { label: "Maghrib", time: mosque.maghrib },
                    { label: "Isha", time: mosque.isha },
                  ].map((p) => (
                    <div key={p.label} className="text-center">
                      <p className="text-xs font-medium text-gray-400 mb-0.5">{p.label}</p>
                      <p className="text-sm font-bold text-gray-900">{p.time}</p>
                    </div>
                  ))}
                </div>

                {mosque.jumma && (
                  <div className="flex items-center gap-2 mb-3 border-t border-gray-100 pt-3">
                    <span className="text-xs font-medium text-gray-400">Jumma</span>
                    <span className="text-sm font-bold text-primary">{mosque.jumma}</span>
                  </div>
                )}

                {mosque.contact_phone && (
                  <a
                    href={formatTelLink(mosque.contact_phone)}
                    className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-primary transition-colors"
                  >
                    <Phone className="w-3 h-3" />
                    Suggest a correction
                  </a>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
