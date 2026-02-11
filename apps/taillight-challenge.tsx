import React, { useState, useEffect } from 'react';
import { Lightbulb, Trophy, RotateCcw, TestTube, Upload, Plus, X } from 'lucide-react';

export default function TaillightChallenge() {
  const [cars, setCars] = useState([]);
  const [currentCarIndex, setCurrentCarIndex] = useState(null);
  const [lightLevel, setLightLevel] = useState(0);
  const [maxLightUsed, setMaxLightUsed] = useState(0);
  const [guess, setGuess] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [score, setScore] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [roundsPlayed, setRoundsPlayed] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [gameState, setGameState] = useState('playing');
  const [highScores, setHighScores] = useState([]);
  const [testMode, setTestMode] = useState(false);
  const [logs, setLogs] = useState([]);
  const [playerName, setPlayerName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);
  const [showCarManager, setShowCarManager] = useState(false);
  const [editingCar, setEditingCar] = useState(null);

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { timestamp, message, type }].slice(-10));
  };

  const loadHighScores = () => {
    const saved = localStorage.getItem('taillightScores');
    if (saved) {
      setHighScores(JSON.parse(saved));
    } else {
      setHighScores([]);
    }
  };

  const saveHighScore = (finalScore) => {
    if (!playerName.trim()) return;
    
    // Check if player already exists
    const existingPlayerIndex = highScores.findIndex(
      score => score.name.toLowerCase() === playerName.trim().toLowerCase()
    );
    
    let updated;
    if (existingPlayerIndex >= 0) {
      // Update existing player's score
      updated = [...highScores];
      updated[existingPlayerIndex] = {
        name: playerName.trim(),
        score: finalScore,
        rounds: roundsPlayed + 1,
        date: new Date().toISOString()
      };
      addLog(`Score bijgewerkt voor ${playerName.trim()}: ${finalScore} pts`, 'info');
    } else {
      // Add new player
      const newScore = {
        name: playerName.trim(),
        score: finalScore,
        rounds: roundsPlayed + 1,
        date: new Date().toISOString()
      };
      updated = [...highScores, newScore];
      addLog(`Nieuwe speler toegevoegd: ${playerName.trim()}`, 'info');
    }
    
    // Sort by score and keep top 10
    updated = updated.sort((a, b) => b.score - a.score).slice(0, 10);
    
    setHighScores(updated);
    localStorage.setItem('taillightScores', JSON.stringify(updated));
  };

  const loadNewCar = () => {
    if (cars.length === 0) {
      setCurrentCarIndex(null);
      return;
    }
    const randomIndex = Math.floor(Math.random() * cars.length);
    setCurrentCarIndex(randomIndex);
    setLightLevel(0);
    setMaxLightUsed(0);
    setGuess('');
    setSuggestions([]);
    setFeedback('');
    setGameState('playing');
  };

  const calculatePoints = (light) => {
    const points = Math.round(100 * Math.exp(-4 * light / 100));
    return Math.max(1, points);
  };

  const handleLightChange = (value) => {
    const newValue = Number(value);
    setLightLevel(newValue);
    if (newValue > maxLightUsed) {
      setMaxLightUsed(newValue);
    }
  };

  const handleGuessChange = (value) => {
    setGuess(value);
    
    if (value.length > 0 && cars.length > 0) {
      const allCarNames = cars.flatMap(car => [car.name, ...car.alternatives]);
      const filtered = allCarNames
        .filter(name => name.toLowerCase().includes(value.toLowerCase()))
        .slice(0, 5);
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  };

  const selectSuggestion = (suggestion) => {
    setGuess(suggestion);
    setSuggestions([]);
  };

  const handleGuess = () => {
    addLog('Controleer antwoord knop geklikt', 'info');
    addLog(`Guess waarde: "${guess}"`, 'info');
    addLog(`CurrentCarIndex: ${currentCarIndex}`, 'info');
    
    if (!guess.trim() || currentCarIndex === null) {
      addLog('Geen geldige guess of auto', 'error');
      return;
    }

    // Check if we need to ask for player name
    if (!playerName.trim()) {
      addLog('Naam nog niet ingevuld, tonen naam input', 'info');
      setShowNameInput(true);
      return;
    }

    const currentCar = cars[currentCarIndex];
    addLog(`Controleren tegen auto: ${currentCar.name}`, 'info');
    
    const normalizedGuess = guess.toLowerCase().trim();
    const normalizedName = currentCar.name.toLowerCase();
    const normalizedAlternatives = currentCar.alternatives.map(alt => alt.toLowerCase());
    
    const isCorrect = normalizedGuess === normalizedName || 
                      normalizedAlternatives.includes(normalizedGuess) ||
                      normalizedAlternatives.some(alt => normalizedGuess.includes(alt) || alt.includes(normalizedGuess));

    addLog(`Is correct: ${isCorrect}`, isCorrect ? 'success' : 'error');

    if (isCorrect) {
      const points = calculatePoints(maxLightUsed);
      setScore(points);
      setTotalScore(prev => prev + points);
      setRoundsPlayed(prev => prev + 1);
      setFeedback(`🎉 Correct! +${points} punten`);
      setGameState('correct');
      saveHighScore(totalScore + points);
      addLog(`Correct geraden! +${points} punten`, 'success');
    } else {
      setFeedback(`❌ Helaas! Het was een ${currentCar.name}`);
      setGameState('wrong');
      setRoundsPlayed(prev => prev + 1);
      saveHighScore(totalScore);
      addLog(`Fout geraden. Juiste antwoord: ${currentCar.name}`, 'error');
    }
    setSuggestions([]);
  };

  const handleNextRound = () => {
    loadNewCar();
    setScore(0);
  };

  const handleReset = () => {
    setTotalScore(0);
    setRoundsPlayed(0);
    setScore(0);
    loadNewCar();
  };

  const resetDatabase = () => {
    addLog('Herinitialiseer knop geklikt', 'info');
    addLog('App herinitialiseren...', 'info');
    
    // Clear localStorage
    localStorage.removeItem('taillightScores');
    localStorage.removeItem('taillightCars');
    addLog('localStorage gewist', 'success');
    
    // Reset all state
    setCars([]);
    setCurrentCarIndex(null);
    setTotalScore(0);
    setRoundsPlayed(0);
    setLightLevel(0);
    setMaxLightUsed(0);
    setGuess('');
    setSuggestions([]);
    setFeedback('');
    setGameState('playing');
    setHighScores([]);
    setPlayerName('');
    setShowCarManager(true);
    setEditingCar(null);
    
    addLog('State gereset', 'success');
    addLog('✓ Herinitialiseren voltooid!', 'success');
  };

  const handleAddCar = () => {
    addLog('Auto Toevoegen knop geklikt', 'info');
    setEditingCar({
      id: Date.now(),
      name: '',
      brand: '',
      model: '',
      photoData: null,
      maskData: null,
      alternatives: []
    });
    addLog('Nieuwe auto editor geopend', 'success');
  };

  const handleFileUpload = async (field, file) => {
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setEditingCar(prev => ({
        ...prev,
        [field]: e.target.result
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSaveCar = () => {
    if (!editingCar.name || !editingCar.photoData || !editingCar.maskData) {
      alert('Vul minimaal naam, foto en mask in!');
      return;
    }

    const updatedCars = editingCar.existingIndex !== undefined
      ? cars.map((car, idx) => idx === editingCar.existingIndex ? editingCar : car)
      : [...cars, editingCar];
    
    setCars(updatedCars);
    localStorage.setItem('taillightCars', JSON.stringify(updatedCars));
    addLog(`Auto ${editingCar.existingIndex !== undefined ? 'bijgewerkt' : 'toegevoegd'}: ${editingCar.name}`, 'success');
    setEditingCar(null);
    setShowCarManager(false);
  };

  const handleEditCar = (index) => {
    addLog(`Bewerk knop geklikt voor auto ${index}`, 'info');
    setEditingCar({ ...cars[index], existingIndex: index });
    addLog(`Auto editor geopend voor: ${cars[index].name}`, 'success');
  };

  const handleDeleteCar = (index) => {
    addLog(`Verwijder knop geklikt voor auto ${index}`, 'info');
    
    const carName = cars[index].name;
    addLog(`Auto verwijderen: ${carName}`, 'info');
    
    const updated = cars.filter((_, idx) => idx !== index);
    addLog(`Aantal auto's na verwijderen: ${updated.length}`, 'info');
    
    setCars(updated);
    localStorage.setItem('taillightCars', JSON.stringify(updated));
    
    // If we deleted the current car, reset game
    if (currentCarIndex === index) {
      addLog('Huidige auto verwijderd, game resetten', 'info');
      setCurrentCarIndex(null);
      setLightLevel(0);
      setMaxLightUsed(0);
      setGuess('');
      setFeedback('');
      setGameState('playing');
    } else if (currentCarIndex !== null && currentCarIndex > index) {
      addLog(`CurrentCarIndex aanpassen van ${currentCarIndex} naar ${currentCarIndex - 1}`, 'info');
      setCurrentCarIndex(currentCarIndex - 1);
    }
    
    addLog(`✓ Auto verwijderd: ${carName}`, 'success');
  };

  useEffect(() => {
    const saved = localStorage.getItem('taillightCars');
    if (saved) {
      setCars(JSON.parse(saved));
    }
    loadHighScores();
  }, []);

  useEffect(() => {
    if (cars.length > 0 && currentCarIndex === null) {
      loadNewCar();
    }
  }, [cars]);

  const brightnessValue = (lightLevel / 100) * 0.5;
  const maskOpacity = 1 - (lightLevel / 100);
  const currentPoints = calculatePoints(maxLightUsed);
  const currentCar = currentCarIndex !== null ? cars[currentCarIndex] : null;

  if (showCarManager || !currentCar) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Lightbulb className="text-yellow-400" />
              Taillight Challenge - Auto Beheer
            </h1>
            {cars.length > 0 && (
              <button
                onClick={() => setShowCarManager(false)}
                className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg"
              >
                Terug naar Spel
              </button>
            )}
          </div>

          {/* Car Manager */}
          <div className="mb-6 bg-gray-800 rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-xl">Auto's ({cars.length})</h3>
              <div className="flex gap-2">
                <button
                  onClick={handleAddCar}
                  className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg flex items-center gap-2"
                >
                  <Plus size={20} />
                  Auto Toevoegen
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    resetDatabase();
                  }}
                  disabled={cars.length === 0}
                  className={`px-4 py-2 rounded-lg ${
                    cars.length === 0
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  Herinitialiseer
                </button>
              </div>
            </div>

            {/* Car List */}
            {cars.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                Nog geen auto's toegevoegd. Klik op "Auto Toevoegen" om te beginnen.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {cars.map((car, index) => (
                  <div key={car.id} className="bg-gray-900 rounded-lg p-4">
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <h4 className="font-bold text-lg mb-2">{car.name}</h4>
                        <p className="text-sm text-gray-400">
                          {car.brand} {car.model}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Alternatieven: {car.alternatives.join(', ') || 'geen'}
                        </p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleEditCar(index);
                          }}
                          className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm"
                        >
                          Bewerk
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDeleteCar(index);
                          }}
                          className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm"
                        >
                          Verwijder
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Edit Car Modal */}
          {editingCar && (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50 overflow-y-auto">
              <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full my-8">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold">
                    {editingCar.existingIndex !== undefined ? 'Auto Bewerken' : 'Auto Toevoegen'}
                  </h3>
                  <button
                    onClick={() => setEditingCar(null)}
                    className="text-gray-400 hover:text-white"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm mb-2">Naam *</label>
                    <input
                      type="text"
                      value={editingCar.name}
                      onChange={(e) => setEditingCar(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full bg-gray-700 px-4 py-2 rounded-lg text-white"
                      placeholder="Volkswagen Golf MK7"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm mb-2">Merk</label>
                      <input
                        type="text"
                        value={editingCar.brand}
                        onChange={(e) => setEditingCar(prev => ({ ...prev, brand: e.target.value }))}
                        className="w-full bg-gray-700 px-4 py-2 rounded-lg text-white"
                        placeholder="Volkswagen"
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-2">Model</label>
                      <input
                        type="text"
                        value={editingCar.model}
                        onChange={(e) => setEditingCar(prev => ({ ...prev, model: e.target.value }))}
                        className="w-full bg-gray-700 px-4 py-2 rounded-lg text-white"
                        placeholder="Golf MK7"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm mb-2">Alternatieven (komma gescheiden)</label>
                    <input
                      type="text"
                      defaultValue={editingCar.alternatives.join(', ')}
                      onBlur={(e) => setEditingCar(prev => ({
                        ...prev,
                        alternatives: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                      }))}
                      className="w-full bg-gray-700 px-4 py-2 rounded-lg text-white"
                      placeholder="Volkswagen Golf, Golf, VW Golf"
                    />
                  </div>

                  <div>
                    <label className="block text-sm mb-2">Foto * {editingCar.photoData && '✓'}</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload('photoData', e.target.files[0])}
                      className="w-full bg-gray-700 px-4 py-2 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-gray-600 file:text-white hover:file:bg-gray-500"
                    />
                    {editingCar.photoData && (
                      <img src={editingCar.photoData} className="mt-2 max-h-40 rounded" alt="Preview" />
                    )}
                  </div>

                  <div>
                    <label className="block text-sm mb-2">Mask (PNG met transparantie) * {editingCar.maskData && '✓'}</label>
                    <input
                      type="file"
                      accept="image/png"
                      onChange={(e) => handleFileUpload('maskData', e.target.files[0])}
                      className="w-full bg-gray-700 px-4 py-2 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-gray-600 file:text-white hover:file:bg-gray-500"
                    />
                    {editingCar.maskData && (
                      <img src={editingCar.maskData} className="mt-2 max-h-40 rounded bg-gray-600" alt="Mask Preview" />
                    )}
                  </div>

                  <div className="flex gap-2 justify-end pt-4">
                    <button
                      onClick={() => setEditingCar(null)}
                      className="bg-gray-700 hover:bg-gray-600 px-6 py-2 rounded-lg"
                    >
                      Annuleren
                    </button>
                    <button
                      onClick={handleSaveCar}
                      className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded-lg"
                    >
                      Opslaan
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Activity Log */}
          <div className="mb-6 bg-gray-800 rounded-lg p-4 border-2 border-yellow-500">
            <h3 className="font-bold mb-3 text-yellow-400">⚡ Activiteiten Log</h3>
            <div className="bg-gray-900 rounded-lg p-3 min-h-20 max-h-40 overflow-y-auto">
              {logs.length === 0 ? (
                <div className="text-gray-500 italic text-sm">Geen activiteit</div>
              ) : (
                <div className="space-y-1 text-xs font-mono">
                  {logs.map((log, index) => (
                    <div key={index} className={`${
                      log.type === 'error' ? 'text-red-400' :
                      log.type === 'success' ? 'text-green-400' :
                      'text-gray-300'
                    }`}>
                      <span className="text-gray-600">[{log.timestamp}]</span> {log.message}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {cars.length === 0 && (
            <div className="bg-yellow-900/30 border border-yellow-600 rounded-lg p-6 text-center">
              <p className="text-yellow-400 font-semibold mb-2">Geen auto's geladen</p>
              <p className="text-gray-300 text-sm">Voeg auto's toe om te beginnen spelen</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Lightbulb className="text-yellow-400" />
              Taillight Challenge
            </h1>
            <p className="text-gray-400 text-sm mt-1">Raad de auto aan de achterlichten!</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowCarManager(true)}
              className="p-2 hover:bg-gray-800 rounded-lg"
              title="Auto beheer"
            >
              <Upload size={20} />
            </button>
            <button
              onClick={() => setTestMode(!testMode)}
              className={`p-2 rounded-lg ${testMode ? 'bg-yellow-400 text-black' : 'hover:bg-gray-800'}`}
              title="Test mode"
            >
              <TestTube size={20} />
            </button>
            <button
              onClick={handleReset}
              className="p-2 hover:bg-gray-800 rounded-lg"
              title="Reset game"
            >
              <RotateCcw size={20} />
            </button>
          </div>
        </div>

        {/* Test Mode Info */}
        {testMode && (
          <div className="mb-6 bg-yellow-900/30 border border-yellow-600 rounded-lg p-4">
            <h3 className="font-bold text-yellow-400 mb-2">🧪 Test Mode</h3>
            <div className="text-sm space-y-1">
              <p>Auto: <span className="font-semibold">{currentCar.name}</span></p>
              <p>Light level: {lightLevel}%</p>
              <p>Max light used: {maxLightUsed}%</p>
              <p>Brightness: {(brightnessValue * 100).toFixed(1)}%</p>
              <p>Mask opacity: {(maskOpacity * 100).toFixed(1)}%</p>
              <p>Current points: {currentPoints}</p>
              <p className="text-xs mt-2">Photo data: {currentCar.photoData ? '✓ Geladen' : '✗ Niet geladen'}</p>
              <p className="text-xs">Mask data: {currentCar.maskData ? '✓ Geladen' : '✗ Niet geladen'}</p>
            </div>
          </div>
        )}

        {/* Score Display */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <div className="text-gray-400 text-sm">Ronde</div>
            <div className="text-2xl font-bold">{roundsPlayed + 1}</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <div className="text-gray-400 text-sm">Mogelijk</div>
            <div className="text-2xl font-bold text-yellow-400">{currentPoints}</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <div className="text-gray-400 text-sm">Totaal</div>
            <div className="text-2xl font-bold text-green-400">{totalScore}</div>
          </div>
        </div>

        {/* Car Image with Mask Overlay */}
        <div className="relative mb-6 rounded-2xl overflow-hidden bg-black aspect-video">
          {/* Base photo - always at full brightness */}
          <img
            src={currentCar.photoData}
            alt="Auto achterkant"
            className="absolute inset-0 w-full h-full object-contain"
            style={{ 
              zIndex: 1
            }}
            onLoad={() => addLog('Photo geladen', 'success')}
            onError={() => addLog('Photo FOUT', 'error')}
          />
          
          {/* Black mask with transparent cutouts - opacity decreases as light increases */}
          <img
            src={currentCar.maskData}
            alt="Mask"
            className="absolute inset-0 w-full h-full object-contain pointer-events-none"
            style={{ 
              opacity: maskOpacity,  // At 0% light: opacity=1 (fully black), at 100%: opacity=0 (transparent)
              transition: 'opacity 0.3s ease',
              zIndex: 2
            }}
            onLoad={() => addLog('Mask geladen', 'success')}
            onError={() => addLog('Mask FOUT', 'error')}
          />
        </div>

        {/* Light Slider */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm text-gray-400">Licht toevoegen (max 50%)</label>
            <span className="text-sm text-gray-400">{lightLevel}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={lightLevel}
            onChange={(e) => handleLightChange(e.target.value)}
            disabled={gameState !== 'playing'}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-yellow-400"
          />
          <div className="text-xs text-gray-500 mt-1">
            Meer licht = minder punten • Score gelocked op {maxLightUsed}%
          </div>
        </div>

        {/* Guess Input */}
        {gameState === 'playing' && (
          <div className="mb-6 relative">
            <input
              type="text"
              value={guess}
              onChange={(e) => handleGuessChange(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleGuess()}
              placeholder="Type merk en model..."
              className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-yellow-400 focus:outline-none mb-3"
            />
            
            {suggestions.length > 0 && (
              <div className="absolute w-full bg-gray-800 border border-gray-700 rounded-lg z-10 max-h-48 overflow-y-auto" style={{ top: '100%' }}>
                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    onClick={() => selectSuggestion(suggestion)}
                    className="px-4 py-2 hover:bg-gray-700 cursor-pointer"
                  >
                    {suggestion}
                  </div>
                ))}
              </div>
            )}
            
            <button
              onClick={handleGuess}
              className="w-full bg-yellow-400 text-black font-semibold py-3 rounded-lg hover:bg-yellow-500"
            >
              Controleer antwoord
            </button>
          </div>
        )}

        {/* Name Input Modal */}
        {showNameInput && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
              <h3 className="text-xl font-bold mb-4">Wat is je naam?</h3>
              <p className="text-gray-300 text-sm mb-4">
                Vul je naam in om je score bij te houden in de Top 10.
              </p>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && playerName.trim()) {
                    setShowNameInput(false);
                    handleGuess();
                  }
                }}
                placeholder="Je naam..."
                className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-yellow-400 focus:outline-none mb-4"
                autoFocus
              />
              <button
                onClick={() => {
                  if (playerName.trim()) {
                    setShowNameInput(false);
                    handleGuess();
                  }
                }}
                disabled={!playerName.trim()}
                className={`w-full font-semibold py-3 rounded-lg ${
                  !playerName.trim()
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-yellow-400 text-black hover:bg-yellow-500'
                }`}
              >
                Doorgaan
              </button>
            </div>
          </div>
        )}

        {/* Feedback */}
        {feedback && (
          <div className={`mb-6 p-4 rounded-lg text-center ${
            gameState === 'correct' ? 'bg-green-900/50 border border-green-500' : 'bg-red-900/50 border border-red-500'
          }`}>
            <div className="text-lg font-semibold mb-2">{feedback}</div>
            <button
              onClick={handleNextRound}
              className="bg-white text-black px-6 py-2 rounded-lg font-semibold hover:bg-gray-200"
            >
              Volgende auto →
            </button>
          </div>
        )}

        {/* High Scores */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Trophy className="text-yellow-400" size={20} />
            Top 10 Scores
          </h2>
          {highScores.length === 0 ? (
            <p className="text-gray-400 text-center py-4">Nog geen scores</p>
          ) : (
            <div className="space-y-2">
              {highScores.map((entry, index) => (
                <div key={index} className="flex justify-between items-center bg-gray-900 p-3 rounded">
                  <span className="flex items-center gap-3">
                    <span className="text-yellow-400 font-bold w-6">#{index + 1}</span>
                    <span className="text-white font-semibold">{entry.name || 'Anoniem'}</span>
                    <span className="text-gray-400 text-sm">{entry.rounds} rondes</span>
                  </span>
                  <span className="font-bold text-green-400">{entry.score} pts</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}