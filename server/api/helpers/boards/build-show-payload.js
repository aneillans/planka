/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

// Shared by `boards/show` (authenticated) and `boards/show-public` (anonymous) so that both
// endpoints return the same payload shape, letting the client render the very same board tree.
//
// When `currentUser` is omitted the payload is built for an anonymous visitor: user-specific
// fields are dropped and optional facets are included only when the board opts into them.

const presentProjectForPublic = (record) => ({
  id: record.id,
  name: record.name,
});

module.exports = {
  inputs: {
    board: {
      type: 'ref',
      required: true,
    },
    project: {
      type: 'ref',
      required: true,
    },
    currentUser: {
      type: 'ref',
    },
    publicFacets: {
      type: 'ref',
    },
  },

  async fn(inputs) {
    const { board, project, currentUser } = inputs;

    const isForPublic = !currentUser;
    const facets = inputs.publicFacets || {};

    const showMembers = !isForPublic || !!facets.members;

    // Attachment files are served from a protected static directory, so anonymous visitors could
    // never download them. Their metadata is withheld rather than advertising unreachable files.
    const showAttachments = !isForPublic;

    const labels = await Label.qm.getByBoardId(board.id);
    const lists = await List.qm.getByBoardId(board.id);

    const finiteLists = lists.filter((list) => sails.helpers.lists.isFinite(list));
    const finiteListIds = sails.helpers.utils.mapRecords(finiteLists);

    const cards = await Card.qm.getByListIds(finiteListIds);
    const cardIds = sails.helpers.utils.mapRecords(cards);

    const cardLabels = await CardLabel.qm.getByCardIds(cardIds);

    const taskLists = await TaskList.qm.getByCardIds(cardIds);
    const taskListIds = sails.helpers.utils.mapRecords(taskLists);

    const tasks = await Task.qm.getByTaskListIds(taskListIds);

    const boardCustomFieldGroups = await CustomFieldGroup.qm.getByBoardId(board.id);
    const cardCustomFieldGroups = await CustomFieldGroup.qm.getByCardIds(cardIds);

    const customFieldGroups = [...boardCustomFieldGroups, ...cardCustomFieldGroups];
    const customFieldGroupIds = sails.helpers.utils.mapRecords(customFieldGroups);

    const customFields = await CustomField.qm.getByCustomFieldGroupIds(customFieldGroupIds);
    const customFieldValues = await CustomFieldValue.qm.getByCardIds(cardIds);

    const boardMemberships = showMembers ? await BoardMembership.qm.getByBoardId(board.id) : [];
    const cardMemberships = showMembers ? await CardMembership.qm.getByCardIds(cardIds) : [];

    const attachments = showAttachments ? await Attachment.qm.getByCardIds(cardIds) : [];

    // For public boards the visible user set is derived from the board's own flags, so comment and
    // activity authors are included even when membership itself is not exposed.
    let users = [];
    if (isForPublic) {
      users = await User.qm.getByIds(await sails.helpers.boards.getPublicUserIds(board));
    } else {
      users = await User.qm.getByIds(
        _.union(
          sails.helpers.utils.mapRecords(boardMemberships, 'userId'),
          sails.helpers.utils.mapRecords(cards, 'creatorUserId', true, true),
        ),
      );
    }

    if (isForPublic) {
      return {
        item: board,
        included: {
          boardMemberships,
          labels,
          lists: finiteLists,
          cards,
          cardMemberships,
          cardLabels,
          taskLists,
          tasks,
          customFieldGroups,
          customFields,
          customFieldValues,
          users: sails.helpers.users.presentManyForPublic(users, board.publicId),
          projects: [presentProjectForPublic(project)],
          attachments: sails.helpers.attachments.presentMany(attachments),
        },
      };
    }

    board.isSubscribed = await sails.helpers.users.isBoardSubscriber(currentUser.id, board.id);

    const cardSubscriptions = await CardSubscription.qm.getByCardIdsAndUserId(
      cardIds,
      currentUser.id,
    );

    const isSubscribedByCardId = cardSubscriptions.reduce(
      (result, cardSubscription) => ({
        ...result,
        [cardSubscription.cardId]: true,
      }),
      {},
    );

    cards.forEach((card) => {
      // eslint-disable-next-line no-param-reassign
      card.isSubscribed = isSubscribedByCardId[card.id] || false;
    });

    return {
      item: board,
      included: {
        boardMemberships,
        labels,
        lists,
        cards,
        cardMemberships,
        cardLabels,
        taskLists,
        tasks,
        customFieldGroups,
        customFields,
        customFieldValues,
        users: sails.helpers.users.presentMany(users, currentUser),
        projects: [project],
        attachments: sails.helpers.attachments.presentMany(attachments),
      },
    };
  },
};
