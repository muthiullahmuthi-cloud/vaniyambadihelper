import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/Badge";
import { Phone, Shield, Heart, ShieldAlert, Flame, HeartPulse, Zap, Droplets, HelpCircle } from "lucide-react";

export const dynamic = "force-dynamic";

interface EmergencyContact {
  id: string;
  name: string;
  category: string;
  phone: string;
  address: string | null;
  is_24x7: boolean;
  display_order: number;
}

const CATEGORY_CONFIG: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  national: { label: "National", icon: Shield, color: "text-red-600" },
  hospital: { label: "Hospital", icon: Heart, color: "text-red-500" },
  police: { label: "Police", icon: ShieldAlert, color: "text-blue-600" },
  fire: { label: "Fire", icon: Flame, color: "text-orange-500" },
  ambulance: { label: "Ambulance", icon: HeartPulse, color: "text-red-500" },
  electricity_board: { label: "Electricity", icon: Zap, color: "text-yellow-500" },
  water_board: { label: "Water", icon: Droplets, color: "text-cyan-500" },
  other: { label: "Other", icon: HelpCircle, color: "text-gray-500" },
};

function formatTelLink(phone: string): string {
  const cleaned = phone.replace(/[\s-]/g, "");
  const prefixed = cleaned.startsWith("+91") ? cleaned : `+91${cleaned}`;
  return `tel:${prefixed}`;
}

function isPhoneValid(phone: string): boolean {
  return phone.trim().length > 0;
}

export default async function EmergencyPage() {
  const { data: contacts } = await supabase
    .from("emergency_contacts")
    .select("*")
    .order("display_order");

  const grouped: Record<string, EmergencyContact[]> = {};
  const national: EmergencyContact[] = [];

  for (const c of (contacts as EmergencyContact[]) || []) {
    if (c.category === "national") {
      national.push(c);
    } else {
      if (!grouped[c.category]) grouped[c.category] = [];
      grouped[c.category].push(c);
    }
  }

  const categoryOrder = ["hospital", "police", "fire", "ambulance", "electricity_board", "water_board", "other"];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-extrabold text-gray-900">Emergency Contacts</h1>
        <p className="text-sm text-gray-500 mt-1">One tap to call — keep calm and dial.</p>
      </div>

      {/* National always first */}
      {national.length > 0 && (
        <section>
          <div className="flex flex-col gap-3">
            {national.map((c) => (
              <div
                key={c.id}
                className="bg-red-50 border-2 border-red-200 rounded-xl p-4 shadow-sm"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-bold text-gray-900 text-lg">{c.name}</h2>
                    <p className="text-sm text-gray-500">{c.phone}</p>
                  </div>
                  {c.is_24x7 && (
                    <Badge variant="outline" className="flex-shrink-0 border-red-300 text-red-600 text-[10px]">
                      24x7
                    </Badge>
                  )}
                </div>
                <a
                  href={formatTelLink(c.phone)}
                  className="flex items-center justify-center gap-2 w-full py-4 bg-red-600 text-white rounded-xl text-base font-bold hover:bg-red-700 transition-colors shadow-sm"
                >
                  <Phone className="w-5 h-5" />
                  Call Now
                </a>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Other categories */}
      {categoryOrder.map((cat) => {
        const items = grouped[cat];
        if (!items || items.length === 0) return null;
        const config = CATEGORY_CONFIG[cat];
        const Icon = config.icon;

        return (
          <section key={cat}>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Icon className={`w-4 h-4 ${config.color}`} />
              {config.label}
            </h2>
            <div className="flex flex-col gap-3">
              {items.map((c) => {
                const valid = isPhoneValid(c.phone);
                return (
                  <div key={c.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <Icon className={`w-5 h-5 ${config.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900">{c.name}</h3>
                        {c.address && (
                          <p className="text-xs text-gray-400 mt-0.5">{c.address}</p>
                        )}
                        {valid && (
                          <p className="text-sm text-gray-500 mt-0.5">{c.phone}</p>
                        )}
                      </div>
                      {c.is_24x7 && (
                        <Badge variant="outline" className="flex-shrink-0 text-[10px] border-gray-300 text-gray-500">
                          24x7
                        </Badge>
                      )}
                    </div>
                    {valid ? (
                      <a
                        href={formatTelLink(c.phone)}
                        className="flex items-center justify-center gap-2 w-full py-3.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors shadow-sm"
                      >
                        <Phone className="w-4 h-4" />
                        Call
                      </a>
                    ) : (
                      <div className="w-full py-3.5 bg-gray-100 text-gray-400 rounded-xl text-sm font-medium text-center">
                        Number pending verification
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
