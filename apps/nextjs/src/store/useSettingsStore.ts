import type { Unit } from '@acme/shared'
import type { StateCreator } from 'zustand'
import type { PersistOptions } from 'zustand/middleware'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

// Define the shape of your state
interface SettingsState {
  windUnits: Unit
  waveUnits: Unit
  setWindUnits: (units: Unit) => void
  setWaveUnits: (units: Unit) => void
}

// Define the persist options
type SettingsPersist = (config: StateCreator<SettingsState>, options: PersistOptions<SettingsState>) => StateCreator<SettingsState>

// Create the store
export const useSettingsStore = create<SettingsState>()(
  (persist as SettingsPersist)(
    (set) => ({
      windUnits: 'm',
      waveUnits: 'm',
      setWindUnits: (units: Unit) => set({ windUnits: units }),
      setWaveUnits: (units: Unit) => set({ waveUnits: units }),
    }),
    {
      name: 'settings',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
