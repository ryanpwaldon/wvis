import { Home } from '~/components/home'
import { HydrateClient } from '~/trpc/server'

export const runtime = 'edge'

export default function HomePage() {
  return (
    <HydrateClient>
      <Home />
    </HydrateClient>
  )
}
