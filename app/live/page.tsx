import { LiveMapView } from "./LiveMapView";

export const dynamic = "force-dynamic";

export default function LivePage() {
  return (
    <main className="py-0">
      <LiveMapView />
    </main>
  );
}
