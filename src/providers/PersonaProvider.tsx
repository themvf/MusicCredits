'use client'

import { createContext, useContext, useEffect, useState } from 'react'

const STORAGE_KEY = 'soundswap_persona'

type Persona = 'artist' | 'curator'

interface PersonaContextValue {
  persona: Persona
  setPersona: (p: Persona) => void
  role: string
  curatorActive: boolean
}

const PersonaContext = createContext<PersonaContextValue | null>(null)

export function PersonaProvider({
  children,
  role,
  curatorActive,
}: {
  children: React.ReactNode
  role: string
  curatorActive: boolean
}) {
  const [persona, setPersonaState] = useState<Persona>('artist')

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Persona | null
    if (stored === 'curator' && role === 'both' && curatorActive) {
      setPersonaState('curator')
    } else {
      // Stored value is stale (role reverted or curator suspended) — clear it
      if (stored === 'curator') localStorage.removeItem(STORAGE_KEY)
      setPersonaState('artist')
    }
  }, [role, curatorActive])

  function setPersona(p: Persona) {
    setPersonaState(p)
    localStorage.setItem(STORAGE_KEY, p)
  }

  return (
    <PersonaContext.Provider value={{ persona, setPersona, role, curatorActive }}>
      {children}
    </PersonaContext.Provider>
  )
}

export function usePersona() {
  const ctx = useContext(PersonaContext)
  if (!ctx) throw new Error('usePersona must be used within PersonaProvider')
  return ctx
}
