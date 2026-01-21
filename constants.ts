
import { TowerType, BalloonColor, Point } from './types';

export const CANVAS_WIDTH = 1000;
export const CANVAS_HEIGHT = 650;

export const INITIAL_GOLD = 650;
export const INITIAL_LIVES = 100;
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
  [BalloonColor.RED]: { health: 1, speed: 1.5, color: '#ef4444', radius: 15 },
  [BalloonColor.BLUE]: { health: 2, speed: 2.0, color: '#3b82f6', radius: 17 },
  [BalloonColor.GREEN]: { health: 3, speed: 2.5, color: '#22c55e', radius: 19 },
  [BalloonColor.YELLOW]: { health: 4, speed: 4.5, color: '#eab308', radius: 21 },
  [BalloonColor.PINK]: { health: 5, speed: 5.5, color: '#ec4899', radius: 23 },
};

export const TOWER_STATS = {
  [TowerType.DART_MONKEY]: {
    name: 'Dart Monkey',
    cost: 200,
    range: 150,
    cooldown: 40,
    damage: 1,
    description: 'Basic tower that shoots darts.',
    upgrades: [
      { name: 'Sharper Darts', cost: 120, range: 20, cooldown: -5, damage: 0 },
      { name: 'Fast Shots', cost: 250, range: 10, cooldown: -10, damage: 0 },
      { name: 'Double Darts', cost: 500, range: 30, cooldown: -5, damage: 1 },
    ]
  },
  [TowerType.TACK_SHOOTER]: {
    name: 'Tack Shooter',
    cost: 300,
    range: 100,
    cooldown: 60,
    damage: 1,
    description: 'Fires tacks in 8 directions.',
    upgrades: [
      { name: 'Extra Range', cost: 150, range: 40, cooldown: 0, damage: 0 },
      { name: 'Faster Reload', cost: 300, range: 0, cooldown: -20, damage: 0 },
      { name: 'Super Tacks', cost: 600, range: 20, cooldown: -10, damage: 1 },
    ]
  },
  [TowerType.CANNON]: {
    name: 'Bomb Cannon',
    cost: 600,
    range: 220,
    cooldown: 80,
    damage: 1,
    aoe: 60,
    description: 'Heavy damage with area of effect.',
    upgrades: [
      { name: 'Bigger Bombs', cost: 400, range: 20, cooldown: 0, damage: 1 },
      { name: 'Long Range', cost: 350, range: 80, cooldown: 0, damage: 0 },
      { name: 'Rapid Fire', cost: 800, range: 10, cooldown: -30, damage: 1 },
    ]
  },
  [TowerType.ICE_TOWER]: {
    name: 'Ice Tower',
    cost: 450,
    range: 130,
    cooldown: 50,
    damage: 0,
    description: 'Freezes bloons, slowing them down.',
    upgrades: [
      { name: 'Deep Freeze', cost: 200, range: 20, cooldown: 0, damage: 0 },
      { name: 'Frostbite', cost: 400, range: 0, cooldown: -15, damage: 1 },
      { name: 'Arctic Wind', cost: 800, range: 60, cooldown: -10, damage: 0 },
    ]
  }
};
