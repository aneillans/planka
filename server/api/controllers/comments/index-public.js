/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

/**
 * @swagger
 * /public-boards/{publicId}/cards/{cardId}/comments:
 *   get:
 *     summary: Get comments of a card on a public board
 *     description: |
 *       Retrieves comments for a card belonging to a publicly shared board. Requires no
 *       authentication and is available only when the board opts into showing comments.
 *     tags:
 *       - Comments
 *     operationId: getPublicComments
 *     security: []
 *     parameters:
 *       - name: publicId
 *         in: path
 *         required: true
 *         description: Public ID of the board
 *         schema:
 *           type: string
 *           example: "b7QK2mTnV4xLpR8sYcW1dZgH"
 *       - name: cardId
 *         in: path
 *         required: true
 *         description: ID of the card
 *         schema:
 *           type: string
 *           example: "1357158568008091264"
 *       - name: beforeId
 *         in: query
 *         required: false
 *         description: Cursor for pagination
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Comments retrieved successfully
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */

const { idInput } = require('../../../utils/inputs');

const Errors = {
  CARD_NOT_FOUND: {
    cardNotFound: 'Card not found',
  },
};

module.exports = {
  inputs: {
    publicId: {
      type: 'string',
      required: true,
    },
    cardId: {
      ...idInput,
      required: true,
    },
    beforeId: idInput,
  },

  exits: {
    cardNotFound: {
      responseType: 'notFound',
    },
  },

  async fn(inputs) {
    const board = await sails.helpers.boards.getOnePublic(inputs.publicId);

    if (!board || !board.publicShowComments) {
      throw Errors.CARD_NOT_FOUND;
    }

    const card = await Card.qm.getOneById(inputs.cardId);

    // The card must belong to this board, otherwise a public id would grant read access to
    // comments on unrelated cards.
    if (!card || card.boardId !== board.id) {
      throw Errors.CARD_NOT_FOUND;
    }

    const comments = await Comment.qm.getByCardId(card.id, {
      beforeId: inputs.beforeId,
    });

    const userIds = sails.helpers.utils.mapRecords(comments, 'userId', true, true);
    const users = await User.qm.getByIds(userIds);

    return {
      items: comments,
      included: {
        users: sails.helpers.users.presentManyForPublic(users, board.publicId),
      },
    };
  },
};
