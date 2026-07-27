/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import { call } from 'redux-saga/effects';

import runWatchers from '../run-watchers';
import services from '../core/services';
import commentsWatchers from '../core/watchers/comments';
import activitiesWatchers from '../core/watchers/activities';

// A public board is a read-only snapshot: no login and no socket connection, so no realtime updates
// and no mutation watchers.
//
// Only the comment and activity watchers are run, because those two facets are lazily fetched by
// the card modal rather than arriving in the board payload. Everything else the board needs is
// already in the store, and running the remaining watchers would risk authenticated requests.
export default function* publicBoardSaga(publicId) {
  yield runWatchers([commentsWatchers, activitiesWatchers]);

  yield call(services.initializePublicBoard, publicId);
}
