const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Scheme = sequelize.define(
  "Scheme",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    identifier: {
      type: DataTypes.STRING(80),
      allowNull: false,
      unique: true
    },
    nameEn: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: "name_en"
    },
    nameHi: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: "name_hi"
    },
    nameGu: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: "name_gu"
    },
    shortDescriptionEn: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: "short_description_en"
    },
    shortDescriptionHi: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "short_description_hi"
    },
    shortDescriptionGu: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "short_description_gu"
    },
    benefitsEn: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: "benefits_en"
    },
    benefitsHi: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "benefits_hi"
    },
    benefitsGu: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "benefits_gu"
    },
    category: {
      type: DataTypes.STRING(60),
      allowNull: false,
      defaultValue: "income_support"
    },
    scope: {
      type: DataTypes.ENUM("central", "state", "district"),
      allowNull: false,
      defaultValue: "central"
    },
    stateApplicability: {
      type: DataTypes.STRING(150),
      allowNull: false,
      defaultValue: "All India",
      field: "state_applicability"
    },
    districtApplicability: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: "All Districts",
      field: "district_applicability"
    },
    department: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    officialDomain: {
      type: DataTypes.STRING(150),
      allowNull: false,
      field: "official_domain"
    },
    officialInfoUrl: {
      type: DataTypes.STRING(500),
      allowNull: false,
      field: "official_info_url"
    },
    officialApplicationUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: "official_application_url"
    },
    applicationWindowStatus: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: "Open throughout year",
      field: "application_window_status"
    },
    targetBeneficiaries: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: "target_beneficiaries"
    },
    eligibilityRules: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "eligibility_rules",
      comment: "JSON serialized rules criteria"
    },
    exclusionCriteria: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "exclusion_criteria"
    },
    applicationProcessSteps: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "application_process_steps",
      comment: "JSON array of step-by-step instructions"
    },
    requiredDocuments: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "required_documents",
      comment: "JSON array of required document objects"
    },
    lastVerifiedDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: "last_verified_date"
    },
    sourceUrl: {
      type: DataTypes.STRING(500),
      allowNull: false,
      field: "source_url"
    },
    verificationStatus: {
      type: DataTypes.ENUM("verified", "pending_review", "demo_only"),
      allowNull: false,
      defaultValue: "verified",
      field: "verification_status"
    },
    status: {
      type: DataTypes.ENUM("active", "inactive", "temporarily_unavailable"),
      allowNull: false,
      defaultValue: "active"
    }
  },
  {
    tableName: "schemes",
    underscored: true,
    indexes: [
      { fields: ["category"] },
      { fields: ["state_applicability"] },
      { fields: ["status"] },
      { fields: ["verification_status"] }
    ]
  }
);

module.exports = Scheme;
