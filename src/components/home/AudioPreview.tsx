import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

const tracks = [
  { name: "Sleep Hypnosis", desc: "Drift into deep, restorative sleep effortlessly." },
  { name: "Stress Relief Meditation", desc: "Melt away tension with guided relaxation." },
  { name: "Confidence Boost", desc: "Build unshakable self-confidence from within." },
  { name: "Deep Relaxation", desc: "Experience profound calm and inner stillness." },
]

export default function AudioPreview() {
  return (
    <section className="py-16">
      <h2 className="text-3xl font-bold text-center mb-4">
        Guided Healing Audio Library
      </h2>
      <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
        Listen to powerful hypnosis sessions, guided meditations, and healing
        audio programs designed to support your journey.
      </p>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {tracks.map((audio) => (
          <Card key={audio.name}>
            <CardHeader>
              <CardTitle className="text-lg">{audio.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{audio.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="text-center mt-10">
        <Button asChild size="lg" className="focus-ring">
          <Link href="/audio">Explore Audio Library</Link>
        </Button>
      </div>
    </section>
  )
}
