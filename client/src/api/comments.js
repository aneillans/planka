/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import http from './http';
import socket from './socket';

/* Transformers */

export const transformComment = (comment) => ({
  ...comment,
  ...(comment.createdAt && {
    createdAt: new Date(comment.createdAt),
  }),
});

/* Actions */

const getComments = (cardId, data, headers) =>
  socket.get(`/cards/${cardId}/comments`, data, headers).then((body) => ({
    ...body,
    items: body.items.map(transformComment),
  }));

// Public boards are read over plain HTTP: anonymous visitors have no authenticated socket.
const getPublicComments = (publicId, cardId, data, headers) => {
  const query = data && data.beforeId ? `?beforeId=${encodeURIComponent(data.beforeId)}` : '';

  return http
    .get(
      `/public-boards/${encodeURIComponent(publicId)}/cards/${cardId}/comments${query}`,
      undefined,
      headers,
    )
    .then((body) => ({
      ...body,
      items: body.items.map(transformComment),
    }));
};

const createComment = (cardId, data, headers) =>
  socket.post(`/cards/${cardId}/comments`, data, headers).then((body) => ({
    ...body,
    item: transformComment(body.item),
  }));

const updateComment = (id, data, headers) =>
  socket.patch(`/comments/${id}`, data, headers).then((body) => ({
    ...body,
    item: transformComment(body.item),
  }));

const deleteComment = (id, headers) =>
  socket.delete(`/comments/${id}`, undefined, headers).then((body) => ({
    ...body,
    item: transformComment(body.item),
  }));

/* Event handlers */

const makeHandleCommentCreate = (next) => (body) => {
  next({
    ...body,
    item: transformComment(body.item),
  });
};

const makeHandleCommentUpdate = makeHandleCommentCreate;

const makeHandleCommentDelete = makeHandleCommentUpdate;

export default {
  getComments,
  getPublicComments,
  createComment,
  updateComment,
  deleteComment,
  makeHandleCommentCreate,
  makeHandleCommentUpdate,
  makeHandleCommentDelete,
};
