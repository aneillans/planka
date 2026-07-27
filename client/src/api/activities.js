/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import http from './http';
import socket from './socket';

/* Transformers */

export const transformActivity = (activity) => ({
  ...activity,
  ...(activity.createdAt && {
    createdAt: new Date(activity.createdAt),
  }),
});

/* Actions */

const getBoardActivities = (boardId, data, headers) =>
  socket.get(`/boards/${boardId}/actions`, data, headers).then((body) => ({
    ...body,
    items: body.items.map(transformActivity),
  }));

const getCardActivities = (cardId, data, headers) =>
  socket.get(`/cards/${cardId}/actions`, data, headers).then((body) => ({
    ...body,
    items: body.items.map(transformActivity),
  }));

// Public boards are read over plain HTTP: anonymous visitors have no authenticated socket.
const buildBeforeIdQuery = (data) =>
  data && data.beforeId ? `?beforeId=${encodeURIComponent(data.beforeId)}` : '';

const getPublicBoardActivities = (publicId, data, headers) =>
  http
    .get(
      `/public-boards/${encodeURIComponent(publicId)}/actions${buildBeforeIdQuery(data)}`,
      undefined,
      headers,
    )
    .then((body) => ({
      ...body,
      items: body.items.map(transformActivity),
    }));

const getPublicCardActivities = (publicId, cardId, data, headers) =>
  http
    .get(
      `/public-boards/${encodeURIComponent(publicId)}/cards/${cardId}/actions${buildBeforeIdQuery(data)}`,
      undefined,
      headers,
    )
    .then((body) => ({
      ...body,
      items: body.items.map(transformActivity),
    }));

/* Event handlers */

const makeHandleActivityCreate = (next) => (body) => {
  next({
    ...body,
    item: transformActivity(body.item),
  });
};

export default {
  getBoardActivities,
  getCardActivities,
  getPublicBoardActivities,
  getPublicCardActivities,
  makeHandleActivityCreate,
};
