/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

/**
 * @swagger
 * /public-boards/{publicId}:
 *   get:
 *     summary: Get public board details
 *     description: |
 *       Retrieves a read-only view of a board that has been shared publicly. Requires no
 *       authentication. Only active lists are returned, and all user-identifying data is omitted.
 *     tags:
 *       - Boards
 *     operationId: getPublicBoard
 *     security: []
 *     parameters:
 *       - name: publicId
 *         in: path
 *         required: true
 *         description: Public ID of the board to retrieve
 *         schema:
 *           type: string
 *           example: "b7QK2mTnV4xLpR8sYcW1dZgH"
 *     responses:
 *       200:
 *         description: Public board details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - item
 *                 - included
 *               properties:
 *                 item:
 *                   type: object
 *                 included:
 *                   type: object
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */

const Errors = {
  BOARD_NOT_FOUND: {
    boardNotFound: 'Board not found',
  },
};

// Only the fields required to render the read-only public view
const presentBoard = (board) => ({
  id: board.id,
  name: board.name,
  defaultView: board.defaultView,
  isPublic: board.isPublic,
});

const presentCard = (card) => ({
  id: card.id,
  boardId: card.boardId,
  listId: card.listId,
  type: card.type,
  position: card.position,
  name: card.name,
  description: card.description,
  dueDate: card.dueDate,
  isDueCompleted: card.isDueCompleted,
  commentsTotal: card.commentsTotal,
  createdAt: card.createdAt,
  updatedAt: card.updatedAt,
});

const presentList = (list) => ({
  id: list.id,
  boardId: list.boardId,
  type: list.type,
  position: list.position,
  name: list.name,
  color: list.color,
});

module.exports = {
  inputs: {
    publicId: {
      type: 'string',
      required: true,
    },
  },

  exits: {
    boardNotFound: {
      responseType: 'notFound',
    },
  },

  async fn(inputs) {
    const board = await Board.qm.getOneByPublicId(inputs.publicId);

    if (!board || !board.isPublic) {
      throw Errors.BOARD_NOT_FOUND;
    }

    const labels = await Label.qm.getByBoardId(board.id);
    const lists = await List.qm.getByBoardId(board.id);

    const activeLists = lists.filter((list) => list.type === List.Types.ACTIVE);
    const activeListIds = sails.helpers.utils.mapRecords(activeLists);

    const cards = await Card.qm.getByListIds(activeListIds);
    const cardIds = sails.helpers.utils.mapRecords(cards);

    const cardLabels = await CardLabel.qm.getByCardIds(cardIds);

    return {
      item: presentBoard(board),
      included: {
        labels,
        lists: activeLists.map(presentList),
        cards: cards.map(presentCard),
        cardLabels,
      },
    };
  },
};
