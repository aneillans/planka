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
 *       authentication. The payload mirrors `GET /boards/{id}` so the same board UI can render it,
 *       with a synthetic viewer whose board membership role is `viewer`. Optional facets (members,
 *       comments, activity) are included only when the board opts into them. Attachments are never
 *       included, since their files are not publicly downloadable.
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

    const project = await Project.qm.getOneById(board.projectId);

    if (!project) {
      throw Errors.BOARD_NOT_FOUND;
    }

    const payload = await sails.helpers.boards.buildShowPayload.with({
      board,
      project,
      publicFacets: {
        members: board.publicShowMembers,
        comments: board.publicShowComments,
        activity: board.publicShowActivity,
      },
    });

    // The client renders the ordinary board tree, which gates every edit affordance on the current
    // user's board membership. The synthetic viewer is deliberately given *no* membership: absence
    // makes all of those gates fall closed, so the board is read-only without a parallel set of
    // components, and member-only affordances (subscribe, join) stay hidden too.
    const publicUser = {
      ...User.PUBLIC,
      name: null,
      username: null,
    };

    return {
      item: board,
      included: {
        ...payload.included,
        users: [...payload.included.users, publicUser],
      },
      publicUserId: User.PUBLIC.id,
    };
  },
};
