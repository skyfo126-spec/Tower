
export enum TowerType {
  DART_MONKEY = 'DART_MONKEY',
  TACK_SHOOTER = 'TACK_SHOOTER',
  CANNON = 'CANNON'
}

export enum BalloonColor {
  RED = 'RED',
  BLUE = 'BLUE',
  GREEN = 'GREEN',
  YELLOW = 'YELLOW',
  PINK = 'PINK'
}

export interface Point {
  x: number;
  y: number;
}

export interface Balloon {
  id: string;
  color: BalloonColor;
  health: number;
  maxHealth: number;
  speed: number;
  distanceTravelled: number;
  x: number;
  y: number;
  radius: number;
}

export interface Projectile {
  id: string;
  type: TowerType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  rangeRemaining: number;
  aoe: number;
  color: string;
  radius: number;
}

export interface Tower {
  id: string;
  type: TowerType;
  x: number;
  y: number;
  level: number;
  cooldown: number;
  maxCooldown: number;
  range: number;
  cost: number;
  totalInvested: number;
  lastTargetId?: string;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

export interface GameState {
  gold: number;
  lives: number;
  wave: number;
  isWaveActive: boolean;
  gameSpeed: number;
  isPaused: boolean;
  selectedTowerId: string | null;
  placingTowerType: TowerType | null;
}
