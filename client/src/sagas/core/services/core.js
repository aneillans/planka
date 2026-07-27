/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import { call, put, select } from 'redux-saga/effects';

import request from '../request';
import requests from '../requests';
import selectors from '../../../selectors';
import actions from '../../../actions';
import api from '../../../api';
import i18n from '../../../i18n';
import { removeAccessToken } from '../../../utils/access-token-storage';
import { HomeViews, ProjectOrders } from '../../../constants/Enums';

export function* initializeCore() {
  const { item: bootstrap } = yield call(request, api.getBootstrap); // TODO: handle error

  yield put(actions.initializeCore.fetchBootstrap(bootstrap));

  const {
    config,
    user,
    board,
    webhooks,
    users,
    projects,
    projectManagers,
    backgroundImages,
    baseCustomFieldGroups,
    boards,
    boardMemberships,
    labels,
    lists,
    cards,
    cardMemberships,
    cardLabels,
    taskLists,
    tasks,
    attachments,
    customFieldGroups,
    customFields,
    customFieldValues,
    notifications,
    notificationServices,
  } = yield call(requests.fetchCore); // TODO: handle error

  yield call(i18n.changeLanguage, user.language);
  yield call(i18n.loadCoreLocale);

  yield put(
    actions.initializeCore(
      config,
      user,
      board,
      webhooks,
      users,
      projects,
      projectManagers,
      backgroundImages,
      baseCustomFieldGroups,
      boards,
      boardMemberships,
      labels,
      lists,
      cards,
      cardMemberships,
      cardLabels,
      taskLists,
      tasks,
      attachments,
      customFieldGroups,
      customFields,
      customFieldValues,
      notifications,
      notificationServices,
    ),
  );
}

export function* changeCoreLanguage(language) {
  yield call(i18n.loadCoreLocale, language);
  yield call(i18n.changeLanguage, language);
}

export function* toggleFavorites(isEnabled) {
  yield put(actions.toggleFavorites(isEnabled));

  const currentUserId = yield select(selectors.selectCurrentUserId);

  try {
    yield call(request, api.updateUser, currentUserId, {
      enableFavoritesByDefault: isEnabled,
    });
  } catch {
    /* empty */
  }
}

export function* toggleEditMode(isEnabled) {
  yield put(actions.toggleEditMode(isEnabled));
}

export function* updateHomeView(value) {
  yield put(actions.updateHomeView(value));

  const currentUserId = yield select(selectors.selectCurrentUserId);

  try {
    yield call(request, api.updateUser, currentUserId, {
      defaultHomeView: value,
    });
  } catch {
    /* empty */
  }
}

export function* logout(revokeAccessToken) {
  yield call(removeAccessToken);

  if (revokeAccessToken) {
    yield put(actions.logout.revokeAccessToken());

    try {
      yield call(request, api.deleteCurrentAccessToken);
    } catch {
      /* empty */
    }
  }

  yield put(actions.logout()); // TODO: next url
}

// Anonymous visitor of a public board. The payload is fed through the very same CORE_INITIALIZE
// action the authenticated app uses, so the ordinary board tree renders it unchanged. The synthetic
// viewer arrives from the server with a `viewer` board membership, which is what makes every edit
// affordance resolve to read-only.
export function* initializePublicBoard(publicId) {
  let response;

  try {
    // Deliberately not routed through `request`: there is no access token to attach, and a failure
    // must not trigger the logout flow.
    response = yield call(api.getPublicBoard, publicId);
  } catch {
    yield put(actions.initializeCore.failPublicBoard());
    return;
  }

  const { item: board, included, publicUserId } = response;

  const publicUser = {
    ...included.users.find((user) => user.id === publicUserId),
    enableFavoritesByDefault: false,
    defaultHomeView: HomeViews.GROUPED_PROJECTS,
    defaultProjectsOrder: ProjectOrders.BY_DEFAULT,
    // There is no "recent" activity for an anonymous visitor to highlight.
    turnOffRecentCardHighlighting: true,
  };

  yield call(i18n.loadCoreLocale);

  yield put(
    actions.initializeCore(
      null, // config is administrator-only and stays unavailable publicly
      publicUser,
      board,
      [], // webhooks
      included.users,
      included.projects,
      [], // projectManagers
      [], // backgroundImages
      [], // baseCustomFieldGroups
      [], // boards
      included.boardMemberships,
      included.labels,
      included.lists,
      included.cards,
      included.cardMemberships,
      included.cardLabels,
      included.taskLists,
      included.tasks,
      included.attachments,
      included.customFieldGroups,
      included.customFields,
      included.customFieldValues,
      [], // notifications
      [], // notificationServices
    ),
  );
}

export default {
  initializeCore,
  initializePublicBoard,
  changeCoreLanguage,
  toggleFavorites,
  toggleEditMode,
  updateHomeView,
  logout,
};
