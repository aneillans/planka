/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Loader, Message } from 'semantic-ui-react';

import selectors from '../../../selectors';
import Board from '../../boards/Board';

import styles from './PublicBoard.module.scss';

// Read-only shell around the ordinary board. Everything inside `Board` is the same code the
// authenticated app runs; it renders read-only because the synthetic public viewer holds a `viewer`
// board membership, which is what all of the edit affordances gate on.
const PublicBoard = React.memo(() => {
  const board = useSelector(selectors.selectCurrentBoard);
  const isNotFound = useSelector(selectors.selectIsPublicBoardNotFound);

  const [t] = useTranslation();

  useEffect(() => {
    if (board) {
      document.title = board.name;
    }
  }, [board]);

  if (isNotFound) {
    return (
      <div className={styles.wrapper}>
        <Message error className={styles.message}>
          <Message.Header>{t('common.boardNotFound', 'Board not found')}</Message.Header>
          <p>
            {t(
              'common.thisBoardIsEitherPrivateOrDoesNotExist',
              'This board is either private or does not exist.',
            )}
          </p>
        </Message>
      </div>
    );
  }

  if (!board) {
    return (
      <div className={styles.wrapper}>
        <Loader active size="massive" />
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <h1 className={styles.boardName}>{board.name}</h1>
        <div className={styles.badge}>{t('common.readOnlyPublicView', 'Read only')}</div>
      </div>
      <div className={styles.content}>
        <Board />
      </div>
    </div>
  );
});

export default PublicBoard;
