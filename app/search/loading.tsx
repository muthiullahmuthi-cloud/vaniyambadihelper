import { Card, CardContent } from "@/components/ui/Card";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

// Define a minimal Skeleton component if we don't have one in ui/Skeleton.tsx yet
export default function SearchLoading() {
  return (
    <div className="max-w-3xl mx-auto pb-12 pt-4 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/" className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500">
          <ChevronLeft className="w-6 h-6" />
        </Link>
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
      </div>

      <div className="flex flex-col gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-5">
              <div className="flex justify-between items-start mb-3">
                <div className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="h-6 w-3/4 bg-gray-200 rounded animate-pulse mb-3"></div>
              <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse mb-5"></div>
              
              <div className="bg-gray-50 rounded-lg p-3 flex items-start gap-3">
                <div className="w-5 h-5 bg-gray-200 rounded-full animate-pulse mt-0.5 shrink-0"></div>
                <div className="w-full">
                  <div className="h-3 w-24 bg-gray-200 rounded animate-pulse mb-2"></div>
                  <div className="flex gap-2">
                    <div className="h-7 w-16 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-7 w-16 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
