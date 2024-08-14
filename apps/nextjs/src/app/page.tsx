import { Mapbox } from '~/components/mapbox'
import { HydrateClient } from '~/trpc/server'

export const runtime = 'edge'

export default function HomePage() {
  return (
    <HydrateClient>
      <div className="h-full w-full p-4">
        <div className="h-full w-full overflow-hidden border">
          <Mapbox />
        </div>
      </div>
    </HydrateClient>
  )
}
