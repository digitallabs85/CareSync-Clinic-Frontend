'use client'
import React, { createContext, useContext, useEffect, useState } from 'react'
import { apiService } from '../_utils/apiService'

interface UserProfile {
  name:     string
  location: string
  country:  string
  city:     string
  province: string
}

interface UserProfileContextType {
  profile: UserProfile | null
  loading: boolean
}

const UserProfileContext = createContext<UserProfileContextType>({
  profile: null,
  loading: true,
})

export const useUserProfile = () => useContext(UserProfileContext)

export const UserProfileProvider = ({ children }: { children: React.ReactNode }) => {
  const [profile, setProfile]   = useState<UserProfile | null>(null)
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    // Only fetch for staff (token exists), not for doctors
    const staffToken = localStorage.getItem('token')
    if (!staffToken) { setLoading(false); return }

    apiService.getProfile()
      .then((data) => {
        if (data?.user) {
          setProfile({
            name:     data.user.name     || '',
            location: data.user.location || '',
            country:  data.user.country  || '',
            city:     data.user.city     || '',
            province: data.user.province || '',
          })
        }
      })
      .catch((err) => console.error('Failed to load user profile', err))
      .finally(() => setLoading(false))
  }, [])

  return (
    <UserProfileContext.Provider value={{ profile, loading }}>
      {children}
    </UserProfileContext.Provider>
  )
}