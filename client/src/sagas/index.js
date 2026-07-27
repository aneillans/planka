/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import { call, select } from 'redux-saga/effects';

import loginSaga from './login';
import coreSaga from './core';
import publicBoardSaga from './public-board';
import selectors from '../selectors';
import matchPaths from '../utils/match-paths';
import Paths from '../constants/Paths';

export default function* rootSaga() {
  // Public boards are anonymous by design, so they must never fall through to the login flow.
  // Matched against the real location, since the store is not populated at this point.
  const publicBoardMatch = matchPaths(window.location.pathname, [
    Paths.PUBLIC_BOARDS,
    Paths.PUBLIC_CARDS,
  ]);

  if (publicBoardMatch) {
    yield call(publicBoardSaga, publicBoardMatch.params.publicId);
    return;
  }

  const accessToken = yield select(selectors.selectAccessToken);

  if (!accessToken) {
    yield call(loginSaga);
  }

  yield call(coreSaga);
}
