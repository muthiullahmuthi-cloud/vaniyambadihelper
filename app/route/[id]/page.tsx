import Link from "next/link";
import { RouteDetailExpanded } from "@/components/RouteDetailExpanded";

export const dynamic = "force-dynamic";

interface RouteDetailPageProps {
  params: { id: string };
}

export default function RouteDetailPage({ params }: RouteDetailPageProps) {
  return (
    <main className="py-6">
      <Link
        href="/"
        className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 transition-colors mb-6"
      >
        &larr; Back
      </Link>
      <RouteDetailExpanded routeId={params.id} />
    </main>
  );
}
