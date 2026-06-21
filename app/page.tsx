import { supabase } from "@/lib/supabase";
import { getTwentyMinutesAgoIST } from "@/lib/timeUtils";
import { HomeSearch } from "@/components/HomeSearch";
import { SearchResults } from "@/components/SearchResults";
import { LiveReportsSection } from "@/components/LiveReportsSection";
import { TypeToggle } from "@/components/TypeToggle";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";

// Prevent static generation for this page to ensure live data is always fresh
export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const routeType = searchParams.type === "intercity" ? "intercity" : "local";
  const twentyMinsAgo = getTwentyMinutesAgoIST();

  // 1. Fetch Live Reports (last 20 mins)
  // We use inner joins to ensure we only get reports for the selected routeType
  const { data: liveReports, error: liveError } = await supabase
    .from("live_reports")
    .select(`
      id,
      created_at,
      routes!inner(id, route_name, route_type),
      stops!inner(name, name_local)
    `)
    .gte("created_at", twentyMinsAgo)
    .eq("routes.route_type", routeType)
    .order("created_at", { ascending: false })
    .limit(5);

  if (liveError) {
    console.error("Error fetching live reports:", liveError);
  }

  // 2. Fetch Routes and their schedules to calculate "Popular Routes"
  const { data: routesData, error: routesError } = await supabase
    .from("routes")
    .select(`
      id,
      route_name,
      route_number,
      schedules(id)
    `)
    .eq("route_type", routeType);

  if (routesError) {
    console.error("Error fetching routes:", routesError);
  }

  // Calculate top 6 popular routes by schedule count in memory
  const routesWithCounts = (routesData || []).map((route) => ({
    ...route,
    scheduleCount: route.schedules?.length || 0,
  }));

  const popularRoutes = routesWithCounts
    .sort((a, b) => b.scheduleCount - a.scheduleCount)
    .slice(0, 6);

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Hero Section */}
      <section className="bg-primary -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pt-12 pb-24 text-center text-white">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-4">
          Find your bus in Vaniyambadi
        </h1>
        <p className="text-primary-foreground/80 text-lg max-w-2xl mx-auto mb-8">
          Live tracking and verified schedules for local and intercity transit.
        </p>
      </section>

      {/* Search & Toggle */}
      <section className="relative">
        <HomeSearch />
        <TypeToggle />
      </section>

      {/* Live Right Now Section */}
      <section className="max-w-3xl mx-auto w-full">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-accent"></span>
            </span>
            Live Right Now
          </h2>
        </div>

        <LiveReportsSection
          reports={(liveReports as unknown as Array<{ id: string; created_at: string; routes: { id: string; route_name: string }; stops: { name: string } }>) || []}
        />
      </section>

      {/* Inline Search Results */}
      <SearchResults />

      {/* Popular Routes Section */}
      <section className="max-w-3xl mx-auto w-full mt-4">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Popular Routes</h2>
        
        {popularRoutes.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {popularRoutes.map((route) => (
              <Link key={route.id} href={`/route/${route.id}`}>
                <Card className="hover:border-primary/50 hover:shadow-md transition-all h-full cursor-pointer">
                  <CardContent className="p-4 flex flex-col justify-center h-full">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="secondary" className="font-bold text-primary bg-primary/10">
                        {route.route_number}
                      </Badge>
                      <span className="text-xs font-medium text-gray-500">
                        {route.scheduleCount} trips
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2">
                      {route.route_name}
                    </h3>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 text-sm">
            No popular routes available yet.
          </div>
        )}
      </section>
    </div>
  );
}
