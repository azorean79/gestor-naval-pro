import { seedStock as runSeedStock } from './seed_stock.js';

if (require.main === module) {
  runSeedStock()
    .catch((error: unknown) => {
      console.error('Error seeding stock:', error);
      process.exit(1);
    });
}

export async function seedStock(): Promise<void> {
  await runSeedStock();
}
