import { HydrateClient } from '~/trpc/server'

export const runtime = 'edge'

export default function HomePage() {
  return (
    <HydrateClient>
      <div className="h-full w-full"></div>
    </HydrateClient>
  )
}
