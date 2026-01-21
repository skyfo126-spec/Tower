
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { 
  TowerType, 
  BalloonColor, 
  Balloon, 
  Tower, 
  Projectile, 
  GameState, 
  Point, 
  Particle 
} from './types';
import { 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  INITIAL_GOLD, 
  INITIAL_LIVES, 
  PATH_POINTS, 
  BALLOON_STATS, 
  TOWER_STATS, 
  GAME_SPEEDS,
  TOTAL_WAVES
} from './constants';
import { 
  getDistance, 
  getPathPosition, 
  getTotalPathLength, 
  checkCircleCollision 
} from './utils/math';

const App: React.FC = () => {
  // Game State
  const [gameState, setGameState] = useState<GameState>({
    gold: INITIAL_GOLD,
    lives: INITIAL_LIVES,
    wave: 0,
    isWaveActive: false,
    gameSpeed: 1,
    isPaused: false,
    selectedTowerId: null,
    placingTowerType: null,
  });

  const [mousePos, setMousePos] = useState<Point>({ x: 0, y: 0 });
  const [showGameOver, setShowGameOver] = useState(false);
  const [showVictory, setShowVictory] = useState(false);
  
  // AI Advisor State
  const [aiAdvice, setAiAdvice] = useState<string>("");
  const [isConsultingAI, setIsConsultingAI] = useState(false);

  // Mutable Game Entities (Refs for performance in game loop)
  const balloonsRef = useRef<Balloon[]>([]);
  const towersRef = useRef<Tower[]>([]);
  const projectilesRef = useRef<Projectile[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const waveQueueRef = useRef<{ color: BalloonColor, delay: number }[]>([]);
  const lastTimeRef = useRef<number>(0);
  const totalPathLength = getTotalPathLength(PATH_POINTS);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nextBalloonId = useRef(0);
  const nextProjectileId = useRef(0);
  const nextParticleId = useRef(0);

  // Initialize Canvas and Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const gameLoop = (time: number) => {
      if (lastTimeRef.current === 0) lastTimeRef.current = time;
      const deltaTime = (time - lastTimeRef.current) / 16.67;
      lastTimeRef.current = time;

      if (!gameState.isPaused && !showGameOver && !showVictory) {
        update(deltaTime * gameState.gameSpeed);
      }
      draw(ctx);
      animationFrameId = requestAnimationFrame(gameLoop);
    };

    animationFrameId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [gameState.isPaused, gameState.gameSpeed, showGameOver, showVictory]);

  const update = (dt: number) => {
    if (gameState.isWaveActive && waveQueueRef.current.length > 0) {
      const next = waveQueueRef.current[0];
      next.delay -= dt;
      if (next.delay <= 0) {
        spawnBalloon(next.color);
        waveQueueRef.current.shift();
      }
    } else if (gameState.isWaveActive && balloonsRef.current.length === 0 && waveQueueRef.current.length === 0) {
      setGameState(prev => ({ ...prev, isWaveActive: false }));
    }

    balloonsRef.current.forEach(b => {
      // Handle slow timer
      if (b.slowTimer > 0) {
        b.slowTimer -= dt;
      }

      const effectiveSpeed = b.slowTimer > 0 ? b.speed * 0.5 : b.speed;
      b.distanceTravelled += effectiveSpeed * dt;
      
      const pos = getPathPosition(PATH_POINTS, b.distanceTravelled);
      b.x = pos.x;
      b.y = pos.y;
    });

    const escaped = balloonsRef.current.filter(b => b.distanceTravelled >= totalPathLength);
    if (escaped.length > 0) {
      setGameState(prev => {
        const newLives = Math.max(0, prev.lives - escaped.length);
        if (newLives <= 0) setShowGameOver(true);
        return { ...prev, lives: newLives };
      });
      balloonsRef.current = balloonsRef.current.filter(b => b.distanceTravelled < totalPathLength);
    }

    towersRef.current.forEach(tower => {
      if (tower.cooldown > 0) {
        tower.cooldown -= dt;
      } else {
        const targets = balloonsRef.current
          .filter(b => getDistance(tower, b) <= tower.range)
          .sort((a, b) => b.distanceTravelled - a.distanceTravelled);

        if (targets.length > 0) {
          fireTower(tower, targets[0]);
        }
      }
    });

    projectilesRef.current.forEach(p => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      const moveDist = Math.sqrt(p.vx * p.vx + p.vy * p.vy) * dt;
      p.rangeRemaining -= moveDist;

      balloonsRef.current.forEach(b => {
        if (checkCircleCollision(p, p.radius, b, b.radius)) {
          handleHit(p, b);
          p.rangeRemaining = -1;
        }
      });
    });

    projectilesRef.current = projectilesRef.current.filter(p => p.rangeRemaining > 0);

    particlesRef.current.forEach(p => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
    });
    particlesRef.current = particlesRef.current.filter(p => p.life > 0);
  };

  const draw = (ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.fillStyle = '#4ade80';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.beginPath();
    ctx.lineWidth = 50;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#d1d5db';
    PATH_POINTS.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
    ctx.stroke();

    ctx.beginPath();
    ctx.lineWidth = 40;
    ctx.strokeStyle = '#92400e';
    PATH_POINTS.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
    ctx.stroke();

    particlesRef.current.forEach(p => {
      ctx.globalAlpha = p.life / 20;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1.0;

    balloonsRef.current.forEach(b => {
      ctx.fillStyle = b.color;
      ctx.shadowColor = 'rgba(0,0,0,0.3)';
      ctx.shadowBlur = 4;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();

      // If slowed, draw an ice overlay
      if (b.slowTimer > 0) {
        ctx.fillStyle = 'rgba(191, 219, 254, 0.5)';
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius + 2, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.beginPath();
      ctx.arc(b.x - b.radius * 0.3, b.y - b.radius * 0.3, b.radius * 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    towersRef.current.forEach(t => {
      const isSelected = gameState.selectedTowerId === t.id;
      if (isSelected) {
        ctx.beginPath();
        ctx.arc(t.x, t.y, t.range, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      ctx.save();
      ctx.translate(t.x, t.y);
      drawTowerSprite(ctx, t);
      ctx.restore();
    });

    projectilesRef.current.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    if (gameState.placingTowerType) {
      const stats = TOWER_STATS[gameState.placingTowerType];
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.arc(mousePos.x, mousePos.y, stats.range, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.fill();
      ctx.save();
      ctx.translate(mousePos.x, mousePos.y);
      drawTowerSprite(ctx, { type: gameState.placingTowerType, level: 0 } as any);
      ctx.restore();
      ctx.globalAlpha = 1.0;
    }
  };

  const drawTowerSprite = (ctx: CanvasRenderingContext2D, t: Tower) => {
    const size = 30;
    if (t.type === TowerType.DART_MONKEY) {
      ctx.fillStyle = '#b45309';
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath(); ctx.arc(-size*0.7, -size*0.3, size*0.3, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(size*0.7, -size*0.3, size*0.3, 0, Math.PI*2); ctx.fill();
    } else if (t.type === TowerType.TACK_SHOOTER) {
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-size, -size, size * 2, size * 2);
      ctx.strokeStyle = '#7f1d1d';
      ctx.lineWidth = 4;
      ctx.strokeRect(-size, -size, size * 2, size * 2);
    } else if (t.type === TowerType.CANNON) {
      ctx.fillStyle = '#374151';
      ctx.beginPath();
      ctx.arc(0, 0, size, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#111827';
      ctx.fillRect(-size * 0.2, -size * 1.5, size * 0.4, size * 1.5);
    } else if (t.type === TowerType.ICE_TOWER) {
      ctx.fillStyle = '#60a5fa';
      ctx.beginPath();
      ctx.moveTo(0, -size);
      ctx.lineTo(size * 0.8, size * 0.8);
      ctx.lineTo(-size * 0.8, size * 0.8);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#1d4ed8';
      ctx.lineWidth = 3;
      ctx.stroke();
    }
    ctx.fillStyle = '#fde047';
    for(let i=0; i<t.level; i++) {
      ctx.beginPath();
      ctx.arc(-size + 10 + i * 15, size + 10, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const spawnBalloon = (color: BalloonColor, distance = 0) => {
    const stats = BALLOON_STATS[color];
    const id = `balloon-${nextBalloonId.current++}`;
    balloonsRef.current.push({
      id, color, health: stats.health, maxHealth: stats.health, speed: stats.speed, slowTimer: 0,
      distanceTravelled: distance, ...getPathPosition(PATH_POINTS, distance), radius: stats.radius
    });
  };

  const fireTower = (tower: Tower, target: Balloon) => {
    const stats = TOWER_STATS[tower.type];
    const dx = target.x - tower.x;
    const dy = target.y - tower.y;
    const angle = Math.atan2(dy, dx);
    const speed = 10;
    const currentCooldown = stats.cooldown + TOWER_STATS[tower.type].upgrades.slice(0, tower.level).reduce((acc, u) => acc + u.cooldown, 0);
    tower.cooldown = currentCooldown;

    if (tower.type === TowerType.DART_MONKEY) {
      spawnProjectile(tower, tower.x, tower.y, Math.cos(angle) * speed, Math.sin(angle) * speed);
      if (tower.level >= 3) spawnProjectile(tower, tower.x, tower.y, Math.cos(angle + 0.2) * speed, Math.sin(angle + 0.2) * speed);
    } else if (tower.type === TowerType.TACK_SHOOTER) {
      const count = tower.level >= 3 ? 12 : 8;
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2;
        spawnProjectile(tower, tower.x, tower.y, Math.cos(a) * speed, Math.sin(a) * speed);
      }
    } else if (tower.type === TowerType.CANNON) {
      spawnProjectile(tower, tower.x, tower.y, Math.cos(angle) * speed, Math.sin(angle) * speed);
    } else if (tower.type === TowerType.ICE_TOWER) {
      // Ice tower fires a frost bolt
      spawnProjectile(tower, tower.x, tower.y, Math.cos(angle) * speed * 0.8, Math.sin(angle) * speed * 0.8);
    }
  };

  const spawnProjectile = (tower: Tower, x: number, y: number, vx: number, vy: number) => {
    const stats = TOWER_STATS[tower.type] as any;
    const totalDmg = stats.damage + TOWER_STATS[tower.type].upgrades.slice(0, tower.level).reduce((acc, u: any) => acc + u.damage, 0);
    const id = `proj-${nextProjectileId.current++}`;
    projectilesRef.current.push({
      id, type: tower.type, x, y, vx, vy, damage: totalDmg,
      rangeRemaining: tower.range * 1.5,
      aoe: (tower.type === TowerType.CANNON) ? (stats.aoe || 60) : 0,
      color: tower.type === TowerType.CANNON ? '#111827' : tower.type === TowerType.ICE_TOWER ? '#bfdbfe' : '#fbbf24',
      radius: tower.type === TowerType.CANNON ? 8 : tower.type === TowerType.ICE_TOWER ? 6 : 4
    });
  };

  const handleHit = (p: Projectile, b: Balloon) => {
    // Apply slow if it's an ice tower projectile
    if (p.type === TowerType.ICE_TOWER) {
      b.slowTimer = 90; // Approx 1.5 seconds at 60fps
    }

    if (p.aoe > 0) {
      balloonsRef.current.forEach(otherB => {
        if (getDistance(p, otherB) <= p.aoe) applyDamage(otherB, p.damage);
      });
      createExplosion(p.x, p.y, p.color);
    } else {
      applyDamage(b, p.damage);
    }
  };

  const applyDamage = (b: Balloon, dmg: number) => {
    b.health -= dmg;
    if (b.health <= 0) popBalloon(b);
  };

  const popBalloon = (b: Balloon) => {
    createPopParticles(b.x, b.y, b.color);
    setGameState(prev => ({ ...prev, gold: prev.gold + 1 }));
    let next: BalloonColor | null = null;
    if (b.color === BalloonColor.PINK) next = BalloonColor.YELLOW;
    else if (b.color === BalloonColor.YELLOW) next = BalloonColor.GREEN;
    else if (b.color === BalloonColor.GREEN) next = BalloonColor.BLUE;
    else if (b.color === BalloonColor.BLUE) next = BalloonColor.RED;
    if (next) {
      // Children inherit slow state partially or start fresh? Let's keep slow for consistency.
      spawnBalloon(next, b.distanceTravelled);
      spawnBalloon(next, b.distanceTravelled - 10);
      const last2 = balloonsRef.current.slice(-2);
      last2.forEach(child => child.slowTimer = b.slowTimer);
    }
    balloonsRef.current = balloonsRef.current.filter(other => other.id !== b.id);
  };

  const createPopParticles = (x: number, y: number, color: string) => {
    for (let i = 0; i < 6; i++) {
      particlesRef.current.push({
        id: `p-${nextParticleId.current++}`, x, y,
        vx: (Math.random() - 0.5) * 4, vy: (Math.random() - 0.5) * 4,
        life: 20, color, size: 3 + Math.random() * 3
      });
    }
  };

  const createExplosion = (x: number, y: number, color: string) => {
    for (let i = 0; i < 15; i++) {
      particlesRef.current.push({
        id: `p-${nextParticleId.current++}`, x, y,
        vx: (Math.random() - 0.5) * 8, vy: (Math.random() - 0.5) * 8,
        life: 30, color: '#f97316', size: 5 + Math.random() * 5
      });
    }
  };

  const startNextWave = () => {
    if (gameState.isWaveActive) return;
    if (gameState.wave >= TOTAL_WAVES) {
      setShowVictory(true);
      return;
    }
    const nextWave = gameState.wave + 1;
    const queue: { color: BalloonColor, delay: number }[] = [];
    const count = 5 + nextWave * 2;
    for (let i = 0; i < count; i++) {
      let color = BalloonColor.RED;
      if (nextWave > 25) color = Math.random() > 0.5 ? BalloonColor.PINK : BalloonColor.YELLOW;
      else if (nextWave > 15) color = Math.random() > 0.6 ? BalloonColor.YELLOW : BalloonColor.GREEN;
      else if (nextWave > 8) color = Math.random() > 0.7 ? BalloonColor.GREEN : BalloonColor.BLUE;
      else if (nextWave > 3) color = Math.random() > 0.8 ? BalloonColor.BLUE : BalloonColor.RED;
      queue.push({ color, delay: i === 0 ? 0 : 30 + Math.random() * 20 });
    }
    waveQueueRef.current = queue;
    setGameState(prev => ({ ...prev, wave: nextWave, isWaveActive: true }));
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (gameState.placingTowerType) {
      const stats = TOWER_STATS[gameState.placingTowerType];
      if (gameState.gold >= stats.cost) {
        const newTower: Tower = {
          id: `tower-${Date.now()}`, type: gameState.placingTowerType, x, y,
          level: 0, cooldown: 0, maxCooldown: stats.cooldown, range: stats.range,
          cost: stats.cost, totalInvested: stats.cost
        };
        towersRef.current.push(newTower);
        setGameState(prev => ({ ...prev, gold: prev.gold - stats.cost, placingTowerType: null, selectedTowerId: newTower.id }));
      }
    } else {
      const clicked = towersRef.current.find(t => getDistance({ x, y }, t) < 30);
      setGameState(prev => ({ ...prev, selectedTowerId: clicked?.id || null }));
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const upgradeSelectedTower = () => {
    if (!gameState.selectedTowerId) return;
    const tower = towersRef.current.find(t => t.id === gameState.selectedTowerId);
    if (!tower || tower.level >= 3) return;
    const upgrade = TOWER_STATS[tower.type].upgrades[tower.level];
    if (gameState.gold >= upgrade.cost) {
      tower.level += 1;
      tower.range += upgrade.range;
      tower.totalInvested += upgrade.cost;
      setGameState(prev => ({ ...prev, gold: prev.gold - upgrade.cost }));
    }
  };

  const sellSelectedTower = () => {
    if (!gameState.selectedTowerId) return;
    const tower = towersRef.current.find(t => t.id === gameState.selectedTowerId);
    if (!tower) return;
    const refund = Math.floor(tower.totalInvested * 0.7);
    towersRef.current = towersRef.current.filter(t => t.id !== tower.id);
    setGameState(prev => ({ ...prev, gold: prev.gold + refund, selectedTowerId: null }));
  };

  const askAIAdvisor = async () => {
    if (isConsultingAI) return;
    setIsConsultingAI(true);
    setAiAdvice("Consulting Strategist...");
    try {
      const ai = new GoogleGenAI({ apiKey: "AIzaSyArGngnqBqluG0BThhkieus50_C3RKB5CM" });
      const towerCounts = towersRef.current.reduce((acc: any, t) => {
        acc[t.type] = (acc[t.type] || 0) + 1;
        return acc;
      }, {});
      const prompt = `You are an expert Bloons TD pro.
Context:
Wave: ${gameState.wave}
Gold: ${gameState.gold}
Lives: ${gameState.lives}
Towers: ${JSON.stringify(towerCounts)}
Note: We have a new tower, the Ice Tower, which slows enemies.
Advice: 1 short sentence on what to build or upgrade next.`;
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });
      setAiAdvice(response.text || "Build more towers!");
    } catch (e) {
      setAiAdvice("Strategist is sleeping (API error).");
    } finally {
      setIsConsultingAI(false);
    }
  };

  const selectedTower = towersRef.current.find(t => t.id === gameState.selectedTowerId);

  return (
    <div className="relative w-full h-screen flex flex-col bg-slate-900 text-white overflow-hidden">
      <div className="h-16 bg-slate-800 flex items-center justify-between px-8 shadow-lg border-b border-slate-700">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2"><span className="text-yellow-400 text-2xl">💰</span><span className="text-xl font-bold font-mono">{gameState.gold}</span></div>
          <div className="flex items-center gap-2"><span className="text-red-500 text-2xl">❤️</span><span className="text-xl font-bold font-mono">{gameState.lives}</span></div>
          <div className="flex flex-col"><span className="text-xs uppercase text-slate-400 font-bold">Wave</span><span className="text-xl font-bold">{gameState.wave}/{TOTAL_WAVES}</span></div>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setGameState(prev => ({ ...prev, isPaused: !prev.isPaused }))} className="p-2 hover:bg-slate-700 rounded transition">{gameState.isPaused ? '▶️' : '⏸️'}</button>
          <div className="flex items-center bg-slate-700 rounded p-1">
            {GAME_SPEEDS.map(s => (
              <button key={s} onClick={() => setGameState(prev => ({ ...prev, gameSpeed: s }))} className={`px-3 py-1 rounded text-xs font-bold transition ${gameState.gameSpeed === s ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>{s}x</button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 bg-black flex items-center justify-center p-4">
          <div className="relative shadow-2xl rounded overflow-hidden border-4 border-slate-800">
            <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} onMouseDown={handleCanvasClick} onMouseMove={handleMouseMove} className="bg-green-500" />
            {showGameOver && <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center animate-fade-in"><h2 className="text-6xl font-black text-red-500 mb-4">GAME OVER</h2><button onClick={() => window.location.reload()} className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-full font-bold">RETRY</button></div>}
            {showVictory && <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center animate-fade-in"><h2 className="text-6xl font-black text-yellow-400 mb-4">VICTORY!</h2><button onClick={() => window.location.reload()} className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-full font-bold">PLAY AGAIN</button></div>}
          </div>
        </div>

        <div className="w-80 bg-slate-800 border-l border-slate-700 flex flex-col p-6 gap-6 overflow-y-auto">
          <button onClick={startNextWave} disabled={gameState.isWaveActive} className={`w-full py-4 rounded-xl font-black text-xl shadow-xl transition ${gameState.isWaveActive ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-green-600 hover:bg-green-500 text-white'}`}>{gameState.isWaveActive ? 'WAVE IN PROGRESS' : 'NEXT WAVE'}</button>
          
          <div className="flex flex-col gap-2">
            <button onClick={askAIAdvisor} disabled={isConsultingAI} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition">
              <span>{isConsultingAI ? '🤔' : '💡'}</span><span>AI Advice</span>
            </button>
            {aiAdvice && <div className="p-3 bg-indigo-900/30 border border-indigo-700/50 rounded-lg text-xs italic text-indigo-200 animate-slide-up">"{aiAdvice}"</div>}
          </div>

          <div className="flex flex-col gap-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Shop</h3>
            <div className="grid grid-cols-1 gap-3">
              {(Object.entries(TOWER_STATS) as [TowerType, any][]).map(([type, stats]) => (
                <button key={type} onClick={() => setGameState(prev => ({ ...prev, placingTowerType: prev.placingTowerType === type ? null : type, selectedTowerId: null }))} disabled={gameState.gold < stats.cost} className={`relative flex items-center p-3 rounded-xl border-2 transition ${gameState.placingTowerType === type ? 'bg-indigo-900/50 border-indigo-500' : 'bg-slate-700/50 border-slate-700 hover:border-slate-500'} ${gameState.gold < stats.cost ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}>
                  <div className="w-12 h-12 bg-slate-600 rounded-lg flex items-center justify-center text-2xl mr-4">
                    {type === TowerType.DART_MONKEY ? '🐒' : type === TowerType.TACK_SHOOTER ? '⚙️' : type === TowerType.CANNON ? '💣' : '❄️'}
                  </div>
                  <div className="flex flex-col items-start"><span className="font-bold text-sm">{stats.name}</span><span className="text-xs text-yellow-400 font-mono">${stats.cost}</span></div>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-auto">
            {selectedTower ? (
              <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700 animate-slide-up">
                <div className="flex justify-between items-start mb-4"><div><h4 className="font-bold text-indigo-400">{TOWER_STATS[selectedTower.type].name}</h4><p className="text-xs text-slate-400">Level {selectedTower.level}</p></div><button onClick={() => setGameState(prev => ({ ...prev, selectedTowerId: null }))} className="text-slate-500">✕</button></div>
                <div className="grid grid-cols-2 gap-2 text-[10px] mb-4 text-slate-400 uppercase font-bold"><div className="bg-slate-800 p-2 rounded">Range: {selectedTower.range}</div><div className="bg-slate-800 p-2 rounded">Value: {selectedTower.totalInvested}</div></div>
                {selectedTower.level < 3 ? (<button onClick={upgradeSelectedTower} disabled={gameState.gold < TOWER_STATS[selectedTower.type].upgrades[selectedTower.level].cost} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 py-3 rounded-lg font-bold text-sm transition mb-2">UPGRADE: ${TOWER_STATS[selectedTower.type].upgrades[selectedTower.level].cost}</button>) : (<div className="w-full bg-slate-700 py-3 rounded-lg font-bold text-sm text-center mb-2 text-indigo-400">MAX LEVEL</div>)}
                <button onClick={sellSelectedTower} className="w-full bg-red-900/50 hover:bg-red-900 border border-red-800 py-2 rounded-lg font-bold text-xs transition">SELL: ${Math.floor(selectedTower.totalInvested * 0.7)}</button>
              </div>
            ) : (<div className="h-32 flex items-center justify-center border-2 border-dashed border-slate-700 rounded-xl text-slate-500 text-sm italic text-center px-4">Select a tower to inspect</div>)}
          </div>
        </div>
      </div>
      <style>{`@keyframes fade-in { from { opacity: 0; } to { opacity: 1; } } @keyframes slide-up { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } } .animate-fade-in { animation: fade-in 0.5s ease-out forwards; } .animate-slide-up { animation: slide-up 0.3s ease-out forwards; }`}</style>
    </div>
  );
};

export default App;
