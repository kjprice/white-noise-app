import { useWhiteNoise } from './hooks/useWhiteNoise'
import './App.css'

function App() {
  const { isPlaying, isLoading, toggle } = useWhiteNoise()

  return (
    <div className="app">
      <h1>White Noise</h1>
      <button
        className={`play-button ${isPlaying ? 'playing' : ''} ${isLoading ? 'loading' : ''}`}
        onClick={toggle}
        disabled={isLoading}
        aria-label={isPlaying ? 'Stop' : 'Play'}
      >
        {isLoading ? (
          <svg viewBox="0 0 24 24" fill="currentColor" className="spinner">
            <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="30 70" />
          </svg>
        ) : isPlaying ? (
          <svg viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="4" width="4" height="16" />
            <rect x="14" y="4" width="4" height="16" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5,3 19,12 5,21" />
          </svg>
        )}
      </button>
      <p className="status">
        {isLoading ? 'Generating...' : isPlaying ? 'Playing' : 'Tap to play'}
      </p>
    </div>
  )
}

export default App
