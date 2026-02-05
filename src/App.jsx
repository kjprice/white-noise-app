import { useWhiteNoise } from './hooks/useWhiteNoise'
import './App.css'

function App() {
  const { isPlaying, toggle } = useWhiteNoise()

  return (
    <div className="app">
      <h1>White Noise</h1>
      <button
        className={`play-button ${isPlaying ? 'playing' : ''}`}
        onClick={toggle}
        aria-label={isPlaying ? 'Stop' : 'Play'}
      >
        {isPlaying ? (
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
      <p className="status">{isPlaying ? 'Playing' : 'Tap to play'}</p>
    </div>
  )
}

export default App
