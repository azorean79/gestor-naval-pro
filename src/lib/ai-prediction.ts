// import * as tf from '@tensorflow/tfjs';
// import { collection, getDocs, Firestore } from 'firebase/firestore';
import type { Jangada } from './types';

export class MaintenancePredictor {
  // private db: Firestore;
  private model: Record<string, unknown> | null = null;

  constructor() {
    // this.db = db;
  }

  async loadModel() {
    // Placeholder - TensorFlow model loading disabled
    console.log('AI prediction model loading disabled');
    this.model = {}; // Mock model
  }

  async trainModel() {
    // Placeholder - TensorFlow training disabled
    console.log('AI prediction model training disabled');
    this.model = {}; // Mock model
  }

  predictMaintenanceDays(_features: number[]): number | null {
    // Placeholder - return default prediction
    return 365; // Default 1 year
  }

  async getPredictionForJangada(_jangada: Jangada): Promise<{ daysUntilMaintenance: number; riskLevel: 'low' | 'medium' | 'high' }> {
    // Placeholder - return default prediction
    return { daysUntilMaintenance: 365, riskLevel: 'low' };
  }
}

export const createMaintenancePredictor = (_db: unknown) => new MaintenancePredictor();