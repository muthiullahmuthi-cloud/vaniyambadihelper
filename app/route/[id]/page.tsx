interface RouteDetailPageProps {
  params: { id: string };
}

export default function RouteDetailPage({ params }: RouteDetailPageProps) {
  return (
    <main>
      <h1>Route Detail — {params.id}</h1>
      <p>Stops, timings, map, and live status — coming soon.</p>
    </main>
  );
}
