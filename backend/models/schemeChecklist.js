const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const SchemeChecklist = sequelize.define(
  "SchemeChecklist",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "user_id"
    },
    schemeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "scheme_id"
    },
    checkedDocumentIds: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: "[]",
      field: "checked_document_ids",
      comment: "JSON serialized array of checked doc identifiers"
    }
  },
  {
    tableName: "scheme_checklists",
    underscored: true,
    indexes: [
      { unique: true, fields: ["user_id", "scheme_id"] }
    ]
  }
);

module.exports = SchemeChecklist;
