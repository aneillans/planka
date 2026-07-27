/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

// Resolves a board from its public id for anonymous access. Returns undefined unless the board is
// actually shared publicly, so callers can treat that uniformly as "not found" and never disclose
// whether a given public id exists.

module.exports = {
  inputs: {
    publicId: {
      type: 'string',
      required: true,
    },
  },

  async fn(inputs) {
    const board = await Board.qm.getOneByPublicId(inputs.publicId);

    if (!board || !board.isPublic) {
      return undefined;
    }

    return board;
  },
};
