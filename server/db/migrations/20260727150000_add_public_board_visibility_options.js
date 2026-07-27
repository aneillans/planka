/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

const COLUMN_NAMES = ['public_show_members', 'public_show_comments', 'public_show_activity'];

// Checked sequentially: concurrent queries on a single pg client are deprecated.
const getColumnPresence = (knex) =>
  COLUMN_NAMES.reduce(async (accPromise, columnName) => {
    const acc = await accPromise;
    const hasColumn = await knex.schema.hasColumn('board', columnName);

    return [...acc, hasColumn];
  }, Promise.resolve([]));

const getExistingColumnNames = async (knex) => {
  const flags = await getColumnPresence(knex);

  return COLUMN_NAMES.filter((columnName, index) => flags[index]);
};

exports.up = async (knex) => {
  const flags = await getColumnPresence(knex);
  const missingColumnNames = COLUMN_NAMES.filter((columnName, index) => !flags[index]);

  if (missingColumnNames.length === 0) {
    return;
  }

  await knex.schema.alterTable('board', (table) => {
    missingColumnNames.forEach((columnName) => {
      table.boolean(columnName).notNullable().defaultTo(false);
    });
  });
};

exports.down = async (knex) => {
  const existingColumnNames = await getExistingColumnNames(knex);

  if (existingColumnNames.length === 0) {
    return;
  }

  await knex.schema.alterTable('board', (table) => {
    existingColumnNames.forEach((columnName) => {
      table.dropColumn(columnName);
    });
  });
};
