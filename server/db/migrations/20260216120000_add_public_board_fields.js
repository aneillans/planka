/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

const UNIQUE_INDEX_NAME = 'board_public_id_unique';

const hasUniqueIndex = async (knex) => {
  const { rows } = await knex.raw("select 1 from pg_class where relname = ? and relkind = 'i'", [
    UNIQUE_INDEX_NAME,
  ]);

  return rows.length > 0;
};

exports.up = async (knex) => {
  const hasIsPublic = await knex.schema.hasColumn('board', 'is_public');
  const hasPublicId = await knex.schema.hasColumn('board', 'public_id');

  if (!hasIsPublic || !hasPublicId) {
    await knex.schema.alterTable('board', (table) => {
      if (!hasIsPublic) {
        table.boolean('is_public').notNullable().defaultTo(false);
      }

      if (!hasPublicId) {
        table.text('public_id');
      }
    });
  }

  if (!(await hasUniqueIndex(knex))) {
    await knex.schema.alterTable('board', (table) => {
      table.unique('public_id');
    });
  }
};

exports.down = async (knex) => {
  const hasIsPublic = await knex.schema.hasColumn('board', 'is_public');
  const hasPublicId = await knex.schema.hasColumn('board', 'public_id');

  if (hasIsPublic || hasPublicId) {
    await knex.schema.alterTable('board', (table) => {
      if (hasIsPublic) {
        table.dropColumn('is_public');
      }

      if (hasPublicId) {
        table.dropColumn('public_id');
      }
    });
  }
};
