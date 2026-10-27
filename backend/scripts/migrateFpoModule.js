/**
 * migrateFpoModule.js
 * Creates MySQL tables for FPO Module:
 * - fpo_memberships
 * - crop_aggregations
 * - aggregation_items
 * - fpo_procurement_offers
 * HarvestMitra AI
 */

const sequelize = require('../config/database');
const { FpoMembership, CropAggregation, AggregationItem, FpoProcurementOffer, User, FarmerProfile } = require('../models');

async function runMigration() {
  try {
    console.log('🔄 Starting FPO Module database sync...');

    await FpoMembership.sync({ alter: true });
    console.log('✅ fpo_memberships table verified / altered.');

    await CropAggregation.sync({ alter: true });
    console.log('✅ crop_aggregations table verified / altered.');

    await AggregationItem.sync({ alter: true });
    console.log('✅ aggregation_items table verified / altered.');

    await FpoProcurementOffer.sync({ alter: true });
    console.log('✅ fpo_procurement_offers table verified / altered.');

    // Seed initial memberships for existing FPO leaders if empty
    const fpoLeaders = await User.findAll({
      where: { role: ['fpo_leader', 'fpo'] },
      include: [FarmerProfile]
    });

    console.log(`ℹ️ Found ${fpoLeaders.length} registered FPO accounts in database.`);

    for (const fpo of fpoLeaders) {
      // Find farmers in the same district or available farmers
      const district = fpo.FarmerProfile?.district || 'Pune';
      const farmers = await User.findAll({
        where: { role: 'farmer' },
        include: [{
          model: FarmerProfile,
          where: { district }
        }],
        limit: 3
      });

      for (const farmer of farmers) {
        if (farmer.id === fpo.id) continue;
        const [membership, created] = await FpoMembership.findOrCreate({
          where: {
            fpoId: fpo.id,
            farmerId: farmer.id
          },
          defaults: {
            status: 'active',
            invitedBy: 'fpo',
            consentShareCrops: true,
            consentShareContact: true,
            joinedAt: new Date(),
            notes: `Founding member of ${fpo.FarmerProfile?.fpoName || fpo.name}`
          }
        });
        if (created) {
          console.log(`🌱 Created initial active membership: FPO ${fpo.name} <-> Farmer ${farmer.name}`);
        }
      }
    }

    console.log('🎉 FPO Module migration completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ FPO Module migration error:', err);
    process.exit(1);
  }
}

runMigration();
