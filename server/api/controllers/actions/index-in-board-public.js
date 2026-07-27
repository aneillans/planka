/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

/**
 * @swagger
 * /public-boards/{publicId}/actions:
 *   get:
 *     summary: Get activity of a public board
 *     description: |
 *       Retrieves board activity for a publicly shared board. Requires no authentication and is
 *       available only when the board opts into showing activity.
 *     tags:
 *       - Actions
 *     operationId: getPublicBoardActions
 *     security: []
 *     parameters:
 *       - name: publicId
 *         in: path
 *         required: true
 *         description: Public ID of the board
 *         schema:
 *           type: string
 *           example: "b7QK2mTnV4xLpR8sYcW1dZgH"
 *       - name: beforeId
 *         in: query
 *         required: false
 *         description: Cursor for pagination
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Activity retrieved successfully
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */

const { idInput } = require('../../../utils/inputs');

const Errors = {
  BOARD_NOT_FOUND: {
    boardNotFound: 'Board not found',
  },
};

module.exports = {
  inputs: {
    publicId: {
      type: 'string',
      required: true,
    },
    beforeId: idInput,
  },

  exits: {
    boardNotFound: {
      responseType: 'notFound',
    },
  },

  async fn(inputs) {
    const board = await sails.helpers.boards.getOnePublic(inputs.publicId);

    if (!board || !board.publicShowActivity) {
      throw Errors.BOARD_NOT_FOUND;
    }

    const actions = await Action.qm.getByBoardId(board.id, {
      beforeId: inputs.beforeId,
    });

    const userIds = sails.helpers.utils.mapRecords(actions, 'userId', true, true);
    const users = await User.qm.getByIds(userIds);

    return {
      items: actions,
      included: {
        users: sails.helpers.users.presentManyForPublic(users, board.publicId),
      },
    };
  },
};
