import { HydrateClient } from '~/trpc/server'

export const runtime = 'edge'

export default function HomePage() {
  return (
    <HydrateClient>
      <div className="container h-screen py-16"></div>
    </HydrateClient>
  )
}
