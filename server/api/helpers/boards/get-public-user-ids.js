/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

// The single definition of which users a public board may expose, derived from the board's own
// visibility flags. Used when building the public payload and when authorising public avatar
// requests, so those two can never disagree about who is visible.

module.exports = {
  inputs: {
    board: {
      type: 'ref',
      required: true,
    },
  },

  async fn(inputs) {
    const { board } = inputs;

    if (!board.isPublic) {
      return [];
    }

    const needsCards = board.publicShowMembers || board.publicShowComments;

    let cards = [];
    if (needsCards) {
      const lists = await List.qm.getByBoardId(board.id);
      const finiteLists = lists.filter((list) => sails.helpers.lists.isFinite(list));

      cards = await Card.qm.getByListIds(sails.helpers.utils.mapRecords(finiteLists));
    }

    let userIds = [];

    if (board.publicShowMembers) {
      const boardMemberships = await BoardMembership.qm.getByBoardId(board.id);

      userIds = _.union(
        userIds,
        sails.helpers.utils.mapRecords(boardMemberships, 'userId'),
        sails.helpers.utils.mapRecords(cards, 'creatorUserId', true, true),
      );
    }

    if (board.publicShowComments) {
      const comments = await Comment.qm.getByCardIds(sails.helpers.utils.mapRecords(cards));

      userIds = _.union(userIds, sails.helpers.utils.mapRecords(comments, 'userId', true, true));
    }

    if (board.publicShowActivity) {
      const actions = await Action.qm.getByBoardId(board.id);

      userIds = _.union(userIds, sails.helpers.utils.mapRecords(actions, 'userId', true, true));
    }

    return userIds;
  },
};
