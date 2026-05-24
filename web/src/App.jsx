import React, { useEffect, useState } from 'react'
import { auth, provider } from './firebase'
import { signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth'

export default function App() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u))
    return () => unsub()
  }, [])

  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, provider)
    } catch (err) {
      console.error('Sign-in error', err)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut(auth)
    } catch (err) {
      console.error('Sign-out error', err)
    }
  }

  return (
    <div style={{fontFamily: 'system-ui, sans-serif', padding: 24}}>
      <h1>Crackers — React + Firebase</h1>
      {user ? (
        <div>
          <p>Signed in as <strong>{user.displayName}</strong></p>
          <button onClick={handleSignOut}>Sign out</button>
        </div>
      ) : (
        <div>
          <p>Not signed in</p>
          <button onClick={handleSignIn}>Sign in with Google</button>
        </div>
      )}
    </div>
  )
}
