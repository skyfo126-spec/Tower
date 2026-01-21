
import { TowerType, BalloonColor, Point } from './types';

export const CANVAS_WIDTH = 1000;
export const CANVAS_HEIGHT = 650;

export const INITIAL_GOLD = 1000;
export const INITIAL_LIVES = 150; // Increased from 100 to 150
export const TOTAL_WAVES = 30;

export const GAME_SPEEDS = [1, 2, 4];

export const PATH_POINTS: Point[] = [
  { x: 0, y: 150 },
  { x: 200, y: 150 },
  { x: 300, y: 150 },
  { x: 400, y: 150 },
  { x: 500, y: 300 },
  { x: 500, y: 500 },
  { x: 400, y: 600 },
  { x: 200, y: 600 },
  { x: 100, y: 500 },
  { x: 100, y: 350 },
  { x: 250, y: 250 },
  { x: 700, y: 250 },
  { x: 850, y: 350 },
  { x: 850, y: 550 },
  { x: 1000, y: 550 }
];

export const BALLOON_STATS = {
  [BalloonColor.RED]: { health: 1, speed: 1.2, color: '#ef4444', radius: 15 }, // Speed reduced 1.5 -> 1.2
  [BalloonColor.BLUE]: { health: 2, speed: 1.6, color: '#3b82f6', radius: 17 }, // Speed reduced 2.0 -> 1.6
  [BalloonColor.GREEN]: { health: 3, speed: 2.0, color: '#22c55e', radius: 19 }, // Speed reduced 2.5 -> 2.0
  [BalloonColor.YELLOW]: { health: 4, speed: 3.5, color: '#eab308', radius: 21 }, // Speed reduced 4.5 -> 3.5
  [BalloonColor.PINK]: { health: 5, speed: 4.5, color: '#ec4899', radius: 23 }, // Speed reduced 5.5 -> 4.5
};

export const TOWER_STATS = {
  [TowerType.DART_MONKEY]: {
    name: 'Dart Monkey',
    cost: 180, // Reduced from 200
    range: 160, // Increased from 150
    cooldown: 35, // Reduced from 40
    damage: 1,
    description: 'Basic tower that shoots darts.',
    upgrades: [
      { name: 'Sharper Darts', cost: 100, range: 20, cooldown: -5, damage: 0 },
      { name: 'Fast Shots', cost: 200, range: 10, cooldown: -10, damage: 0 },
      { name: 'Double Darts', cost: 450, range: 30, cooldown: -5, damage: 1 },
    ]
  },
  [TowerType.TACK_SHOOTER]: {
    name: 'Tack Shooter',
    cost: 250, // Reduced from 300
    range: 110, // Increased from 100
    cooldown: 55, // Reduced from 60
    damage: 1,
    description: 'Fires tacks in 8 directions.',
    upgrades: [
      { name: 'Extra Range', cost: 120, range: 40, cooldown: 0, damage: 0 },
      { name: 'Faster Reload', cost: 250, range: 0, cooldown: -20, damage: 0 },
      { name: 'Super Tacks', cost: 550, range: 20, cooldown: -10, damage: 1 },
    ]
  },
  [TowerType.CANNON]: {
    name: 'Bomb Cannon',
    cost: 550, // Reduced from 600
    range: 230, // Increased from 220
    cooldown: 70, // Reduced from 80
    damage: 1,
    aoe: 70, // Increased from 60
    description: 'Heavy damage with area of effect.',
    upgrades: [
      { name: 'Bigger Bombs', cost: 350, range: 20, cooldown: 0, damage: 1 },
      { name: 'Long Range', cost: 300, range: 80, cooldown: 0, damage: 0 },
      { name: 'Rapid Fire', cost: 750, range: 10, cooldown: -30, damage: 1 },
    ]
  },
  [TowerType.ICE_TOWER]: {
    name: 'Ice Tower',
    cost: 400, // Reduced from 450
    range: 140, // Increased from 130
    cooldown: 45, // Reduced from 50
    damage: 0,
    description: 'Freezes bloons, slowing them down.',
    upgrades: [
      { name: 'Deep Freeze', cost: 180, range: 20, cooldown: 0, damage: 0 },
      { name: 'Frostbite', cost: 350, range: 0, cooldown: -15, damage: 1 },
      { name: 'Arctic Wind', cost: 700, range: 60, cooldown: -10, damage: 0 },
    ]
  }
};
