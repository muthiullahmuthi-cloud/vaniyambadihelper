import { FeedbackForm } from "./FeedbackForm";
import { Bus, MapPin, Smartphone, Users } from "lucide-react";

export default function AboutPage() {
  return (
    <main className="py-6 flex flex-col gap-10">
      {/* About Section */}
      <section>
        <h1 className="text-3xl font-extrabold text-gray-900 mb-4">About Vaniyambadi Bus Tracker</h1>
        <div className="prose prose-gray max-w-none">
          <p className="text-gray-700 leading-relaxed">
            Vaniyambadi Bus Tracker is a free community tool to help residents and visitors check bus schedules
            and see where buses have been spotted around town. Built by a local developer, this project relies
            on crowd-sourced reports from fellow commuters — no official GPS, no government data — just people
            helping people know when the next bus is coming.
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-white border border-gray-200 rounded-xl p-6 sm:p-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">How Live Tracking Works</h2>
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">You Report</h3>
              <p className="text-sm text-gray-600">When you see a bus, tap &ldquo;Report Bus&rdquo; and tell us which route and stop. It takes 10 seconds.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <MapPin className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">We Show It</h3>
              <p className="text-sm text-gray-600">Recent sightings appear on the live map and route pages for 20 minutes, so you know what&rsquo;s moving.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Bus className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Crowd-Powered</h3>
              <p className="text-sm text-gray-600">Accuracy depends entirely on riders reporting. The more people participate, the more useful this becomes for everyone.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">No Official GPS</h3>
              <p className="text-sm text-gray-600">Buses here don&rsquo;t have public GPS trackers. This is a community workaround, not an official tracking system.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Schedule Accuracy */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-3">A Note on Schedules</h2>
        <p className="text-gray-700 leading-relaxed">
          Timings shown here are based on published depot schedules and crowd knowledge. Buses may run late,
          early, or be cancelled without notice — especially during peak seasons or bad weather. If you spot
          an error, please use the feedback form below so we can correct it.
        </p>
      </section>

      {/* Feedback Form */}
      <section id="feedback">
        <div className="bg-white border border-gray-200 rounded-xl p-6 sm:p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Send Feedback</h2>
          <p className="text-sm text-gray-500 mb-6">
            Found a wrong schedule? Hit a bug? Have a suggestion? Let me know.
          </p>
          <FeedbackForm />
        </div>
      </section>
    </main>
  );
}
